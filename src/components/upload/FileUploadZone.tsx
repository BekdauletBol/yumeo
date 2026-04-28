'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { UploadCloud, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { parsePDF, extractPDFMetadataHints } from '@/lib/parsers/pdfParser';
import { parseDocx } from '@/lib/parsers/docxParser';
import { analyzeImage } from '@/lib/parsers/imageAnalyzer';
import { cn } from '@/lib/utils/cn';
import type { MaterialSection, CreateMaterialInput } from '@/lib/types';
import { createMaterialAction } from '@/app/actions/materials';
import { nanoid } from 'nanoid';

interface FileUploadZoneProps {
  section: MaterialSection;
  /** Compact mode for sidebar inline upload */
  compact?: boolean;
  onUploadComplete?: () => void;
}

type UploadStatus = 'idle' | 'dragging' | 'processing' | 'success' | 'error';

interface UploadProgress {
  filename: string;
  status: 'extracting' | 'saving' | 'done' | 'error';
  error?: string;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Cap extracted text at 200 000 chars (≈ 50k tokens) before saving to Supabase.
 * This prevents the Next.js server-action 1 MB body limit from being exceeded
 * while still providing far more content than the AI can use in one call.
 */
const MAX_CONTENT_CHARS = 200_000;


/** Extract text content from any file type */
async function extractContent(file: File): Promise<{
  content: string;
  metadata: CreateMaterialInput['metadata'];
}> {
  // PDF
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const result = await parsePDF(file);
    const hints = extractPDFMetadataHints(result.pages[0] ?? '', file.name);
    return {
      content: result.text,
      metadata: {
        fileType: 'pdf',
        fileSize: file.size,
        pageCount: result.pageCount,
        ...hints,
      },
    };
  }

  // Images
  if (file.type.startsWith('image/')) {
    const analysis = await analyzeImage(file);
    return {
      content: `${analysis.description}\n\nExtracted text:\n${analysis.extractedText}`,
      metadata: {
        fileType: 'image',
        fileSize: file.size,
        caption: analysis.suggestedCaption,
      },
    };
  }

  // BibTeX
  if (file.name.endsWith('.bib')) {
    return {
      content: await file.text(),
      metadata: { fileType: 'bibtex', fileSize: file.size },
    };
  }

  // Markdown
  if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
    return {
      content: await file.text(),
      metadata: { fileType: 'markdown', fileSize: file.size },
    };
  }

  // LaTeX
  if (file.name.endsWith('.tex')) {
    return {
      content: await file.text(),
      metadata: { fileType: 'latex', fileSize: file.size },
    };
  }

  // Mermaid / diagram
  if (file.name.endsWith('.mmd')) {
    return {
      content: await file.text(),
      metadata: { fileType: 'mermaid', fileSize: file.size },
    };
  }

  // DOCX / Office formats — extract real text using mammoth.js
  if (
    file.name.toLowerCase().endsWith('.docx') ||
    file.name.toLowerCase().endsWith('.doc') ||
    file.name.toLowerCase().endsWith('.odt') ||
    file.name.toLowerCase().endsWith('.rtf')
  ) {
    let content = '';
    try {
      const result = await parseDocx(file);
      content = result.text;
      if (result.warnings.length > 0) {
        console.warn('DOCX parse warnings:', result.warnings);
      }
    } catch (err) {
      console.error('mammoth DOCX extraction failed:', err);
      content = `[Could not extract text from ${file.name} — try converting to PDF]`;
    }
    return {
      content: content || `[No text content found in ${file.name}]`,
      metadata: { fileType: 'text', fileSize: file.size },
    };
  }

  // Plain text / CSV / any other readable format
  let content = '';
  try {
    content = await file.text();
  } catch {
    content = `[Binary file: ${file.name}]`;
  }

  return {
    content,
    metadata: {
      fileType: file.name.endsWith('.csv') ? 'text' : 'text',
      fileSize: file.size,
    },
  };
}

export function FileUploadZone({ section, compact = false, onUploadComplete }: FileUploadZoneProps) {
  const inputId = useId();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);

  const processFiles = useCallback(async (files: File[]) => {
    if (!activeProject) {
      console.warn('No active project — cannot upload files');
      return;
    }
    if (files.length === 0) return;

    setStatus('processing');
    const results: UploadProgress[] = files.map((f) => ({ filename: f.name, status: 'extracting' }));
    setProgress([...results]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      try {
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          results[i] = {
            filename: file.name,
            status: 'error',
            error: `Too large (max ${MAX_FILE_SIZE_MB} MB)`,
          };
          setProgress([...results]);
          continue;
        }

        // Determine actual section — use prop, but for "any file" drops use auto-detect
        const targetSection: MaterialSection = section;

        // Extract content (handles all formats gracefully)
        const { content: rawContent, metadata } = await extractContent(file);

        // Truncate to avoid exceeding Next.js server action body limit (1 MB default)
        const content = rawContent.length > MAX_CONTENT_CHARS
          ? rawContent.slice(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated — document too large to store in full]'
          : rawContent;

        results[i] = { filename: file.name, status: 'saving' };
        setProgress([...results]);

        const materialInput: CreateMaterialInput = {
          projectId: activeProject.id,
          section: targetSection,
          name: file.name,
          content,
          metadata,
        };

        try {
          // Try persisting to Supabase via server action
          const createdMaterial = await createMaterialAction(materialInput);
          addMaterial(createdMaterial);
        } catch (serverErr) {
          // Supabase not configured / offline — fall back to local-only store
          console.warn('Server action failed, using local store:', serverErr);
          const localMaterial = {
            id: nanoid(),
            projectId: activeProject.id,
            section: targetSection,
            name: file.name,
            content,
            metadata,
            createdAt: new Date(),
          };
          addMaterial(localMaterial);
        }

        results[i] = { filename: file.name, status: 'done' };
        setProgress([...results]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        results[i] = { filename: file.name, status: 'error', error: msg };
        setProgress([...results]);
      }
    }

    const hasError = results.some((r) => r.status === 'error');
    setStatus(hasError ? 'error' : 'success');

    setTimeout(() => {
      setStatus('idle');
      setProgress([]);
      onUploadComplete?.();
    }, 2500);
  }, [activeProject, section, addMaterial, onUploadComplete]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setStatus('dragging');
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    if (status === 'dragging') setStatus('idle');
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    void processFiles(files);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    void processFiles(files);
    e.target.value = '';
  }

  const isProcessing = status === 'processing';

  if (compact) {
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'upload-zone flex items-center gap-2 px-3 py-2 cursor-pointer text-xs',
          status === 'dragging' && 'dragging',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ color: 'var(--text-tertiary)' }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="sr-only"
          aria-label={`Upload ${section} files`}
        />
        {isProcessing ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <UploadCloud size={13} aria-hidden="true" />
        )}
        <span>{isProcessing ? 'Processing…' : 'Drop or click to upload'}</span>
      </label>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={cn(
          'upload-zone flex flex-col items-center gap-3 p-8 cursor-pointer transition-colors',
          status === 'dragging' && 'dragging',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={`Upload ${section} files`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="sr-only"
        />

        {isProcessing ? (
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: 'var(--text-accent)' }}
            aria-hidden="true"
          />
        ) : (
          <UploadCloud
            size={28}
            style={{ color: status === 'dragging' ? 'var(--text-accent)' : 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
        )}
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isProcessing
              ? 'Processing files…'
              : status === 'dragging'
              ? 'Release to upload'
              : <>Drop files here or <span style={{ color: 'var(--text-accent)' }}>browse</span></>}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            PDF, DOCX, TXT, MD, BibTeX, CSV, images · max {MAX_FILE_SIZE_MB} MB
          </p>
        </div>
      </label>

      {/* Progress list */}
      {progress.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Upload progress">
          {progress.map((p, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-xs px-2 py-1.5 rounded"
              style={{ background: 'var(--bg-elevated)' }}
            >
              {p.status === 'done' ? (
                <CheckCircle2 size={12} style={{ color: 'var(--status-success)' }} aria-label="Done" />
              ) : p.status === 'error' ? (
                <AlertCircle size={12} style={{ color: 'var(--status-error)' }} aria-label="Error" />
              ) : (
                <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
              )}
              <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {p.filename}
              </span>
              <span style={{ color: p.status === 'error' ? 'var(--status-error)' : 'var(--text-tertiary)' }}>
                {p.status === 'error' ? p.error : p.status === 'done' ? '✓' : p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}