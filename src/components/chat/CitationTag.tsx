'use client';

import { useState, useRef, useEffect } from 'react';
import type { Citation } from '@/lib/types';
import { useUIStore } from '@/stores/uiStore';
import { SECTION_LABELS, SECTION_ACCENT } from '@/lib/types/material';
import { cn } from '@/lib/utils/cn';

interface CitationTagProps {
  citation: Citation;
  className?: string;
}

/**
 * Inline citation chip that shows a popover with the source excerpt on click.
 * Clicking the chip also highlights the source material in the sidebar.
 */
export function CitationTag({ citation, className }: CitationTagProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setHighlightedMaterialId = useUIStore((s) => s.setHighlightedMaterialId);

  const accent = SECTION_ACCENT[citation.section];

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
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
        aria-label={`Citation: ${citation.materialName}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn('citation-chip', className)}
        style={{
          background: `${accent}15`,
          border: `1px solid ${accent}40`,
          color: accent,
        }}
      >
        REF:{citation.refIndex}
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Source: ${citation.materialName}`}
          className="absolute bottom-full left-0 mb-2 z-50 animate-slide-up"
          style={{ minWidth: 260, maxWidth: 340 }}
        >
          <div
            className="rounded-lg shadow-xl p-3"
            style={{
              background: 'var(--bg-overlay)',
              border: `1px solid ${accent}30`,
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {/* Source name */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {citation.materialName}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: accent, fontFamily: 'var(--font-mono)' }}
                >
                  {SECTION_LABELS[citation.section]}
                </p>
              </div>
              <span
                className="text-xs px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: `${accent}18`,
                  color: accent,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                REF:{citation.refIndex}
              </span>
            </div>

            {/* Excerpt */}
            {citation.excerpt && (
              <blockquote
                className="text-xs leading-relaxed border-l-2 pl-2 mt-1"
                style={{
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-default)',
                }}
              >
                &ldquo;{citation.excerpt}&rdquo;
              </blockquote>
            )}

            {/* Close hint */}
            <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Press <kbd style={{ fontFamily: 'var(--font-mono)' }}>Esc</kbd> or click outside to close
            </p>
          </div>
        </div>
      )}
    </span>
  );
}