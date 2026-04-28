'use client';

import { useMemo } from 'react';
import { FileText, Clock, Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { formatFileSize } from '@/lib/utils/truncate';

export function DraftsSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const drafts = useMemo(
    () => materials.filter((m) => m.section === 'drafts'),
    [materials],
  );
  const highlightedId     = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);

  return (
    <div className="p-3 space-y-3">
      <p className="text-section-label" style={{ color: 'var(--accent-drafts)' }}>
        Drafts
        <span
          className="ml-2 text-xs"
          style={{
            color: 'var(--text-tertiary)',
            textTransform: 'none',
            letterSpacing: 0,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {drafts.length} files
        </span>
      </p>

      {drafts.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload draft documents, notes, or markdown files.
          </p>
          <FileUploadZone section="drafts" />
        </div>
      ) : (
        <div className="space-y-2">
          {drafts.map((draft) => {
            const isHighlighted = highlightedId === draft.id;
            return (
              <button
                key={draft.id}
                onClick={() => setSelectedMaterialId(draft.id)}
                aria-label={draft.name}
                className="w-full text-left p-2.5 rounded-md transition-colors relative group"
                style={{
                  background: isHighlighted
                    ? 'rgba(155,143,255,0.08)'
                    : 'var(--bg-elevated)',
                  border: `1px solid ${
                    isHighlighted
                      ? 'rgba(155,143,255,0.4)'
                      : 'var(--border-subtle)'
                  }`,
                }}
              >
                <div className="flex items-start gap-2">
                  <FileText
                    size={12}
                    className="mt-0.5 shrink-0"
                    style={{ color: 'var(--accent-drafts)' }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {draft.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <Clock size={9} aria-hidden="true" />
                        {draft.createdAt.toLocaleDateString()}
                      </span>
                      {draft.metadata.fileSize ? (
                        <span
                          className="text-xs"
                          style={{
                            color: 'var(--text-tertiary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {formatFileSize(draft.metadata.fileSize)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMaterial(draft.id);
                    }}
                    className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={`Delete draft`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </button>
            );
          })}
          <FileUploadZone section="drafts" compact />
        </div>
      )}
    </div>
  );
}