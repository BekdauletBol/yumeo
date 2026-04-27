'use client';

import { useMemo } from 'react';
import type { ChatMessage, Citation } from '@/lib/types';
import { CitationTag } from './CitationTag';
import { cn } from '@/lib/utils/cn';

interface StreamingMessageProps {
  message: ChatMessage;
  /** Live content while streaming (overrides message.content) */
  liveContent?: string;
  className?: string;
}

/**
 * Renders a single chat message.
 * - User messages: plain text, right-aligned
 * - Assistant messages: parsed content with [REF:n] → CitationTag chips
 * - Shows blinking cursor while streaming
 */
export function StreamingMessage({ message, liveContent, className }: StreamingMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming === true;
  const content = liveContent ?? message.content;

  const parts = useMemo(
    () => parseContentWithCitations(content, message.citations),
    [content, message.citations],
  );

  if (isUser) {
    return (
      <div className={cn('flex justify-end', className)}>
        <div
          className="max-w-[80%] px-3 py-2 border text-sm leading-relaxed"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
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
        }}
        aria-hidden="true"
      >
        Y
      </div>

      <div className="flex-1 min-w-0">
        {/* Message content with citation chips inline */}
        <div
          className={cn('text-sm leading-relaxed', isStreaming && 'streaming-cursor')}
          style={{ color: 'var(--text-primary)' }}
        >
          {parts.map((part, i) => {
            if (part.type === 'text') {
              return <span key={i}>{part.content}</span>;
            }
            if (part.type === 'citation' && part.citation) {
              return <CitationTag key={i} citation={part.citation} />;
            }
            return null;
          })}
        </div>

        {/* Citation chips row (summary) */}
        {!isStreaming && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Sources used">
            {message.citations.map((citation) => (
              <span key={citation.materialId} role="listitem">
                <CitationTag citation={citation} />
              </span>
            ))}
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Searching materials…
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Parse content into text and citation segments ────────────────────────────

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'citation'; citation: Citation };

/**
 * Split message content into text segments and citation placeholder segments.
 * [REF:n] markers are replaced with CitationTag components.
 */
function parseContentWithCitations(
  content: string,
  citations: Citation[],
): ContentPart[] {
  const citationMap = new Map(citations.map((c) => [c.refIndex, c]));
  const parts: ContentPart[] = [];

  // Split on [REF:n] patterns
  const segments = content.split(/(\[REF:\d+\])/g);

  for (const segment of segments) {
    const refMatch = segment.match(/^\[REF:(\d+)\]$/);
    if (refMatch) {
      const index = parseInt(refMatch[1] ?? '0', 10);
      const citation = citationMap.get(index);
      if (citation) {
        parts.push({ type: 'citation', citation });
        continue;
      }
    }
    if (segment) {
      parts.push({ type: 'text', content: segment });
    }
  }

  return parts;
}