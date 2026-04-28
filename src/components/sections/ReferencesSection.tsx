'use client';

import { useMemo } from 'react';
import { BookMarked, ExternalLink, Calendar, Users, Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { cn } from '@/lib/utils/cn';
import { truncate, formatFileSize } from '@/lib/utils/truncate';

export function ReferencesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const references = useMemo(
    () => materials.filter((m) => m.section === 'references'),
    [materials],
  );
  const highlightedId = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);

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
                <div className="flex items-start gap-2 group relative">
                  <BookMarked size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-refs)' }} />
                   <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {ref.name}
                    </p>
                    {ref.metadata.authors && ref.metadata.authors.length > 0 && (
                      <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        <Users size={10} aria-hidden="true" />
                        {truncate(ref.metadata.authors.join(', '), 40)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {ref.metadata.fileSize ? formatFileSize(ref.metadata.fileSize) : ''}
                      </span>
                      {ref.metadata.pageCount && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {ref.metadata.pageCount}p
                        </span>
                      )}
                    </div>
                    {/* Warn if no readable text was extracted */}
                    {(!ref.content || ref.content.trim().length < 50) && (
                      <p
                        className="text-xs mt-1.5 px-1.5 py-0.5 rounded inline-block"
                        style={{
                          background: 'rgba(251,146,60,0.12)',
                          border: '1px solid rgba(251,146,60,0.3)',
                          color: 'rgb(251,146,60)',
                        }}
                      >
                        ⚠ No readable text — delete &amp; re-upload
                      </p>
                    )}
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMaterial(ref.id);
                    }}
                    className="absolute right-0 top-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={`Delete ${ref.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
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