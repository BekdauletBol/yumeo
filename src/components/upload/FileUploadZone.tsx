'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { UploadCloud, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
import { parsePDF, extractPDFMetadataHints } from '@/lib/parsers/pdfParser';
import { parseDocx } from '@/lib/parsers/docxParser';
import { analyzeImage } from '@/lib/parsers/imageAnalyzer';
import { cn } from '@/lib/utils/cn';
import type { MaterialSection, CreateMaterialInput } from '@/lib/types';
import { createMaterialAction, processMaterialAction } from '@/app/actions/materials';
import { nanoid } from 'nanoid';

interface FileUploadZoneProps {
  section: MaterialSection;
  sectionId?: string;
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
const MAX_PAGE_TEXT_CHARS = 120_000;
const MAX_PDF_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_PDF_IMAGE_PAGES = 25;
const MAX_PDF_IMAGES = 20;
const MAX_CONTENT_CHARS = 200_000;

async function extractContent(file: File) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const result = await parsePDF(file, {
      extractImages: file.size <= MAX_PDF_IMAGE_BYTES,
      maxImagePages: MAX_PDF_IMAGE_PAGES,
      maxImages: MAX_PDF_IMAGES,
    });
    const hints = extractPDFMetadataHints(result.pages[0] ?? '', file.name);
    return {
      content: result.text,
      metadata: { fileType: 'pdf' as const, fileSize: file.size, pageCount: result.pageCount, ...hints },
      images: result.images,
    };
  }
  if (file.type.startsWith('image/')) {
    const analysis = await analyzeImage(file);
    return {
      content: `${analysis.description}\n\nExtracted text:\n${analysis.extractedText}`,
      metadata: { fileType: 'image' as const, fileSize: file.size, caption: analysis.suggestedCaption },
    };
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
    const result = await parseDocx(file);
    return {
      content: result.text,
      metadata: { fileType: 'docx' as const, fileSize: file.size },
      images: result.images,
    };
  }
  return {
    content: await file.text(),
    metadata: { fileType: 'text' as const, fileSize: file.size },
    images: [],
  };
}

export function FileUploadZone({ section, sectionId, compact = false, onUploadComplete }: FileUploadZoneProps) {
  const inputId = useId();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);

  const processFiles = useCallback(async (files: File[]) => {
    if (!activeProject) return;
    setStatus('processing');
    const results: UploadProgress[] = files.map((f) => ({ filename: f.name, status: 'extracting' }));
    setProgress([...results]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      try {
        if (file.size > MAX_FILE_SIZE) throw new Error('File too large');
        const { content: raw, metadata, images } = await extractContent(file);
        const content = raw.length > MAX_CONTENT_CHARS ? raw.slice(0, MAX_CONTENT_CHARS) + '\n[Truncated]' : raw;
        
        results[i] = { filename: file.name, status: 'saving' };
        setProgress([...results]);

        const materialInput = { projectId: activeProject.id, section, sectionId, name: file.name, content, metadata };
        const created = await createMaterialAction(materialInput);
        addMaterial(created);
        
        if (images && images.length > 0) {
          const { createFigureAction } = await import('@/app/actions/figures');
          for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
            const imgData = images[imgIndex];
            if (imgData) {
              try {
                await createFigureAction({
                  projectId: activeProject.id,
                  materialId: created.id,
                  imageBase64: imgData,
                  caption: `Figure ${imgIndex + 1} from ${file.name}`,
                });
              } catch (e) {
                console.error('Failed to save figure:', e);
              }
            }
          }
        }
        
        if (created.status === 'processing') processMaterialAction(created);

        results[i] = { filename: file.name, status: 'done' };
        setProgress([...results]);
      } catch (err: any) {
        results[i] = { filename: file.name, status: 'error', error: err.message };
        setProgress([...results]);
      }
    }
    setStatus(results.some(r => r.status === 'error') ? 'error' : 'success');
    setTimeout(() => { setStatus('idle'); setProgress([]); onUploadComplete?.(); }, 2000);
  }, [activeProject, section, sectionId, addMaterial, onUploadComplete]);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); processFiles(Array.from(e.dataTransfer.files)); };
  
  if (compact) {
    return (
      <label htmlFor={inputId} className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer hover:border-accent-primary", status === 'dragging' && 'border-accent-primary')} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', fontFamily: 'var(--font-body)' }}>
        <input id={inputId} type="file" multiple onChange={(e) => processFiles(Array.from(e.target.files ?? []))} className="sr-only" />
        {status === 'processing' ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
        <span>{status === 'processing' ? 'working...' : 'upload reference'}</span>
      </label>
    );
  }

  return (
    <div className="w-full">
      <label htmlFor={inputId} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setStatus('dragging'); }} onDragLeave={() => setStatus('idle')} className={cn("flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer group", status === 'dragging' ? 'border-accent-primary' : 'border-border-subtle hover:border-border-default')} style={{ background: status === 'dragging' ? 'var(--bg-elevated)' : 'var(--bg-surface)' }}>
        <input id={inputId} type="file" multiple onChange={(e) => processFiles(Array.from(e.target.files ?? []))} className="sr-only" />
        <UploadCloud size={32} className={cn("mb-4 transition-colors", status === 'dragging' ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary')} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
          {status === 'processing' ? 'processing...' : status === 'dragging' ? 'release to upload' : 'drop research materials'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>PDF, BibTeX, DOCX · max 50MB</p>
      </label>
      
      {progress.length > 0 && (
        <div className="mt-4 space-y-2">
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border text-xs" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', fontFamily: 'var(--font-body)' }}>
              {p.status === 'done' ? <CheckCircle2 size={12} className="text-status-success" /> : p.status === 'error' ? <AlertCircle size={12} className="text-status-error" /> : <Loader2 size={12} className="animate-spin" />}
              <span className="flex-1 truncate text-text-secondary tracking-tight">{p.filename}</span>
              <span className={p.status === 'error' ? 'text-status-error' : 'text-text-tertiary'}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
