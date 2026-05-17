'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Citation } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { SECTION_LABELS } from '@/lib/types/material';
import { cn } from '@/lib/utils/cn';
import { ExternalLink } from 'lucide-react';

interface CitationTagProps {
  citation: Citation;
  className?: string;
}

/**
 * Splits a block of text into sentences based on common punctuation.
 */
function splitIntoSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

export function CitationTag({ citation, className }: CitationTagProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setHighlightedMaterialId = useUIStore((s) => s.setHighlightedMaterialId);
  const openCitationViewer = useUIStore((s) => s.openCitationViewer);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handleTagClick() {
    setOpen((v) => !v);
    setHighlightedMaterialId(open ? null : citation.materialId);
  }

  function handleViewClick() {
    openCitationViewer(citation.materialId, citation.pageNumber, citation.excerpt);
    setOpen(false);
  }

  // Highlight logic: find the most "relevant" sentence. 
  // In a real RAG app, the AI would provide this, but for now we'll 
  // highlight the first significant sentence in the excerpt.
  const highlightedExcerpt = useMemo(() => {
    if (!citation.excerpt) return null;
    const sentences = splitIntoSentences(citation.excerpt);
    if (sentences.length === 0) return citation.excerpt;

    // Highlight the first sentence that is at least 20 chars long
    const mainIdx = sentences.findIndex(s => s.trim().length > 20);
    const targetIdx = mainIdx === -1 ? 0 : mainIdx;

    return (
      <>
        {sentences.slice(0, targetIdx).join('')}
        <span className="bg-yellow-400/30 text-text-primary px-0.5 rounded-sm dark:bg-yellow-500/20">
          {sentences[targetIdx]}
        </span>
        {sentences.slice(targetIdx + 1).join('')}
      </>
    );
  }, [citation.excerpt]);

  return (
    <span className="relative inline-block">
      <button
        ref={ref}
        onClick={handleTagClick}
        className={cn(
          "px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] transition-all border shrink-0",
          open 
            ? "bg-accent-primary text-white border-accent-primary" 
            : "bg-bg-elevated text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-default",
          className
        )}
      >
        REF:{citation.refIndex}{citation.pageNumber ? `, p. ${citation.pageNumber}` : ''}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-3 z-50 animate-slide-up"
          style={{ minWidth: 320, maxWidth: 400 }}
        >
          <div className="rounded-2xl shadow-2xl p-5 border border-border-default backdrop-blur-md" style={{ background: 'var(--bg-overlay)' }}>
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-border-subtle">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-text-primary leading-tight truncate">
                  {citation.materialName}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] font-mono font-bold text-accent-primary uppercase tracking-widest border border-accent-primary/20 px-1.5 py-0.5 rounded-md">
                    {SECTION_LABELS[citation.section]}
                  </span>
                  {citation.pageNumber && (
                    <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">
                      Page {citation.pageNumber}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-accent-primary text-white px-2 py-0.5 rounded-lg shrink-0">
                #{citation.refIndex}
              </span>
            </div>

            {citation.excerpt && (
              <div className="text-[13px] leading-relaxed text-text-secondary border-l-2 border-accent-primary pl-4 my-4 font-body py-1">
                &ldquo;{highlightedExcerpt}&rdquo;
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-4">
              <button 
                onClick={handleViewClick}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-[11px] font-bold uppercase tracking-widest transition-all hover:opacity-90 shadow-lg shadow-accent-primary/10"
              >
                <ExternalLink size={12} /> Open in Viewer
              </button>
              <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-tighter">ESC to dismiss</p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
