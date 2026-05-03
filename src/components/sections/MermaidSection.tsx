'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { createMaterialAction } from '@/app/actions/materials';
import { showToast } from '@/lib/utils/toast';

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
  const diagramsLength = useMaterialsStore((s) => s.materials.filter(m => m.section === 'diagrams').length);

  const handleSave = async () => {
    if (!activeProject || !source.trim()) {
      showToast('Please add diagram content first');
      return;
    }
    const count = diagramsLength + 1;
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
      showToast(`Diagram "${name}" saved successfully`);
      // Optional: don't clear source automatically so they can keep editing if they want
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save diagram';
      console.error('Save failed:', err);
      showToast(msg);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Debounce mermaid rendering to avoid freezing the UI on every keystroke
  useEffect(() => {
    if (!source.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
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
          // Keep previous SVG if there's a syntax error while typing
        });
    }, 500); // 500ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [source]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Mermaid Editor
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!source.trim()}
            className="px-3 py-1 text-xs border rounded-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ 
              borderColor: 'var(--accent-diagrams)', 
              color: 'var(--accent-diagrams)', 
              fontFamily: 'var(--font-mono)', 
              background: 'rgba(236,72,153,0.1)' 
            }}
            aria-label="Save as Diagram material"
          >
            Save as Diagram
          </button>
          <button
            onClick={downloadSvg}
            disabled={!svg}
            className="px-3 py-1 text-xs border rounded-sm transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ 
              borderColor: 'var(--border-default)', 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-mono)' 
            }}
            aria-label="Download as SVG"
          >
            Download SVG
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2">
        <section className="border-r flex flex-col h-full" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Source
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-full p-3 bg-transparent text-sm outline-none resize-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            spellCheck={false}
            aria-label="Mermaid diagram source"
          />
        </section>
        
        <section className="flex flex-col h-full">
          <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Live Preview
          </div>
          <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/20">
            {error ? (
              <pre className="text-xs whitespace-pre-wrap max-w-full" style={{ color: 'var(--status-error)', fontFamily: 'var(--font-mono)' }}>
                {error}
              </pre>
            ) : svg ? (
              <div
                className="w-full max-w-2xl bg-transparent flex justify-center mermaid-preview"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <span className="text-xs text-center" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Type on the left to render a diagram
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
