'use client';

import { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { useUIStore } from '@/stores/uiStore';

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
      <section className="border-r" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Mermaid Source
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
