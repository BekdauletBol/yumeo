'use client';

import { useMemo } from 'react';
import { BookMarked, ExternalLink, Calendar, Users } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { cn } from '@/lib/utils/cn';
import { truncate } from '@/lib/utils/truncate';

export function ReferencesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const references = useMemo(
    () => materials.filter((m) => m.section === 'references'),
    [materials],
  );
  const highlightedId = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);

  return (
    <div className="p-3 space-y-3">
      <p className="text-section-label" style={{ color: 'var(--accent-refs)' }}>
        References
        <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'none', letterSpacing: 0 }}>
          {references.length} files
        </span>
      </p>

      {references.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload PDFs, BibTeX files, or Markdown notes.
          </p>
          <FileUploadZone section="references" />
        </div>
      ) : (
        <div className="space-y-2">
          {references.map((ref) => {
            const isHighlighted = highlightedId === ref.id;
            return (
              <button
                key={ref.id}
                onClick={() => setSelectedMaterialId(ref.id)}
                aria-label={ref.name}
                className={cn(
                  'w-full text-left p-2.5 rounded-md transition-colors',
                  isHighlighted ? 'ring-1' : '',
                )}
                style={{
                  background: isHighlighted ? 'rgba(74,158,255,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(74,158,255,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <BookMarked size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-refs)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {ref.name}
                    </p>
                    {ref.metadata.authors && ref.metadata.authors.length > 0 && (
                      <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        <Users size={10} aria-hidden="true" />
                        {truncate(ref.metadata.authors.join(', '), 40)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {ref.metadata.year && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Calendar size={10} aria-hidden="true" />
                          {ref.metadata.year}
                        </span>
                      )}
                      {ref.metadata.doi && (
                        <span className="text-xs" style={{ color: 'var(--accent-refs)', fontFamily: 'var(--font-mono)' }}>
                          DOI
                        </span>
                      )}
                      {ref.metadata.pageCount && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {ref.metadata.pageCount}p
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add more */}
          <FileUploadZone section="references" compact />
        </div>
      )}
    </div>
  );
}