'use client';

import { useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/stores/chatStore';
import { useMaterialsStore } from '@/stores/materialsStore';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectSectionsStore } from '@/stores/projectSectionsStore';
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
  const sections = useProjectSectionsStore((s) => s.sections);
  const activeSections = sections.filter((s) => s.isActive);

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

      const systemPrompt = buildSystemPrompt(materials, activeProject.settings, activeSections, activeProject.settings.agentModel);

      const history: AnthropicMessage[] = messages
        .filter((m) => m.role !== 'system' && m.content)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      history.push({ role: 'user', content: userText });

      try {
        // eslint-disable-next-line no-console
        console.log('[ChatPanel] 📤 Sending request to /api/agent:', {
          messagesCount: history.length,
          projectId: activeProject.id,
          userQuery: userText.substring(0, 50),
        });

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

        // eslint-disable-next-line no-console
        console.log('[ChatPanel] Response status:', response.status, response.statusText);

        if (!response.ok || !response.body) {
          // eslint-disable-next-line no-console
          console.error('[ChatPanel] ❌ Response not ok:', response.status);
          const err = (await response.json()) as { error?: string };
          // eslint-disable-next-line no-console
          console.error('[ChatPanel] Error body:', err);
          updateMessage(assistantId, {
            content: `Error: ${err.error ?? 'Failed to get a response'}`,
            isStreaming: false,
          });
          setIsStreaming(false);
          return;
        }

        // eslint-disable-next-line no-console
        console.log('[ChatPanel] ✅ Response ok, starting stream read');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // eslint-disable-next-line no-console
            console.log(`[ChatPanel] ✅ Stream complete. Total chunks: ${chunkCount}, content length: ${fullContent.length}`);
            break;
          }
          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          // eslint-disable-next-line no-console
          console.log(`[ChatPanel] 📨 Chunk ${chunkCount}: ${chunk.length} chars`);
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
        // eslint-disable-next-line no-console
        console.error('[ChatPanel] ❌ Error:', message, err);
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
      activeSections,
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