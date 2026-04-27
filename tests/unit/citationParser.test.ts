import { describe, it, expect } from 'vitest';
import {
  parseCitations,
  stripSourcesBlock,
  hasCitations,
  enrichMessageWithCitations,
} from '@/lib/agent/citationParser';
import type { Material, ChatMessage } from '@/lib/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeMaterial(id: string, name: string): Material {
  return {
    id,
    projectId: 'proj-1',
    section: 'references',
    name,
    content: `Content of ${name}`,
    metadata: { fileType: 'pdf', fileSize: 1024 },
    createdAt: new Date(),
  };
}

const MATERIALS: Material[] = [
  makeMaterial('mat-1', 'Paper Alpha.pdf'),
  makeMaterial('mat-2', 'Paper Beta.pdf'),
  makeMaterial('mat-3', 'Paper Gamma.pdf'),
];

// ─── parseCitations ───────────────────────────────────────────────────────────

describe('parseCitations', () => {
  it('extracts a single [REF:1] marker', () => {
    const citations = parseCitations('The method works well [REF:1].', MATERIALS);
    expect(citations).toHaveLength(1);
    expect(citations[0]?.refIndex).toBe(1);
    expect(citations[0]?.materialId).toBe('mat-1');
    expect(citations[0]?.materialName).toBe('Paper Alpha.pdf');
  });

  it('extracts multiple unique [REF:n] markers', () => {
    const content = 'Finding A [REF:1]. Also [REF:3] and [REF:1] again.';
    const citations = parseCitations(content, MATERIALS);
    // [REF:1] appears twice but should only produce one citation entry
    expect(citations).toHaveLength(2);
    const indices = citations.map((c) => c.refIndex);
    expect(indices).toContain(1);
    expect(indices).toContain(3);
  });

  it('returns citations sorted by refIndex ascending', () => {
    const content = '[REF:3] first, then [REF:1].';
    const citations = parseCitations(content, MATERIALS);
    expect(citations[0]?.refIndex).toBe(1);
    expect(citations[1]?.refIndex).toBe(3);
  });

  it('ignores out-of-range REF indices', () => {
    const citations = parseCitations('[REF:99] out of range', MATERIALS);
    expect(citations).toHaveLength(0);
  });

  it('returns empty array when content has no REF markers', () => {
    const citations = parseCitations('No citations here.', MATERIALS);
    expect(citations).toHaveLength(0);
  });

  it('returns empty array when materials list is empty', () => {
    const citations = parseCitations('[REF:1] something', []);
    expect(citations).toHaveLength(0);
  });

  it('includes the correct section for each citation', () => {
    const mats: Material[] = [
      { ...makeMaterial('f1', 'Fig1.png'), section: 'figures' },
      { ...makeMaterial('r1', 'Ref1.pdf'), section: 'references' },
    ];
    const citations = parseCitations('[REF:1] [REF:2]', mats);
    expect(citations.find((c) => c.refIndex === 1)?.section).toBe('figures');
    expect(citations.find((c) => c.refIndex === 2)?.section).toBe('references');
  });
});

// ─── stripSourcesBlock ────────────────────────────────────────────────────────

describe('stripSourcesBlock', () => {
  it('removes the SOURCES USED trailing block', () => {
    const content = 'Main answer text.\nSOURCES USED: [REF:1], [REF:2]';
    expect(stripSourcesBlock(content)).toBe('Main answer text.');
  });

  it('is a no-op when there is no SOURCES USED block', () => {
    const content = 'Just a regular answer with no sources block.';
    expect(stripSourcesBlock(content)).toBe(content);
  });

  it('handles multi-line SOURCES USED blocks', () => {
    const content = 'Answer.\nSOURCES USED: [REF:1]\nExtra line after';
    const result = stripSourcesBlock(content);
    expect(result).toBe('Answer.');
  });
});

// ─── hasCitations ────────────────────────────────────────────────────────────

describe('hasCitations', () => {
  it('returns true when [REF:n] is present', () => {
    expect(hasCitations('Based on [REF:1]...')).toBe(true);
  });

  it('returns false when no [REF:n] markers exist', () => {
    expect(hasCitations('No references here.')).toBe(false);
  });
});

// ─── enrichMessageWithCitations ──────────────────────────────────────────────

describe('enrichMessageWithCitations', () => {
  const baseMessage: ChatMessage = {
    id: 'msg-1',
    projectId: 'proj-1',
    role: 'assistant',
    content: 'The result was positive [REF:2].\nSOURCES USED: [REF:2]',
    citations: [],
    timestamp: new Date(),
  };

  it('strips the SOURCES USED block from content', () => {
    const enriched = enrichMessageWithCitations(baseMessage, MATERIALS);
    expect(enriched.content).not.toContain('SOURCES USED');
  });

  it('populates citations array correctly', () => {
    const enriched = enrichMessageWithCitations(baseMessage, MATERIALS);
    expect(enriched.citations).toHaveLength(1);
    expect(enriched.citations[0]?.materialId).toBe('mat-2');
  });

  it('does not modify user messages', () => {
    const userMsg: ChatMessage = { ...baseMessage, role: 'user' };
    const enriched = enrichMessageWithCitations(userMsg, MATERIALS);
    expect(enriched.content).toBe(userMsg.content); // unchanged
    expect(enriched.citations).toHaveLength(0);
  });
});