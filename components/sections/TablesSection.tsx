'use client';

import { useMemo } from 'react';
import { Table2 } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';

export function TablesSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const tables = useMemo(
    () => materials.filter((m) => m.section === 'tables'),
    [materials],
  );
  const highlightedId = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);

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
              <button
                key={table.id}
                onClick={() => setSelectedMaterialId(table.id)}
                aria-label={table.name}
                className="w-full text-left p-2.5 rounded-md transition-colors"
                style={{
                  background: isHighlighted ? 'rgba(240,160,80,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(240,160,80,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(240,160,80,0.1)', color: 'var(--accent-tables)', fontFamily: 'var(--font-mono)' }}
                    aria-hidden="true"
                  >
                    T{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {table.name}
                    </p>
                    {table.metadata.caption && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {table.metadata.caption}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          <FileUploadZone section="tables" compact />
        </div>
      )}
    </div>
  );
}