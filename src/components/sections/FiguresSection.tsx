'use client';

import { useMemo, useState } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { updateMaterialOrderAction, updateMaterialAction } from '@/app/actions/materials';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/truncate';

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

    // Update order metadata
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

  return (
    <div className="p-3 space-y-3">
      <p className="text-section-label" style={{ color: 'var(--accent-figures)' }}>
        Figures
        <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
          {figures.length} files
        </span>
      </p>

      {figures.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload PNG, JPG, or WebP images. Claude will analyze and caption them.
          </p>
          <FileUploadZone section="figures" />
        </div>
      ) : (
        <div className="space-y-2">
          {figures.map((fig, index) => {
            const isHighlighted = highlightedId === fig.id;
            const figNum = fig.metadata.figureNumber ?? `Fig. ${index + 1}`;
            return (
              <div
                key={fig.id}
                draggable
                onDragStart={(e) => handleDragStart(e, fig.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, fig.id)}
                onClick={() => setSelectedMaterialId(fig.id)}
                className={cn('w-full text-left p-2.5 rounded-md transition-colors relative group', draggedId === fig.id && 'opacity-50')}
                style={{
                  background: isHighlighted ? 'rgba(95,207,128,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(95,207,128,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold cursor-grab"
                    style={{ background: 'rgba(95,207,128,0.1)', color: 'var(--accent-figures)' }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-6" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-figures)', fontFamily: 'var(--font-mono)' }}>
                      {figNum}
                    </p>
                    <input
                      value={fig.metadata.caption || ''}
                      onChange={(e) => handleCaptionChange(fig.id, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full text-xs mt-0.5 leading-snug bg-transparent border-none outline-none focus:border-b"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--accent-figures)' }}
                    />
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {fig.metadata.fileSize ? formatFileSize(fig.metadata.fileSize) : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMaterial(fig.id);
                    }}
                    className="absolute right-2 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={`Delete figure`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          <FileUploadZone section="figures" compact />
        </div>
      )}
    </div>
  );
}