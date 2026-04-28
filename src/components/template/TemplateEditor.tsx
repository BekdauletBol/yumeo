'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, X, Save, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import { GeneratedOutput } from './GeneratedOutput';
import type { Material } from '@/lib/types';

interface TemplateEditorProps {
  existingMaterial?: Material;
  onClose: () => void;
}

const DEFAULT_TEMPLATE = `# {{title}}

## Abstract
{{abstract}}

## Introduction
{{introduction}}

## Related Work
{{related_work}}

## Methodology
{{methodology}}

## Results
{{results}}

## Discussion
{{discussion}}

## Conclusion
{{conclusion}}
`;

const PLACEHOLDER_HINT = `Use {{ placeholder_name }} syntax.
Examples: {{ abstract }}, {{ introduction }}, {{ related_work }}

Yumeo fills each placeholder using ONLY your uploaded materials.`;

/**
 * Full template authoring experience.
 * Uses a plain <textarea> (CodeMirror would be imported at runtime).
 * Sends to /api/generate and streams the filled output.
 */
export function TemplateEditor({ existingMaterial, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(existingMaterial?.name ?? 'New Template');
  const [body, setBody] = useState(existingMaterial?.content ?? DEFAULT_TEMPLATE);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const materials = useMaterialsStore((s) => s.materials);
  const addMaterial = useMaterialsStore((s) => s.addMaterial);
  const updateMaterial = useMaterialsStore((s) => s.updateMaterial);
  const activeProject = useProjectStore((s) => s.activeProject);

  // Count placeholders
  const placeholders = [...body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1] ?? '');
  const uniquePlaceholders = [...new Set(placeholders)];

  const handleSave = useCallback(() => {
    if (!activeProject) return;

    if (existingMaterial) {
      updateMaterial({ ...existingMaterial, name, content: body });
    } else {
      addMaterial({
        id: nanoid(),
        projectId: activeProject.id,
        section: 'templates',
        name,
        content: body,
        metadata: { fileType: 'markdown', fileSize: new Blob([body]).size },
        createdAt: new Date(),
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [activeProject, name, body, existingMaterial, addMaterial, updateMaterial]);

  const handleGenerate = useCallback(async () => {
    if (!activeProject || materials.length === 0) return;

    setIsGenerating(true);
    setGeneratedContent('');

    const systemPrompt = buildSystemPrompt(materials, activeProject.settings);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBody: body,
          systemPrompt,
          model: activeProject.settings.agentModel,
        }),
      });

      if (!response.ok || !response.body) {
        const err = (await response.json()) as { error?: string };
        setGeneratedContent(`Error: ${err.error ?? 'Generation failed'}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setGeneratedContent(accumulated);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setGeneratedContent(`Error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject, materials, body]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--accent-template)30', background: 'var(--bg-elevated)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Template name"
          className="flex-1 bg-transparent text-sm font-medium outline-none"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          placeholder="Template name…"
        />
        <button
          onClick={handleSave}
          aria-label="Save template"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
          style={{
            color: isSaved ? 'var(--status-success)' : 'var(--text-secondary)',
            background: 'var(--bg-overlay)',
          }}
        >
          <Save size={11} aria-hidden="true" />
          {isSaved ? 'Saved!' : 'Save'}
        </button>
        <button onClick={onClose} aria-label="Close template editor" className="p-1 rounded hover:opacity-70">
          <X size={14} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
        </button>
      </div>

      {/* Placeholder hints */}
      {uniquePlaceholders.length > 0 && (
        <div
          className="px-3 py-1.5 border-b flex flex-wrap gap-1"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Placeholders:</span>
          {uniquePlaceholders.map((p) => (
            <span
              key={p}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(240,112,112,0.1)',
                color: 'var(--accent-template)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {'{{'}{p}{'}}'}
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Template body"
        rows={12}
        className="w-full p-3 bg-transparent text-xs resize-none outline-none leading-relaxed"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          minHeight: 200,
        }}
        placeholder={PLACEHOLDER_HINT}
      />

      {/* Generate button */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => void handleGenerate()}
          disabled={isGenerating || materials.length === 0}
          aria-label={isGenerating ? 'Generating…' : 'Generate from materials'}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: isGenerating || materials.length === 0 ? 'var(--bg-overlay)' : 'var(--accent-template)',
            color: isGenerating || materials.length === 0 ? 'var(--text-tertiary)' : '#fff',
            opacity: materials.length === 0 ? 0.5 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Generating from {materials.length} sources…
            </>
          ) : (
            <>
              <Play size={14} aria-hidden="true" />
              Generate from Materials
            </>
          )}
        </button>
        {materials.length === 0 && (
          <p className="text-xs text-center mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Upload materials first
          </p>
        )}
      </div>

      {/* Generated output */}
      {(generatedContent || isGenerating) && (
        <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <GeneratedOutput
            content={generatedContent}
            templateName={name}
            isStreaming={isGenerating}
          />
        </div>
      )}
    </div>
  );
}