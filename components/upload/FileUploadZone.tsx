'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { parsePDF, extractPDFMetadataHints } from '@/lib/parsers/pdfParser';
import { analyzeImage } from '@/lib/parsers/imageAnalyzer';
import { validateFileMagicBytes } from '@/lib/security/sanitize';
import { formatFileSize } from '@/lib/utils/truncate';
import { cn } from '@/lib/utils/cn';
import type { MaterialSection, CreateMaterialInput } from '@/lib/types';

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

const ACCEPTED_TYPES: Record<MaterialSection, string[]> = {
  references: ['.pdf', '.bib', '.txt', '.md'],
  drafts:     ['.pdf', '.txt', '.md'],
  figures:    ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
  tables:     ['.pdf', '.txt', '.csv', '.md'],
  templates:  ['.txt', '.md'],
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function FileUploadZone({ section, compact = false, onUploadComplete }: FileUploadZoneProps) {
  const inputId = useId();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);

  const processFiles = useCallback(async (files: File[]) => {
    if (!activeProject) return;

    setStatus('processing');
    const results: UploadProgress[] = files.map((f) => ({ filename: f.name, status: 'extracting' }));
    setProgress(results);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      try {
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          results[i] = { filename: file.name, status: 'error', error: `File too large (max ${MAX_FILE_SIZE_MB} MB)` };
          setProgress([...results]);
          continue;
        }

        // Validate magic bytes
        const isValidMagic = await validateFileMagicBytes(file);
        if (!isValidMagic) {
          results[i] = { filename: file.name, status: 'error', error: 'File type mismatch — possibly corrupted' };
          setProgress([...results]);
          continue;
        }

        let content = '';
        let metadata: CreateMaterialInput['metadata'] = {
          fileType: 'text',
          fileSize: file.size,
        };

        // Extract content based on type
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const result = await parsePDF(file);
          content = result.text;
          const hints = extractPDFMetadataHints(result.pages[0] ?? '', file.name);
          metadata = {
            fileType: 'pdf',
            fileSize: file.size,
            pageCount: result.pageCount,
            ...hints,
          };
        } else if (file.type.startsWith('image/')) {
          const analysis = await analyzeImage(file);
          content = `${analysis.description}\n\nExtracted text:\n${analysis.extractedText}`;
          metadata = {
            fileType: 'image',
            fileSize: file.size,
            caption: analysis.suggestedCaption,
          };
        } else if (file.name.endsWith('.bib')) {
          content = await file.text();
          metadata = { fileType: 'bibtex', fileSize: file.size };
        } else if (file.name.endsWith('.md')) {
          content = await file.text();
          metadata = { fileType: 'markdown', fileSize: file.size };
        } else {
          content = await file.text();
          metadata = { fileType: 'text', fileSize: file.size };
        }

        results[i] = { filename: file.name, status: 'saving' };
        setProgress([...results]);

        // Add to store (in a real app, also persist to Supabase here)
        const material: CreateMaterialInput = {
          projectId: activeProject.id,
          section,
          name: file.name,
          content,
          metadata,
        };

        addMaterial({ id: nanoid(), ...material, createdAt: new Date() });

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
    }, 2000);
  }, [activeProject, section, addMaterial, onUploadComplete]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setStatus('dragging');
  }
  function handleDragLeave() {
    if (status === 'dragging') setStatus('idle');
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    void processFiles(files);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    void processFiles(files);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  }

  const acceptedTypes = ACCEPTED_TYPES[section].join(',');

  if (compact) {
    return (
      <label
        htmlFor={inputId}
        className={cn('upload-zone flex items-center gap-2 px-3 py-2 cursor-pointer text-xs', status === 'dragging' && 'dragging')}
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
          accept={acceptedTypes}
          onChange={handleChange}
          className="sr-only"
          aria-label={`Upload ${section} files`}
        />
        <UploadCloud size={13} aria-hidden="true" />
        <span>{status === 'processing' ? 'Processing…' : 'Drop or click to upload'}</span>
      </label>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={cn('upload-zone flex flex-col items-center gap-3 p-8 cursor-pointer', status === 'dragging' && 'dragging')}
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
          accept={acceptedTypes}
          onChange={handleChange}
          className="sr-only"
        />

        <UploadCloud
          size={28}
          style={{ color: status === 'dragging' ? 'var(--text-accent)' : 'var(--text-tertiary)' }}
          aria-hidden="true"
        />
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Drop files here or <span style={{ color: 'var(--text-accent)' }}>browse</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {ACCEPTED_TYPES[section].join(', ')} · max {MAX_FILE_SIZE_MB} MB
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
                <File size={12} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
              )}
              <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {p.filename}
              </span>
              <span style={{ color: p.status === 'error' ? 'var(--status-error)' : 'var(--text-tertiary)' }}>
                {p.status === 'error' ? p.error : p.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}