'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/lib/types';
import { CitationTag } from './CitationTag';
import { cn } from '@/lib/utils/cn';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { stripPreamble } from '@/lib/utils/markdownParser';
import { ExternalLink } from 'lucide-react';

interface StreamingMessageProps {
  message: ChatMessage;
  liveContent?: string;
  className?: string;
}

export function StreamingMessage({ message, liveContent, className }: StreamingMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming === true;
  const content = liveContent ?? message.content;
  const openEditor = useReportEditorStore((s) => s.openWithContent);

  // Pre-process content to convert [REF:n, p. X] into a special markdown link format
  // that we can intercept in the components prop.
  const processedContent = useMemo(() => {
    return content.replace(/\[REF:(\d+)(?:,\s*p\.\s*(\d+))?\]/g, (match, n, p) => {
      return `[${match}](#cit-${n}-${p || '0'})`;
    });
  }, [content]);

  const cleanContentForEditor = useMemo(
    () => content.replace(/\[REF:\d+(?:,\s*p\.\s*\d+)?\]/g, ''),
    [content],
  );

  const editorContent = useMemo(
    () => stripPreamble(cleanContentForEditor),
    [cleanContentForEditor],
  );

  if (isUser) {
    return (
      <div className={cn('flex justify-end', className)}>
        <div className="max-w-[85%] px-6 py-4 bg-bg-elevated border border-border-subtle rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-body text-text-primary shadow-sm transition-all hover:scale-[1.01]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-4 group items-start', className)}>
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-xl bg-accent-primary flex items-center justify-center text-white font-mono font-bold text-sm border border-white/10 shadow-sm transition-transform group-hover:scale-105">
        Y
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className={cn(
          "prose prose-invert prose-sm max-w-none p-6 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm transition-all duration-200 hover:scale-[1.01] font-body text-text-primary leading-relaxed",
          isStreaming && "streaming-cursor",
        )}>
          <ReactMarkdown
            components={{
              code: ({ children, ...props }) => (
                <code {...props} className="bg-bg-elevated text-accent-primary px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-border-subtle">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-bg-elevated border border-border-subtle rounded-xl p-4 overflow-x-auto font-mono text-[0.85em] my-4">
                  {children}
                </pre>
              ),
              h1: ({ children }) => <h1 className="text-lg font-mono font-bold uppercase tracking-widest border-b border-border-subtle pb-2 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-md font-mono font-bold uppercase tracking-wider mt-6 mb-3">{children}</h2>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-accent-primary pl-4 my-4 italic text-text-secondary">
                  {children}
                </blockquote>
              ),
              // Intercept our special citation links
              a: ({ href, children }) => {
                if (href?.startsWith('#cit-')) {
                  const parts = href.split('-');
                  const n = parseInt(parts[1] || '0');
                  const p = parseInt(parts[2] || '0');
                  
                  // Find citation in message.citations
                  const citation = message.citations.find(c => 
                    c.refIndex === n && (p === 0 || c.pageNumber === p)
                  );
                  
                  if (citation) {
                    return <CitationTag citation={citation} className="mx-1 align-baseline translate-y-[1px]" />;
                  }
                  
                  // Fallback: just show the marker text if citation data is missing
                  return <span className="text-[10px] font-mono text-text-tertiary">[{children}]</span>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">{children}</a>;
              }
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>

        {!isStreaming && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => openEditor(editorContent, 'Yuport')}
              className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest px-4 py-2 bg-accent-primary text-white rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-sm"
            >
              <ExternalLink size={12} /> Open in Yuport
            </button>
            
            {message.citations.length > 0 && (
              <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-tighter">
                {message.citations.length} Sources Verified
              </span>
            )}
          </div>
        )}

        {isStreaming && (
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-text-tertiary flex items-center gap-2 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
            Generating Grounded Response...
          </p>
        )}
      </div>
    </div>
  );
}
