'use client';

import { useState, useRef, useEffect } from 'react';
import type { Citation } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { SECTION_LABELS } from '@/lib/types/material';
import { cn } from '@/lib/utils/cn';

interface CitationTagProps {
  citation: Citation;
  className?: string;
}

export function CitationTag({ citation, className }: CitationTagProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setHighlightedMaterialId = useUIStore((s) => s.setHighlightedMaterialId);

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

  function handleClick() {
    setOpen((v) => !v);
    setHighlightedMaterialId(open ? null : citation.materialId);
  }

  return (
    <span className="relative inline-block">
      <button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] transition-all border",
          open 
            ? "bg-accent-primary text-white border-accent-primary" 
            : "bg-bg-elevated text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-default",
          className
        )}
      >
        REF:{citation.refIndex}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-3 z-50 animate-slide-up"
          style={{ minWidth: 280, maxWidth: 360 }}
        >
          <div className="rounded-2xl shadow-xl p-5 bg-bg-overlay border border-border-default backdrop-blur-md bg-black/80">
            <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border-subtle">
              <div>
                <p className="text-[11px] font-bold text-text-primary leading-tight truncate max-w-[200px]">
                  {citation.materialName}
                </p>
                <p className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest mt-1">
                  {SECTION_LABELS[citation.section]}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-accent-primary text-white px-2 py-0.5 rounded-lg shrink-0">
                #{citation.refIndex}
              </span>
            </div>

            {citation.excerpt && (
              <blockquote className="text-xs leading-relaxed italic text-text-secondary border-l-2 border-accent-primary pl-3 my-2 font-body">
                &ldquo;{citation.excerpt}&rdquo;
              </blockquote>
            )}

            <div className="mt-4 flex items-center justify-between">
               <p className="text-[9px] font-mono font-bold text-text-tertiary uppercase tracking-tighter">
                Click sidebar item for full context
              </p>
              <p className="text-[9px] font-mono text-text-tertiary">ESC TO CLOSE</p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
