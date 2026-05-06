'use client';

import { useMemo, useState } from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { updateMaterialOrderAction, updateMaterialAction } from '@/app/actions/materials';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/truncate';
import type { Material } from '@/lib/types';

export function FiguresSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const figures = useMemo(
    () => materials.filter((m) => m.section === 'figures').sort((a, b) => (a.metadata.order ?? 0) - (b.metadata.order ?? 0)),
    [materials],
  );
  const highlightedId = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);
  const removeMaterial = useMaterialsStore((s) => s.removeMaterial);

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const oldIndex = figures.findIndex(f => f.id === draggedId);
    const newIndex = figures.findIndex(f => f.id === targetId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newFigures = [...figures];
    const [draggedItem] = newFigures.splice(oldIndex, 1);
    if (!draggedItem) return;
    newFigures.splice(newIndex, 0, draggedItem);

    const updates = newFigures.map((fig, idx) => {
      const newMetadata = { ...fig.metadata, order: idx };
      updateMaterial({ ...fig, metadata: newMetadata });
      return { id: fig.id, metadata: newMetadata };
    });

    const first = newFigures[0];
    if (first) {
      await updateMaterialOrderAction(first.projectId, updates);
    }
    setDraggedId(null);
  };

  const handleCaptionChange = async (id: string, caption: string) => {
    const fig = figures.find(f => f.id === id);
    if (!fig) return;

    const newMetadata = { ...fig.metadata, caption };
    updateMaterial({ ...fig, metadata: newMetadata });

    await updateMaterialAction(id, { metadata: newMetadata });
  };

  /**
   * Flatten figures into individual entries.
   * PDFs with extractedImages produce one entry per page;
   * direct images produce one entry each.
   */
  const figureEntries = useMemo(() => {
    const entries: Array<{ fig: Material; pageIndex?: number; dataUrl?: string; label: string }> = [];
    let autoNum = 1;
    for (const fig of figures) {
      const imgs = fig.metadata.extractedImages;
      if (imgs && imgs.length > 0) {
        // PDF with extracted page images — one entry per page
        for (let p = 0; p < imgs.length; p++) {
          entries.push({
            fig,
            pageIndex: p,
            dataUrl: imgs[p],
            label: `Fig. ${autoNum++} (${fig.name}, p.${p + 1})`,
          });
        }
      } else {
        // Direct image upload or PDF without extracted images
        entries.push({
          fig,
          dataUrl: fig.metadata.imageDataUrl,
          label: fig.metadata.figureNumber ?? `Fig. ${autoNum++}`,
        });
      }
    }
    return entries;
  }, [figures]);

  return (
    <div className="p-3 space-y-3">
      <p className="text-section-label" style={{ color: 'var(--accent-figures)' }}>
        Figures
        <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
          {figureEntries.length} figures
        </span>
      </p>

      {figures.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload PNG, JPG, WebP, or PDF. Images will be extracted automatically.
            Drag a figure into the editor to insert{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-figures)' }}>
              [FIGURE: …]
            </span>{' '}
            markers.
          </p>
          <FileUploadZone section="figures" />
        </div>
      ) : (
        <div className="space-y-2">
          {figureEntries.map(({ fig, pageIndex, dataUrl, label }, index) => {
            const entryKey = pageIndex !== undefined ? `${fig.id}-p${pageIndex}` : fig.id;
            const isHighlighted = highlightedId === fig.id;
            return (
              <div
                key={entryKey}
                draggable
                onDragStart={(e) => {
                  // When dragged into the editor, insert a [FIGURE: ...] marker
                  const figRef = pageIndex !== undefined
                    ? `[FIGURE: ${fig.name}, ${label}]`
                    : `[FIGURE: ${fig.name}, ${label}]`;
                  e.dataTransfer.setData('text/plain', figRef);
                  handleDragStart(e, fig.id);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, fig.id)}
                onClick={() => setSelectedMaterialId(fig.id)}
                className={cn('w-full text-left p-2.5 rounded-md transition-colors relative group cursor-grab', draggedId === fig.id && 'opacity-50')}
                style={{
                  background: isHighlighted ? 'rgba(95,207,128,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(95,207,128,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(95,207,128,0.1)' }}
                    aria-hidden="true"
                  >
                    {dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dataUrl}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={16} style={{ color: 'var(--accent-figures)' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-6" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-figures)', fontFamily: 'var(--font-mono)' }}>
                      {label}
                    </p>
                    {/* Caption input only for the primary figure (not per-page entries) */}
                    {pageIndex === undefined && (
                      <input
                        value={fig.metadata.caption || ''}
                        onChange={(e) => handleCaptionChange(fig.id, e.target.value)}
                        placeholder="Add caption…"
                        className="w-full text-xs mt-0.5 leading-snug bg-transparent border-none outline-none focus:border-b"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--accent-figures)' }}
                      />
                    )}
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {pageIndex === undefined && fig.metadata.fileSize ? formatFileSize(fig.metadata.fileSize) : ''}
                        {pageIndex !== undefined ? `page ${pageIndex + 1}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Delete button (visible on hover, only for primary figure) */}
                  {pageIndex === undefined && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMaterial(fig.id);
                      }}
                      className="absolute right-2 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label="Delete figure"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Auto-numbering hint */}
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Drag a figure into the editor to insert a{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-figures)' }}>[FIGURE: …]</span>{' '}
            marker. The editor preview will render the image.
          </p>

          <FileUploadZone section="figures" compact />
        </div>
      )}
    </div>
  );
}
