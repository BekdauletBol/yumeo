import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationTag } from '@/components/chat/CitationTag';
import type { Citation } from '@/lib/types';

// Mock the UI store
vi.mock('@/stores/uiStore', () => ({
  useUIStore: (selector: (s: { setHighlightedMaterialId: (id: string | null) => void }) => unknown) =>
    selector({ setHighlightedMaterialId: vi.fn() }),
}));

const CITATION: Citation = {
  refIndex: 1,
  materialId: 'mat-1',
  materialName: 'Smith 2023.pdf',
  section: 'references',
  excerpt: 'Neural networks show remarkable performance.',
};

describe('CitationTag', () => {
  it('renders the REF index button', () => {
    render(<CitationTag citation={CITATION} />);
    expect(screen.getByRole('button', { name: /citation/i })).toBeDefined();
    expect(screen.getByText('REF:1')).toBeDefined();
  });

  it('opens popover on click', () => {
    render(<CitationTag citation={CITATION} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Smith 2023.pdf')).toBeDefined();
  });

  it('shows the source excerpt in the popover', () => {
    render(<CitationTag citation={CITATION} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Neural networks/)).toBeDefined();
  });

  it('closes popover when clicking the button again', () => {
    render(<CitationTag citation={CITATION} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has correct aria-expanded state', () => {
    render(<CitationTag citation={CITATION} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});