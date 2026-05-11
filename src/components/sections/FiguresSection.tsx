'use client';

import { useEffect, useState } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';
import { useFiguresStore } from '@/stores/figuresStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { getFiguresAction, updateFigureOrderAction, updateFigureAction, deleteFigureAction } from '@/app/actions/figures';
import { cn } from '@/lib/utils/cn';

export function FiguresSection() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const figures = useFiguresStore((s) => s.figures);
  const setFigures = useFiguresStore((s) => s.setFigures);
  const removeFigure = useFiguresStore((s) => s.removeFigure);
  const updateFigure = useFiguresStore((s) => s.updateFigure);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject) {
      getFiguresAction(activeProject.id).then(setFigures).catch(console.error);
    }
  }, [activeProject, setFigures]);

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
    if (!draggedId || draggedId === targetId || !activeProject) return;

    const oldIndex = figures.findIndex(f => f.id === draggedId);
    const newIndex = figures.findIndex(f => f.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newFigures = [...figures];
    const [draggedItem] = newFigures.splice(oldIndex, 1);
    if (!draggedItem) return;
    newFigures.splice(newIndex, 0, draggedItem);

    const updates = newFigures.map((fig, idx) => {
      const orderIndex = idx + 1;
      updateFigure({ ...fig, orderIndex });
      return { id: fig.id, orderIndex };
    });

    await updateFigureOrderAction(activeProject.id, updates);
    setDraggedId(null);
  };

  const handleCaptionChange = async (id: string, caption: string) => {
    const fig = figures.find(f => f.id === id);
    if (!fig) return;
    
    updateFigure({ ...fig, caption });
    await updateFigureAction(id, { caption });
  };

  const handleAddToReport = (fig: any, index: number) => {
    const content = `<img src="${fig.url}" alt="Figure ${index + 1}: ${fig.caption}" /><br/><em>[Figure ${index + 1}: ${fig.caption}]</em><br/>`;
    window.dispatchEvent(new CustomEvent('insert-editor-content', { detail: { content } }));
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
            Upload PDF/DOCX or images. Extracted figures will appear here.
          </p>
          <FileUploadZone section="figures" />
        </div>
      ) : (
        <div className="space-y-2">
          {figures.map((fig, index) => {
            return (
              <div
                key={fig.id}
                draggable
                onDragStart={(e) => handleDragStart(e, fig.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, fig.id)}
                className={cn('w-full text-left p-2.5 rounded-md transition-colors relative group', draggedId === fig.id && 'opacity-50')}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold cursor-grab overflow-hidden"
                    style={{ background: 'rgba(95,207,128,0.1)', color: 'var(--accent-figures)' }}
                    aria-hidden="true"
                  >
                    <img src={fig.url} alt="thumb" className="object-cover w-full h-full opacity-50" />
                    <span className="absolute">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-figures)', fontFamily: 'var(--font-mono)' }}>
                      Fig. {index + 1}
                    </p>
                    <input
                      value={fig.caption || ''}
                      onChange={(e) => handleCaptionChange(fig.id, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full text-xs mt-0.5 leading-snug bg-transparent border-none outline-none focus:border-b"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--accent-figures)' }}
                    />
                  </div>
                  
                  {/* Add to report button */}
                  <button
                    onClick={() => handleAddToReport(fig, index)}
                    className="absolute right-8 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                    style={{ color: 'var(--accent-figures)' }}
                    title="Add to Report"
                  >
                    <PlusCircle size={14} />
                  </button>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={async () => {
                      removeFigure(fig.id);
                      await deleteFigureAction(fig.id);
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