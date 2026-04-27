'use client';

import { useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useUIStore } from '@/stores/uiStore';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { cn } from '@/lib/utils/cn';

export function FiguresSection() {
  const materials = useMaterialsStore((s) => s.materials);
  const figures = useMemo(
    () => materials.filter((m) => m.section === 'figures'),
    [materials],
  );
  const highlightedId = useUIStore((s) => s.highlightedMaterialId);
  const setSelectedMaterialId = useMaterialsStore((s) => s.setSelectedMaterialId);

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
              <button
                key={fig.id}
                onClick={() => setSelectedMaterialId(fig.id)}
                aria-label={fig.metadata.caption ?? fig.name}
                className={cn('w-full text-left p-2.5 rounded-md transition-colors')}
                style={{
                  background: isHighlighted ? 'rgba(95,207,128,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isHighlighted ? 'rgba(95,207,128,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(95,207,128,0.1)', color: 'var(--accent-figures)' }}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-figures)', fontFamily: 'var(--font-mono)' }}>
                      {figNum}
                    </p>
                    {fig.metadata.caption && (
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {fig.metadata.caption}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          <FileUploadZone section="figures" compact />
        </div>
      )}
    </div>
  );
}