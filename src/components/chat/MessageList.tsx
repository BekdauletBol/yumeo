'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useProjectStore } from '@/stores/projectStore';
import { MessageSkeleton } from './MessageSkeleton';
import { StreamingMessage } from './StreamingMessage';
import { CitationTag } from './CitationTag';
import { cn } from '@/lib/utils/cn';

export function MessageList() {
  const { messages, isStreaming } = useChatStore();
  const activeProject = useProjectStore((s) => s.activeProject);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Filter messages to current project only
  const projectMessages = activeProject 
    ? messages.filter((m) => m.projectId === activeProject.id)
    : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [projectMessages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scrollbar-thin">
      {projectMessages.map((message) => {
        const isUser = message.role === 'user';
        
        return (
          <div 
            key={message.id} 
            className={cn(
              "flex flex-col max-w-[85%]",
              isUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div 
              className={cn(
                "group relative px-5 py-3.5 rounded-2xl transition-all duration-200",
                isUser ? "rounded-br-md" : "rounded-bl-md"
              )}
              style={{
                background: isUser ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <div 
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {message.content}
              </div>

              {message.citations && message.citations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.citations.map((cite: any, idx: number) => (
                    <CitationTag key={idx} citation={cite} />
                  ))}
                </div>
              )}
            </div>
            
            <span 
              className="mt-1.5 text-[11px] font-medium"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              {isUser ? 'you' : 'yumeo ai'}
            </span>
          </div>
        );
      })}

      {isStreaming && <MessageSkeleton />}
      <div ref={bottomRef} />
    </div>
  );
}
