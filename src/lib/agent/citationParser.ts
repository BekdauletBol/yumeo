import type { Citation, ChatMessage } from '@/lib/types';
import type { Material } from '@/lib/types';

/** Regex matching [REF:n] or [REF:n, p. X] patterns */
const REF_PATTERN = /\[REF:(\d+)(?:,\s*p\.\s*(\d+))?\]/g;

/** Regex matching the trailing "SOURCES USED: [REF:1], [REF:2]" block */
const SOURCES_BLOCK_PATTERN = /\nSOURCES USED:.*$/s;

/**
 * Parse [REF:n] or [REF:n, p. X] markers from AI message content.
...
 * @param content   - Raw AI message string
 * @param materials - Ordered list of materials (REF:1 = materials[0])
 * @returns         - Array of Citation objects for each unique referenced material/page
 */
export function parseCitations(
  content: string,
  materials: Material[],
): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  const pattern = new RegExp(REF_PATTERN.source, 'g');
  while ((match = pattern.exec(content)) !== null) {
    const index = parseInt(match[1] ?? '0', 10);
    const pageNumber = match[2] ? parseInt(match[2], 10) : undefined;
    
    if (index >= 1 && index <= materials.length) {
      const material = materials[index - 1];
      if (!material) continue;

      const key = `${material.id}-${pageNumber || 'any'}`;
      if (seen.has(key)) continue;
      seen.add(key);

      citations.push({
        refIndex: index,
        materialId: material.id,
        materialName: material.name,
        section: material.section,
        excerpt: extractExcerpt(material.content, 200),
        pageNumber,
      });
    }
  }

  return citations.sort((a, b) => a.refIndex - b.refIndex);
}

/**
 * Strip the "SOURCES USED:" block from the display content.
 * It's shown via CitationTag chips instead.
 */
export function stripSourcesBlock(content: string): string {
  return content.replace(SOURCES_BLOCK_PATTERN, '').trimEnd();
}

/**
 * Replace [REF:n] markers in content with a placeholder for rendering.
 * The actual `<CitationTag>` substitution happens in React.
 */
export function replaceRefMarkers(content: string): string {
  return content.replace(REF_PATTERN, '[$1]');
}

/**
 * Check whether AI content contains any citations.
 */
export function hasCitations(content: string): boolean {
  return REF_PATTERN.test(content);
}

/**
 * Enrich a ChatMessage with parsed citations.
 */
export function enrichMessageWithCitations(
  message: ChatMessage,
  materials: Material[],
): ChatMessage {
  if (message.role !== 'assistant') return message;

  const cleanContent = stripSourcesBlock(message.content);
  const citations = parseCitations(message.content, materials);

  return { ...message, content: cleanContent, citations };
}

// ─── Private helpers ────────────────────────────────────────────────────────

/**
 * Extract a short excerpt from material content.
 * Picks the first `maxLength` characters of non-empty content.
 */
function extractExcerpt(content: string, maxLength: number): string {
  const trimmed = content.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 1) + '…';
}