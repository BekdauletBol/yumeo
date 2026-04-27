'use client';

import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/stores/chatStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import { enrichMessageWithCitations } from '@/lib/agent/citationParser';
import type { ChatMessage, AnthropicMessage } from '@/lib/types';

/**
 * The central chat panel.
 *
 * Manages the full streaming lifecycle:
 * 1. Add user message to store
 * 2. Build system prompt from materials
 * 3. POST to /api/agent with full conversation history
 * 4. Stream response chunks into the store
 * 5. Finalize message and parse citations
 */
export function ChatPanel() {
  const {
    messages,
    addMessage,
    updateMessage,
    setIsStreaming,
    appendStreamingContent,
    finalizeStreamingMessage,
    streamingContent,
  } = useChatStore();

  const materials = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);

  const handleSubmit = useCallback(
    async (userText: string) => {
      if (!activeProject) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: nanoid(),
        projectId: activeProject.id,
        role: 'user',
        content: userText,
        citations: [],
        timestamp: new Date(),
      };
      addMessage(userMessage);

      // Placeholder assistant message (will be filled by stream)
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

      // Build system prompt with all loaded materials
      const systemPrompt = buildSystemPrompt(materials, activeProject.settings);

      // Build Anthropic-format conversation history (exclude the blank assistant placeholder)
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

        // Stream response chunks
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

        // Finalize: parse citations, strip SOURCES USED block
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

  return (
    <div className="flex flex-col h-full">
      <MessageList />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}