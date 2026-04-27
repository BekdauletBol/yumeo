'use client';

import { useState, useCallback } from 'react';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';

interface UseTemplateGenResult {
  generatedContent: string;
  isGenerating: boolean;
  error: string | null;
  generate: (templateBody: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook encapsulating the full template generation lifecycle.
 * Streams the response from /api/generate into local state.
 */
export function useTemplateGen(): UseTemplateGenResult {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating]         = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const materials     = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);

  const generate = useCallback(async (templateBody: string) => {
    if (!activeProject || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

    const systemPrompt = buildSystemPrompt(materials, activeProject.settings);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBody,
          systemPrompt,
          model: activeProject.settings.agentModel,
        }),
      });

      if (!res.ok || !res.body) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Generation failed');
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setGeneratedContent((prev) => prev + chunk);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject, isGenerating, materials]);

  const reset = useCallback(() => {
    setGeneratedContent('');
    setError(null);
  }, []);

  return { generatedContent, isGenerating, error, generate, reset };
}