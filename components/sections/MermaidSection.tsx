'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { createMaterialAction } from '@/app/actions/materials';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
});

export function MermaidSection() {
  const source = useUIStore((s) => s.mermaidSource);
  const setSource = useUIStore((s) => s.setMermaidSource);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const diagrams = useMaterialsStore((s) => s.materials.filter(m => m.section === 'diagrams'));

  const handleSave = async () => {
    if (!activeProject || !source.trim()) return;
    const count = diagrams.length + 1;
    const name = `Diagram ${count}`;
    try {
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'diagrams',
        name,
        content: source,
        metadata: { fileType: 'text', fileSize: source.length, figureNumber: name }
      });
      addMaterial(material);
      setSource('');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, source)
      .then((result) => {
        if (cancelled) return;
        setSvg(result.svg);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to render mermaid';
        setError(message);
        setSvg('');
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div className="h-full grid grid-cols-2">
      <section className="border-r flex flex-col h-full" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          <span className="text-xs">Mermaid Source</span>
          <button
            onClick={handleSave}
            disabled={!source.trim()}
            className="px-2 py-1 text-xs border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--accent-diagrams)', color: 'var(--accent-diagrams)', fontFamily: 'var(--font-mono)', background: 'rgba(236,72,153,0.1)' }}
            aria-label="Save as Diagram material"
          >
            Save as Diagram
          </button>
        </div>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full h-[calc(100%-33px)] p-3 bg-transparent text-sm outline-none resize-none"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
          spellCheck={false}
          aria-label="Mermaid diagram source"
        />
      </section>
      <section>
        <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Live Preview
        </div>
        <div className="p-3 overflow-auto h-[calc(100%-33px)]">
          {error ? (
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--status-error)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </pre>
          ) : (
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
