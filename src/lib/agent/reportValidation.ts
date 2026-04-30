import type { ReportAuditEntry, ReportValidationResult } from '@/lib/types';

type ChunkRecord = {
  id: string;
  content: string;
  metadata?: {
    authors?: string[];
  };
};

const REF_PATTERN = /\[REF:([a-f0-9-]{36})\]/gi;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractRefs(text: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(REF_PATTERN.source, 'gi');
  while ((match = pattern.exec(text)) !== null) {
    if (match[1]) refs.push(match[1]);
  }
  return refs;
}

function hasCitation(text: string): boolean {
  return REF_PATTERN.test(text);
}

function authorAppearsInChunk(author: string, chunkText: string): boolean {
  const normalizedAuthor = author.toLowerCase().trim();
  if (!normalizedAuthor) return false;
  return chunkText.toLowerCase().includes(normalizedAuthor);
}

export function validateReport(
  draftText: string,
  audit: ReportAuditEntry[],
  chunks: ChunkRecord[],
): ReportValidationResult {
  const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const invalidRefs = new Set<string>();
  const missingCitations: string[] = [];
  const phantomAuthors: Array<{ ref: string; author: string }> = [];
  const citedRefs = new Set<string>();

  for (const sentence of splitSentences(draftText)) {
    if (countWords(sentence) > 15 && !hasCitation(sentence)) {
      missingCitations.push(sentence);
    }

    for (const ref of extractRefs(sentence)) {
      citedRefs.add(ref);
      if (!chunkMap.has(ref)) {
        invalidRefs.add(ref);
      }
    }
  }

  for (const ref of citedRefs) {
    const chunk = chunkMap.get(ref);
    if (!chunk) continue;
    const authors = chunk.metadata?.authors ?? [];
    if (authors.length === 0) {
      phantomAuthors.push({ ref: chunk.id, author: 'unknown' });
      continue;
    }
    const hasAuthor = authors.some((author) => authorAppearsInChunk(author, chunk.content));
    if (!hasAuthor) {
      phantomAuthors.push({ ref: chunk.id, author: authors[0] ?? 'unknown' });
    }
  }

  const hasUnverifiedAudit = audit.some((entry) => entry.status !== 'SUPPORTED');
  const hasUnverified =
    hasUnverifiedAudit ||
    invalidRefs.size > 0 ||
    missingCitations.length > 0 ||
    phantomAuthors.length > 0;

  return {
    invalidRefs: Array.from(invalidRefs),
    missingCitations,
    phantomAuthors,
    hasUnverified,
  };
}
