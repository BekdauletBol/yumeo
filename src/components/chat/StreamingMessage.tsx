'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/lib/types';
import { CitationTag } from './CitationTag';
import { cn } from '@/lib/utils/cn';
import { useReportEditorStore } from '@/stores/reportEditorStore';
import { ExternalLink } from 'lucide-react';

interface StreamingMessageProps {
  message: ChatMessage;
  /** Live content while streaming (overrides message.content) */
  liveContent?: string;
  className?: string;
}

/**
 * Renders a single chat message.
 * - User messages: plain text, right-aligned
 * - Assistant messages: rendered Markdown with [REF:n] citation chips
 * - Long responses (>500 chars): shows "Open in Editor" button
 * - Shows blinking cursor while streaming
 */
export function StreamingMessage({ message, liveContent, className }: StreamingMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming === true;
  const content = liveContent ?? message.content;
  const openEditor = useReportEditorStore((s) => s.openWithContent);

  // Strip [REF:n] tags for clean markdown rendering — citations are shown separately
  const cleanContent = useMemo(
    () => content.replace(/\[REF:\d+\]/g, ''),
    [content],
  );

  const isLong = content.length > 500;

  if (isUser) {
    return (
      <div className={cn('flex justify-end', className)}>
        <div
          className="max-w-[80%] px-3 py-2 border text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 group', className)}>
      {/* Avatar */}
      <div
        className="shrink-0 w-6 h-6 border flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
        }}
        aria-hidden="true"
      >
        Y
      </div>

      <div className="flex-1 min-w-0">
        {/* ── Markdown-rendered message body ── */}
        <div
          className={cn(
            'prose prose-sm max-w-none',
            isStreaming && 'streaming-cursor',
          )}
          style={{
            color: 'var(--text-primary)',
            // Override prose defaults to match app theme
            '--tw-prose-body': 'var(--text-primary)',
            '--tw-prose-headings': 'var(--text-primary)',
            '--tw-prose-bold': 'var(--text-primary)',
            '--tw-prose-code': 'var(--accent-refs)',
            '--tw-prose-pre-bg': 'var(--bg-overlay)',
            '--tw-prose-bullets': 'var(--text-tertiary)',
          } as React.CSSProperties}
        >
          <ReactMarkdown
            components={{
              // Inline code
              code: ({ children, ...props }) => (
                <code
                  {...props}
                  style={{
                    background: 'var(--bg-overlay)',
                    color: 'var(--accent-refs)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontSize: '0.85em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {children}
                </code>
              ),
              // Fenced code blocks
              pre: ({ children }) => (
                <pre
                  style={{
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    overflowX: 'auto',
                    fontSize: '0.8em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {children}
                </pre>
              ),
              // Headings
              h1: ({ children }) => (
                <h1
                  style={{
                    fontSize: '1.1em',
                    fontWeight: 700,
                    marginBottom: 6,
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: 4,
                  }}
                >
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2
                  style={{
                    fontSize: '1em',
                    fontWeight: 600,
                    marginTop: 10,
                    marginBottom: 4,
                    color: 'var(--text-primary)',
                  }}
                >
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3
                  style={{
                    fontSize: '0.95em',
                    fontWeight: 600,
                    marginTop: 8,
                    marginBottom: 2,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {children}
                </h3>
              ),
              // Lists
              ul: ({ children }) => (
                <ul style={{ paddingLeft: 18, marginTop: 4, marginBottom: 4 }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: 18, marginTop: 4, marginBottom: 4 }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: 2, color: 'var(--text-primary)' }}>{children}</li>
              ),
              // Paragraphs
              p: ({ children }) => (
                <p style={{ marginTop: 0, marginBottom: 6, lineHeight: 1.65 }}>{children}</p>
              ),
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: '3px solid var(--accent-refs)',
                    paddingLeft: 10,
                    marginLeft: 0,
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  {children}
                </blockquote>
              ),
              // Horizontal rules
              hr: () => (
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
              ),
              // Strong / bold
              strong: ({ children }) => (
                <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{children}</strong>
              ),
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>

        {/* ── Citation chips row ── */}
        {!isStreaming && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Sources used">
            {message.citations.map((citation) => (
              <span key={citation.materialId} role="listitem">
                <CitationTag citation={citation} />
              </span>
            ))}
          </div>
        )}

        {/* ── "Open in Editor" button for long responses ── */}
        {!isStreaming && isLong && (
          <button
            onClick={() => openEditor(content, 'AI Report')}
            className="mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--accent-refs)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
            }}
            aria-label="Open this response in the full report editor"
          >
            <ExternalLink size={12} aria-hidden="true" />
            Open in Editor
          </button>
        )}

        {/* ── Streaming indicator ── */}
        {isStreaming && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Thinking…
          </p>
        )}
      </div>
    </div>
  );
}