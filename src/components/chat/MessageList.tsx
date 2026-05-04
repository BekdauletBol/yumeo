'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useChatStore } from '@/stores/chatStore';
import { useProjectStore } from '@/stores/projectStore';
import { StreamingMessage } from './StreamingMessage';
import { MessageSkeleton } from './MessageSkeleton';
import { TextSelectionPopup } from './TextSelectionPopup';
import { useTextSelection } from '@/hooks/useTextSelection';

/**
 * Scrollable list of all chat messages for the current project.
 * Auto-scrolls to bottom on new messages.
 * Shows a skeleton while the AI is composing its first token.
 * Supports inline text selection with Ask/Copy/Add-to-Draft actions.
 */
export function MessageList() {
  const { user } = useUser();
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const addMessage = useChatStore((s) => s.addMessage);
  
  const activeProject = useProjectStore((s) => s.activeProject);
  const { selection, containerRef, clearSelection } = useTextSelection();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handler: Ask Yumeo about selected text
  const handleAskYumeo = useCallback((selectedText: string) => {
    if (!activeProject) return;
    
    const contextPrompt = `Regarding this passage: "${selectedText}" — `;
    // Pre-fill the chat input by dispatching a user message
    addMessage({
      id: `msg-${Date.now()}`,
      projectId: activeProject.id,
      role: 'user',
      content: contextPrompt,
      isStreaming: false,
      citations: [],
      timestamp: new Date(),
    });
  }, [addMessage, activeProject]);

  // Handler: Copy selected text to clipboard
  const handleCopy = useCallback((selectedText: string) => {
    navigator.clipboard.writeText(selectedText).then(() => {
      // Visual feedback via browser (text is copied)
    }).catch(() => {
      console.error('Failed to copy text');
    });
  }, []);

  // Handler: Add selected text to current draft
  const handleAddToDraft = useCallback((selectedText: string) => {
    // Copy to clipboard and let user paste into draft
    navigator.clipboard.writeText(selectedText).then(() => {
      // Text copied - user can now paste into their draft
    }).catch(() => {
      console.error('Failed to copy text to clipboard');
    });
  }, []);

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
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-5 relative"
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

      {/* Text selection popup for inline actions */}
      {selection && (
        <TextSelectionPopup
          selectedText={selection.text}
          position={selection.position}
          onAskYumeo={handleAskYumeo}
          onCopy={handleCopy}
          onAddToDraft={handleAddToDraft}
          onClose={clearSelection}
        />
      )}
    </div>
  );
}