'use client';

import { useMemo } from 'react';
import katex from 'katex';
import { useUIStore } from '@/stores/uiStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { createMaterialAction } from '@/app/actions/materials';
import { showToast } from '@/lib/utils/toast';

interface Segment {
  kind: 'text' | 'inline-math' | 'block-math';
  value: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseSegments(source: string): Segment[] {
  const segments: Segment[] = [];
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;
  let lastBlockIndex = 0;
  let blockMatch: RegExpExecArray | null;

  const pushInlineAndText = (text: string) => {
    const inlineRegex = /\$([^$\n]+?)\$/g;
    let lastInlineIndex = 0;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      const rawText = text.slice(lastInlineIndex, inlineMatch.index);
      if (rawText) segments.push({ kind: 'text', value: rawText });
      segments.push({ kind: 'inline-math', value: inlineMatch[1] ?? '' });
      lastInlineIndex = inlineMatch.index + inlineMatch[0].length;
    }
    const trailing = text.slice(lastInlineIndex);
    if (trailing) segments.push({ kind: 'text', value: trailing });
  };

  while ((blockMatch = blockRegex.exec(source)) !== null) {
    const textBefore = source.slice(lastBlockIndex, blockMatch.index);
    if (textBefore) pushInlineAndText(textBefore);
    segments.push({ kind: 'block-math', value: (blockMatch[1] ?? '').trim() });
    lastBlockIndex = blockMatch.index + blockMatch[0].length;
  }

  const remaining = source.slice(lastBlockIndex);
  if (remaining) pushInlineAndText(remaining);

  return segments;
}

export function LatexSection() {
  const source = useUIStore((s) => s.latexSource);
  const setSource = useUIStore((s) => s.setLatexSource);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);
  const equationsLength = useMaterialsStore((s) => s.materials.filter(m => m.section === 'equations').length);

  const handleSave = async () => {
    if (!activeProject || !source.trim()) {
      showToast('Please add LaTeX content first');
      return;
    }
    const count = equationsLength + 1;
    const name = `Equation ${count}`;
    try {
      const material = await createMaterialAction({
        projectId: activeProject.id,
        section: 'equations',
        name,
        content: source,
        metadata: { fileType: 'latex', fileSize: source.length, figureNumber: name }
      });
      addMaterial(material);
      showToast(`Equation "${name}" saved successfully`);
      // Optional: don't clear source automatically
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save equation';
      console.error('Save failed:', err);
      showToast(msg);
    }
  };

  const renderedHtml = useMemo(() => {
    const segments = parseSegments(source);
    return segments
      .map((segment) => {
        if (segment.kind === 'text') {
          return `<span>${escapeHtml(segment.value).replaceAll('\n', '<br/>')}</span>`;
        }
        try {
          return katex.renderToString(segment.value, {
            throwOnError: false,
            displayMode: segment.kind === 'block-math',
          });
        } catch {
          return `<code style="color:#f87171">${escapeHtml(segment.value)}</code>`;
        }
      })
      .join('');
  }, [source]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          LaTeX Editor
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!source.trim()}
            className="px-2 py-1 text-xs border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--accent-equations)', color: 'var(--accent-equations)', fontFamily: 'var(--font-mono)', background: 'rgba(95,160,207,0.1)' }}
            aria-label="Save as Equation material"
          >
            Save as Equation
          </button>
          <button
            onClick={() => window.print()}
            className="px-2 py-1 text-xs border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            aria-label="Export rendered LaTeX as PDF"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2">
        <section className="border-r" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Input
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-[calc(100%-33px)] p-3 bg-transparent text-sm outline-none resize-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            spellCheck={false}
            aria-label="LaTeX source input"
          />
        </section>

        <section>
          <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Preview
          </div>
          <div
            className="p-3 overflow-auto h-[calc(100%-33px)] text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </section>
      </div>
    </div>
  );
}
