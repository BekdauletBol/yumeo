'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { updateMaterialOrderAction, updateMaterialAction } from '@/app/actions/materials';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/truncate';

export function TablesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const tables = useMemo(
    () => materials.filter((m) => m.section === 'tables').sort((a, b) => (a.metadata.order ?? 0) - (b.metadata.order ?? 0)),
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

    const oldIndex = tables.findIndex(f => f.id === draggedId);
    const newIndex = tables.findIndex(f => f.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newTables = [...tables];
    const [draggedItem] = newTables.splice(oldIndex, 1);
    if (!draggedItem) return;
    newTables.splice(newIndex, 0, draggedItem);

    const updates = newTables.map((tab, idx) => {
      const newMetadata = { ...tab.metadata, order: idx };
      updateMaterial({ ...tab, metadata: newMetadata });
      return { id: tab.id, metadata: newMetadata };
    });

    const first = newTables[0];
    if (first) {
      await updateMaterialOrderAction(first.projectId, updates);
    }
    setDraggedId(null);
  };

  const handleCaptionChange = async (id: string, caption: string) => {
    const tab = tables.find(f => f.id === id);
    if (!tab) return;
    
    const newMetadata = { ...tab.metadata, caption };
    updateMaterial({ ...tab, metadata: newMetadata });
    
    await updateMaterialAction(id, { metadata: newMetadata });
  };

  return (
    <div className="p-3 space-y-3">
      <p className="text-section-label" style={{ color: 'var(--accent-tables)' }}>
        Tables
        <span className="ml-2 text-xs" style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-mono)' }}>
          {tables.length} files
        </span>
      </p>

      {tables.length === 0 ? (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Upload CSV, Markdown tables, or PDFs containing data tables.
          </p>
          <FileUploadZone section="tables" />
        </div>
      ) : (
        <div className="space-y-2">
          {tables.map((table, index) => {
            const isHighlighted = highlightedId === table.id;
            return (
              <div
                key={table.id}
                draggable
                onDragStart={(e) => handleDragStart(e, table.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, table.id)}
                onClick={() => setSelectedMaterialId(table.id)}
                className={cn('w-full text-left p-2.5 rounded-md transition-colors relative group', draggedId === table.id && 'opacity-50')}
                style={{
                  background: isHighlighted ? 'rgba(240,160,80,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(240,160,80,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold cursor-grab"
                    style={{ background: 'rgba(240,160,80,0.1)', color: 'var(--accent-tables)', fontFamily: 'var(--font-mono)' }}
                    aria-hidden="true"
                  >
                    T{index + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-6" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {table.name}
                    </p>
                    <input
                      value={table.metadata.caption || ''}
                      onChange={(e) => handleCaptionChange(table.id, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full text-xs mt-0.5 leading-snug bg-transparent border-none outline-none focus:border-b"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--accent-tables)' }}
                    />
                    <div className="mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {table.metadata.fileSize ? formatFileSize(table.metadata.fileSize) : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMaterial(table.id);
                    }}
                    className="absolute right-2 top-2.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-white/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label={`Delete table`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          <FileUploadZone section="tables" compact />
        </div>
      )}
    </div>
  );
}