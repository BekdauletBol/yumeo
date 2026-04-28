'use client';

import { useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/stores/chatStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import { enrichMessageWithCitations } from '@/lib/agent/citationParser';
import type { ChatMessage, AnthropicMessage } from '@/lib/types';
import { EmptyState } from '@/components/ide/EmptyState';
import { showToast } from '@/lib/utils/toast';

/**
 * The central chat panel.
 * Shows onboarding EmptyState until at least one reference is uploaded,
 * then reveals the full chat interface.
 */
export function ChatPanel() {
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

  // Track when the first reference is uploaded to show the toast once
  const prevRefCount = useRef(0);
  const references = materials.filter((m) => m.section === 'references');
  useEffect(() => {
    if (references.length > 0 && prevRefCount.current === 0) {
      showToast('Reference added. Ask me anything about it.');
    }
    prevRefCount.current = references.length;
  }, [references.length]);

  const handleSubmit = useCallback(
    async (userText: string) => {
      if (!activeProject) return;

      const userMessage: ChatMessage = {
        id: nanoid(),
        projectId: activeProject.id,
        role: 'user',
        content: userText,
        citations: [],
        timestamp: new Date(),
      };
      addMessage(userMessage);

      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        projectId: activeProject.id,
        role: 'assistant',
        content: '',
        citations: [],
        timestamp: new Date(),
        isStreaming: true,
        model: activeProject.settings.agentModel,
      };
      addMessage(assistantMessage);
      setIsStreaming(true);

      const systemPrompt = buildSystemPrompt(materials, activeProject.settings);

      const history: AnthropicMessage[] = messages
        .filter((m) => m.role !== 'system' && m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      history.push({ role: 'user', content: userText });

      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            systemPrompt,
            projectId: activeProject.id,
            userQuery: userText,
            model: activeProject.settings.agentModel,
          }),
        });

        if (!response.ok || !response.body) {
          const err = (await response.json()) as { error?: string };
          updateMessage(assistantId, {
            content: `Error: ${err.error ?? 'Failed to get a response'}`,
            isStreaming: false,
          });
          setIsStreaming(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          appendStreamingContent(chunk);
        }

        const finalMessage: ChatMessage = {
          ...assistantMessage,
          content: fullContent,
          isStreaming: false,
        };
        const enriched = enrichMessageWithCitations(finalMessage, materials);

        updateMessage(assistantId, {
          content: enriched.content,
          citations: enriched.citations,
          isStreaming: false,
        });
        finalizeStreamingMessage(assistantId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        updateMessage(assistantId, {
          content: `Connection error: ${message}. Please try again.`,
          isStreaming: false,
        });
        setIsStreaming(false);
      }
    },
    [
      activeProject,
      materials,
      messages,
      addMessage,
      updateMessage,
      setIsStreaming,
      appendStreamingContent,
      finalizeStreamingMessage,
    ],
  );

  // Show onboarding until at least one reference exists
  if (references.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}