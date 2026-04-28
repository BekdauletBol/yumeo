'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { CheckCircle2, Circle, ChevronRight, UploadCloud } from 'lucide-react';
import { showToast } from '@/lib/utils/toast';
import { parsePDF, extractPDFMetadataHints } from '@/lib/parsers/pdfParser';
import { parseDocx } from '@/lib/parsers/docxParser';
import { createMaterialAction } from '@/app/actions/materials';
import { nanoid } from 'nanoid';
import type { CreateMaterialInput } from '@/lib/types';

export function EmptyState() {
  const { user } = useUser();
  const { setRightPanelTab, setMobileTab } = useUIStore();
  const materials = useMaterialsStore((s) => s.materials);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasReferences = materials.some((m) => m.section === 'references');
  const hasDrafts = materials.some((m) => m.section === 'drafts' || m.section === 'templates');

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const name = user?.firstName || 'Researcher';

  // ── Drop handler ──────────────────────────────────────────────
  const processDroppedFiles = useCallback(
    async (files: File[]) => {
      if (!activeProject || files.length === 0) return;
      setIsProcessing(true);

      for (const file of files) {
        try {
          let content = '';
          let metadata: CreateMaterialInput['metadata'] = {
            fileType: 'text',
            fileSize: file.size,
          };

          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const result = await parsePDF(file);
            const hints = extractPDFMetadataHints(result.pages[0] ?? '', file.name);
            content = result.text;
            metadata = { fileType: 'pdf', fileSize: file.size, pageCount: result.pageCount, ...hints };
          } else if (
            file.name.toLowerCase().endsWith('.docx') ||
            file.name.toLowerCase().endsWith('.doc') ||
            file.name.toLowerCase().endsWith('.odt') ||
            file.name.toLowerCase().endsWith('.rtf')
          ) {
            // Use mammoth for proper DOCX text extraction
            try {
              const result = await parseDocx(file);
              content = result.text;
            } catch {
              content = `[Could not extract text from ${file.name} — try converting to PDF]`;
            }
            metadata = { fileType: 'text', fileSize: file.size };
          } else {
            try { content = await file.text(); } catch { content = `[Binary: ${file.name}]`; }
            metadata = { fileType: 'text', fileSize: file.size };
          }

          // Cap content to 200k chars to avoid server action body limit
          if (content.length > 200_000) {
            content = content.slice(0, 200_000) + '\n\n[Content truncated]';
          }

          const input: CreateMaterialInput = {
            projectId: activeProject.id,
            section: 'references',
            name: file.name,
            content,
            metadata,
          };

          try {
            const created = await createMaterialAction(input);
            addMaterial(created);
          } catch {
            // Offline / Supabase not configured — add locally only
            addMaterial({
              id: nanoid(),
              projectId: activeProject.id,
              section: 'references',
              name: file.name,
              content,
              metadata,
              createdAt: new Date(),
            });
          }
        } catch (err) {
          console.error('Drop upload failed for', file.name, err);
          showToast(`Failed to process ${file.name}`);
        }
      }

      setIsProcessing(false);
      showToast('Reference added. Ask me anything about it.');
    },
    [activeProject, addMaterial],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    void processDroppedFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    void processDroppedFiles(files);
    e.target.value = '';
  }

  function openRefs() {
    setRightPanelTab('references');
    setMobileTab('editor');
  }

  function openDrafts() {
    if (!hasReferences) return;
    setRightPanelTab('templates');
    setMobileTab('editor');
  }

  const steps: {
    label: string;
    badge: string;
    done: boolean;
    locked: boolean;
    action: () => void;
    description: string;
  }[] = [
    {
      label: 'Upload your references',
      badge: 'Start',
      done: hasReferences,
      locked: false,
      action: openRefs,
      description: 'Add PDFs, DOCX, TXT, BibTeX or Markdown',
    },
    {
      label: 'Write or generate a draft',
      badge: 'Open',
      done: hasDrafts,
      locked: !hasReferences,
      action: openDrafts,
      description: 'Use a template or ask the AI to write',
    },
    {
      label: 'Export your report',
      badge: 'Soon',
      done: false,
      locked: !hasDrafts,
      action: () => showToast('Save a draft first to unlock export.'),
      description: 'Download as DOCX or LaTeX',
    },
  ];

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6 transition-colors"
      style={{
        background: isDragging ? 'rgba(74,158,255,0.04)' : 'var(--bg-base)',
        border: isDragging ? '2px dashed rgba(74,158,255,0.4)' : '2px dashed transparent',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay hint */}
      {isDragging && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-10"
          style={{ background: 'rgba(17,17,17,0.85)' }}
        >
          <UploadCloud size={40} style={{ color: 'var(--accent-refs)' }} />
          <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
            Drop to add as reference
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            PDF, DOCX, TXT, Markdown, BibTeX…
          </p>
        </div>
      )}

      <div className="w-full max-w-sm space-y-8 relative">
        {/* Greeting */}
        <div className="space-y-1">
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            Good {timeOfDay}
          </p>
          <h2
            className="text-2xl font-medium"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {name}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Research starts here. Follow these steps.
          </p>
        </div>

        {/* Big drag-and-drop target on step 1 area */}
        <label
          className="flex flex-col items-center gap-3 p-6 rounded-lg cursor-pointer transition-all hover:opacity-90"
          style={{
            border: '2px dashed var(--border-default)',
            background: 'var(--bg-surface)',
          }}
          aria-label="Upload reference files"
        >
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileInput}
          />
          {isProcessing ? (
            <>
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent-refs)', borderTopColor: 'transparent' }}
              />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Processing…
              </p>
            </>
          ) : (
            <>
              <UploadCloud size={28} style={{ color: 'var(--accent-refs)' }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Drop any file here or{' '}
                  <span style={{ color: 'var(--accent-refs)' }}>browse</span>
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  PDF, DOCX, TXT, MD, BibTeX, CSV, images
                </p>
              </div>
            </>
          )}
        </label>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={step.action}
              disabled={step.locked}
              className="w-full group flex items-start gap-3 p-3.5 rounded-lg text-left transition-all"
              style={{
                background: step.done ? 'rgba(74,222,128,0.04)' : step.locked ? 'transparent' : 'var(--bg-surface)',
                border: `1px solid ${
                  step.done ? 'rgba(74,222,128,0.2)' : step.locked ? 'var(--border-subtle)' : 'var(--border-default)'
                }`,
                opacity: step.locked ? 0.45 : 1,
                cursor: step.locked ? 'not-allowed' : 'pointer',
              }}
              aria-disabled={step.locked}
              aria-label={step.label}
            >
              <span className="mt-0.5 shrink-0">
                {step.done ? (
                  <CheckCircle2 size={15} style={{ color: 'var(--status-success)' }} />
                ) : (
                  <Circle
                    size={15}
                    style={{ color: step.locked ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
                  />
                )}
              </span>

              <span className="flex-1 min-w-0">
                <span
                  className="block text-sm font-medium"
                  style={{
                    color: step.done ? 'var(--status-success)' : step.locked ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}
                >
                  {['①', '②', '③'][i]} {step.label}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {step.description}
                </span>
              </span>

              {!step.done && !step.locked && (
                <span
                  className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {step.badge}
                  <ChevronRight size={10} />
                </span>
              )}
            </button>
          ))}
        </div>

        <p
          className="text-center text-xs"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}
        >
          Every AI answer is grounded in your own materials.
        </p>
      </div>
    </div>
  );
}
