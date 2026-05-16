'use client';

import { useEffect, useState } from 'react';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { useFiguresStore } from '@/stores/figuresStore';
import { useProjectStore } from '@/stores/projectStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { getFiguresAction, updateFigureOrderAction, updateFigureAction, deleteFigureAction } from '@/app/actions/figures';
import { cn } from '@/lib/utils/cn';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFigureItemProps {
  fig: any;
  index: number;
  onCaptionChange: (id: string, caption: string) => void;
  onAddToReport: (fig: any, index: number) => void;
  onDelete: (id: string) => void;
}

function SortableFigureItem({ fig, index, onCaptionChange, onAddToReport, onDelete }: SortableFigureItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fig.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'w-full text-left p-2.5 rounded-md transition-colors relative group',
        isDragging ? 'opacity-30 bg-[var(--bg-overlay)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="p-1 -ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={14} />
        </div>

        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden relative"
          style={{ background: 'rgba(95,207,128,0.1)', color: 'var(--accent-figures)' }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fig.url} alt="thumb" className="object-cover w-full h-full opacity-50" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-[10px] font-bold">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-figures)', fontFamily: 'var(--font-mono)' }}>
            Fig. {index + 1}
          </p>
          <input
            value={fig.caption || ''}
            onChange={(e) => onCaptionChange(fig.id, e.target.value)}
            placeholder="Add caption..."
            className="w-full text-xs mt-0.5 leading-snug bg-transparent border-none outline-none focus:border-b"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--accent-figures)' }}
          />
        </div>

        {/* Add to report button */}
        <button
          onClick={() => onAddToReport(fig, index)}
          className="absolute right-8 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
          style={{ color: 'var(--accent-figures)' }}
          title="Add to Report"
        >
          <PlusCircle size={14} />
        </button>

        {/* Delete button (visible on hover) */}
        <button
          onClick={() => onDelete(fig.id)}
          className="absolute right-2 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label={`Delete figure`}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function FiguresSection() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const figures = useFiguresStore((s) => s.figures);
  const setFigures = useFiguresStore((s) => s.setFigures);
  const removeFigure = useFiguresStore((s) => s.removeFigure);
  const updateFigure = useFiguresStore((s) => s.updateFigure);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (activeProject) {
      getFiguresAction(activeProject.id).then(setFigures).catch(console.error);
    }
  }, [activeProject, setFigures]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeProject) return;

    const oldIndex = figures.findIndex((f) => f.id === active.id);
    const newIndex = figures.findIndex((f) => f.id === over.id);

    const newFigures = arrayMove(figures, oldIndex, newIndex);
    setFigures(newFigures);

    const updates = newFigures.map((fig, idx) => ({
      id: fig.id,
      orderIndex: idx + 1,
    }));

    try {
      await updateFigureOrderAction(activeProject.id, updates);
    } catch (err) {
      console.error('Failed to update figure order:', err);
    }
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={figures.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {figures.map((fig, index) => (
                <SortableFigureItem
                  key={fig.id}
                  fig={fig}
                  index={index}
                  onCaptionChange={handleCaptionChange}
                  onAddToReport={handleAddToReport}
                  onDelete={async (id) => {
                    removeFigure(id);
                    await deleteFigureAction(id);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          <FileUploadZone section="figures" compact />
        </div>
      )}
    </div>
  );
}