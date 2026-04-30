'use client';

import { useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import type { ReportGenerationResponse } from '@/lib/types';

function isReportGenerationResponse(
  data: ReportGenerationResponse | { error?: string },
): data is ReportGenerationResponse {
  return typeof (data as ReportGenerationResponse).draft === 'object';
}

interface UseTemplateGenResult {
  generatedContent: string;
  isGenerating: boolean;
  error: string | null;
  generate: (templateBody: string) => Promise<void>;
  reset: () => void;
  reportResult: ReportGenerationResponse | null;
}

/**
 * Hook encapsulating the full template generation lifecycle.
 * Streams the response from /api/generate into local state.
 */
export function useTemplateGen(): UseTemplateGenResult {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating]         = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [reportResult, setReportResult]         = useState<ReportGenerationResponse | null>(null);

  const activeProject = useProjectStore((s) => s.activeProject);

  const generate = useCallback(async (templateBody: string) => {
    if (!activeProject || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBody,
          model: activeProject.settings.agentModel,
          projectId: activeProject.id,
          userQuery: templateBody,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Generation failed');
      }

      const data = (await res.json()) as ReportGenerationResponse | { error?: string };
      if ('error' in data && data.error) {
        setReportResult(null);
        setGeneratedContent(data.error);
        return;
      }

      if (!isReportGenerationResponse(data)) {
        setReportResult(null);
        setGeneratedContent('Error: Invalid generation response');
        return;
      }

      setReportResult(data);
      const bibliography = data.bibliography?.length
        ? `\n\nReferences:\n${data.bibliography.map((ref) => `- ${ref}`).join('\n')}`
        : '';
      setGeneratedContent(`${data.draft.raw}${bibliography}`.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject, isGenerating]);

  const reset = useCallback(() => {
    setGeneratedContent('');
    setError(null);
    setReportResult(null);
  }, []);

  return { generatedContent, isGenerating, error, generate, reset, reportResult };
}