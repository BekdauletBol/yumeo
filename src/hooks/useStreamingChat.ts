'use client';

import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useChatStore } from '@/stores/chatStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import { enrichMessageWithCitations } from '@/lib/agent/citationParser';
import type { ChatMessage } from '@/lib/types';

/**
 * Encapsulates the full streaming chat lifecycle.
 * Returns a `sendMessage` function that can be called from any component.
 */
export function useStreamingChat() {
  const {
    messages,
    addMessage,
    updateMessage,
    setIsStreaming,
    appendStreamingContent,
    finalizeStreamingMessage,
  } = useChatStore();

  const materials = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const sendMessage = useCallback(
    async (userText: string): Promise<void> => {
      if (!activeProject || isStreaming) return;

      // User message
      const userMsg: ChatMessage = {
        id: nanoid(),
        projectId: activeProject.id,
        role: 'user',
        content: userText,
        citations: [],
        timestamp: new Date(),
      };
      addMessage(userMsg);

      // Placeholder assistant
      const assistantId = nanoid();
      addMessage({
        id: assistantId,
        projectId: activeProject.id,
        role: 'assistant',
        content: '',
        citations: [],
        timestamp: new Date(),
        isStreaming: true,
        model: activeProject.settings.agentModel,
      });
      setIsStreaming(true);

      const systemPrompt = buildSystemPrompt(materials, activeProject.settings);

      const history = [
        ...messages
          .filter((m) => m.role !== 'system' && m.content)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userText },
      ];

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            systemPrompt,
            model: activeProject.settings.agentModel,
            projectId: activeProject.id,
            userQuery: userText,
          }),
        });

        if (!res.ok || !res.body) {
          const err = (await res.json()) as { error?: string };
          updateMessage(assistantId, {
            content: `Error: ${err.error ?? 'Request failed'}`,
            isStreaming: false,
          });
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          appendStreamingContent(chunk);
        }

        const draft: ChatMessage = {
          id: assistantId,
          projectId: activeProject.id,
          role: 'assistant',
          content: full,
          citations: [],
          timestamp: new Date(),
          model: activeProject.settings.agentModel,
        };
        const enriched = enrichMessageWithCitations(draft, materials);

        updateMessage(assistantId, {
          content: enriched.content,
          citations: enriched.citations,
          isStreaming: false,
        });
        finalizeStreamingMessage(assistantId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        updateMessage(assistantId, {
          content: `Connection error: ${msg}`,
          isStreaming: false,
        });
        setIsStreaming(false);
      }
    },
    [
      activeProject, isStreaming, materials, messages,
      addMessage, updateMessage, setIsStreaming,
      appendStreamingContent, finalizeStreamingMessage,
    ],
  );

  return { sendMessage, isStreaming };
}