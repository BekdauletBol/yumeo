'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useChatStore } from '@/stores/chatStore';
import { StreamingMessage } from './StreamingMessage';
import { MessageSkeleton } from './MessageSkeleton';

/**
 * Scrollable list of all chat messages for the current project.
 * Auto-scrolls to bottom on new messages.
 * Shows a skeleton while the AI is composing its first token.
 */
export function MessageList() {
  const { user } = useUser();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages or streaming content change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  const isEmpty = messages.length === 0;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = user?.firstName ?? user?.username ?? 'there';

  if (isEmpty && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <p
          className="text-4xl md:text-5xl tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          {greeting}, {name}
        </p>
        <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
          Start a new chat below. Responses stay grounded in your uploaded materials.
        </p>
        <div
          className="w-full max-w-2xl mt-8 px-4 py-3 border text-left"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Ask a question about your references, drafts, or figures...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
      role="log"
      aria-label="Research conversation"
      aria-live="polite"
    >
      {messages.map((message) => {
        // The last assistant message gets live streaming content while streaming
        const isLastAssistant =
          isStreaming &&
          message.isStreaming === true &&
          message.role === 'assistant';

        return (
          <StreamingMessage
            key={message.id}
            message={message}
            liveContent={isLastAssistant ? streamingContent : undefined}
          />
        );
      })}

      {/* Show skeleton while waiting for first token */}
      {isStreaming && streamingContent === '' && <MessageSkeleton />}

      {/* Scroll anchor */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}