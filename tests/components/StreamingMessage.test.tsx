import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import type { ChatMessage, Citation } from '@/lib/types';

vi.mock('@/stores/uiStore', () => ({
  useUIStore: (selector: (s: { setHighlightedMaterialId: (id: string | null) => void }) => unknown) =>
    selector({ setHighlightedMaterialId: vi.fn() }),
}));

const CITATION: Citation = {
  refIndex: 1,
  materialId: 'mat-1',
  materialName: 'Alpha.pdf',
  section: 'references',
  excerpt: 'Test excerpt.',
};

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    projectId: 'proj-1',
    role: 'assistant',
    content: 'The answer is clear [REF:1].',
    citations: [CITATION],
    timestamp: new Date(),
    ...overrides,
  };
}

describe('StreamingMessage', () => {
  it('renders user message with content', () => {
    const msg = makeMessage({ role: 'user', content: 'What is machine learning?', citations: [] });
    render(<StreamingMessage message={msg} />);
    expect(screen.getByText('What is machine learning?')).toBeDefined();
  });

  it('renders assistant message with content', () => {
    const msg = makeMessage({ citations: [] });
    render(<StreamingMessage message={msg} />);
    expect(screen.getByText(/The answer is clear/)).toBeDefined();
  });

  it('renders citation chips in the footer for assistant messages', () => {
    const msg = makeMessage();
    render(<StreamingMessage message={msg} />);
    // Citation summary row should appear (not streaming)
    expect(screen.getByRole('list', { name: /sources used/i })).toBeDefined();
  });

  it('does not show citation list while streaming', () => {
    const msg = makeMessage({ isStreaming: true });
    render(<StreamingMessage message={msg} liveContent="Typing…" />);
    expect(screen.queryByRole('list', { name: /sources used/i })).toBeNull();
  });

  it('uses liveContent over message.content when provided', () => {
    const msg = makeMessage({ citations: [] });
    render(<StreamingMessage message={msg} liveContent="Live streaming text" />);
    expect(screen.getByText('Live streaming text')).toBeDefined();
  });

  it('shows streaming indicator while streaming with no content', () => {
    const msg = makeMessage({ isStreaming: true });
    render(<StreamingMessage message={msg} liveContent="" />);
    expect(screen.getByText(/Searching materials/i)).toBeDefined();
  });
});