'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { MessageSkeleton } from './MessageSkeleton';
import { StreamingMessage } from './StreamingMessage';
import { CitationTag } from './CitationTag';
import { cn } from '@/lib/utils/cn';

export function MessageList() {
  const { messages, isStreaming } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        
        return (
          <div 
            key={message.id} 
            className={cn(
              "flex flex-col max-w-[85%]",
              isUser ? "ml-auto items-end text-right" : "mr-auto items-start text-left"
            )}
          >
            <div className={cn(
              "group relative px-6 py-4 rounded-2xl shadow-sm transition-all duration-200 hover:scale-[1.01]",
              isUser 
                ? "bg-[#1a1a1a] border border-border-subtle text-text-primary" 
                : "bg-bg-surface border border-border-subtle text-text-primary"
            )}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-body">
                {message.content}
              </div>

              {message.citations && message.citations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-inherit">
                  {message.citations.map((cite: any, idx: number) => (
                    <CitationTag key={idx} citation={cite} />
                  ))}
                </div>
              )}
            </div>
            
            <span className="mt-2 text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-widest">
              {isUser ? 'Researcher' : 'Yumeo AI'}
            </span>
          </div>
        );
      })}

      {isStreaming && <MessageSkeleton />}
      <div ref={bottomRef} />
    </div>
  );
}
