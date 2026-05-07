'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const TASK_VERBS = [
  'write',
  'generate',
  'create',
  'summarize',
  'summarise',
  'draft',
  'make',
  'build',
] as const;

const TASK_PREFIX_RE = new RegExp(`^(please\\s+)?(${TASK_VERBS.join('|')})\\b`, 'i');
const TASK_REQUEST_RE = new RegExp(
  `\\b(can you|could you|please|kindly|help me|i need you to)\\s+(${TASK_VERBS.join('|')})\\b`,
  'i',
);

function isTaskRequest(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return TASK_PREFIX_RE.test(trimmed) || TASK_REQUEST_RE.test(trimmed);
}

function buildModeGuidance(mode: 'ask' | 'agent'): string {
  if (mode === 'agent') {
    return `

MODE: AGENT
- Break complex requests into clear steps and execute them in order.
- Confirm each step before moving to the next when possible.
- Keep outputs structured and progress-oriented.`;
  }

  return `

MODE: ASK
- Answer questions directly in 1–3 concise sentences.
- Use a brief, conversational tone and avoid long-form report formatting.`;
}

const AGENT_STEPS = [
  'Analyzing references',
  'Writing Introduction',
  'Writing Methodology',
  'Writing Results',
  'Writing Conclusion',
] as const;

const AGENT_PROGRESS_CHARS = 800;

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
    isStreaming,
  } = useChatStore();

  const materials = useMaterialsStore((s) => s.materials);
  const activeProject = useProjectStore((s) => s.activeProject);
  const sections = useProjectSectionsStore((s) => s.sections);
  const activeSections = sections.filter((s) => s.isActive);
  const chatMode = useChatStore((s) => s.chatMode);
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [agentProgressIndex, setAgentProgressIndex] = useState(0);

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

      const isTask = isTaskRequest(userText);

      const assistantId = nanoid();
      if (chatMode === 'agent') {
        setAgentRunId(assistantId);
        setAgentProgressIndex(0);
      } else {
        setAgentRunId(null);
      }
      const assistantMessage: ChatMessage = {
        id: assistantId,
        projectId: activeProject.id,
        role: 'assistant',
        content: '',
        citations: [],
        timestamp: new Date(),
        isStreaming: true,
        model: activeProject.settings.agentModel,
        isTask,
      };
      addMessage(assistantMessage);
      setIsStreaming(true);

      const systemPrompt = `${buildSystemPrompt(
        materials,
        activeProject.settings,
        activeSections,
        activeProject.settings.agentModel,
      )}${buildModeGuidance(chatMode)}`;

      const history: AnthropicMessage[] = messages
        .filter((m) => m.role !== 'system' && m.content && m.projectId === activeProject.id)
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
          if (chatMode === 'agent') {
            const nextIndex = Math.min(
              AGENT_STEPS.length - 1,
              Math.floor(fullContent.length / AGENT_PROGRESS_CHARS),
            );
            setAgentProgressIndex((prev) => (nextIndex > prev ? nextIndex : prev));
          }
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
      chatMode,
      setAgentProgressIndex,
    ],
  );

  // Show onboarding until at least one reference exists
  if (references.length === 0) {
    return <EmptyState />;
  }

  const showAgentProgress = chatMode === 'agent' && agentRunId && isStreaming;
  const agentSteps = showAgentProgress
    ? AGENT_STEPS.map((label, index) => {
      if (index < agentProgressIndex) return { label, status: 'done' as const };
      if (index === agentProgressIndex) return { label, status: 'active' as const };
      return { label, status: 'pending' as const };
    })
    : [];

  return (
    <div className="flex flex-col h-full">
      <MessageList />
      {showAgentProgress && agentSteps.length > 0 && (
        <div
          className="px-4 py-2 border-t"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Agent progress
          </div>
          <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {agentSteps.map((step) => {
              const icon = step.status === 'done' ? '✅' : step.status === 'active' ? '⏳' : '○';
              const suffix = step.status === 'active' ? '...' : '';
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <span aria-hidden="true">{icon}</span>
                  <span>
                    {step.label}
                    {suffix}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}
