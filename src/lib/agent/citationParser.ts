import type { Citation, ChatMessage } from '@/lib/types';
import type { Material } from '@/lib/types';

/** Regex matching [REF:n] patterns (1 or more digits) */
const REF_PATTERN = /\[REF:(\d+)\]/g;

/** Regex matching the trailing "SOURCES USED: [REF:1], [REF:2]" block */
const SOURCES_BLOCK_PATTERN = /\nSOURCES USED:.*$/s;

/**
 * Parse [REF:n] markers from AI message content.
 *
 * @param content   - Raw AI message string
 * @param materials - Ordered list of materials (REF:1 = materials[0])
 * @returns         - Array of Citation objects for each unique referenced material
 */
export function parseCitations(
  content: string,
  materials: Material[],
): Citation[] {
  const refIndices = new Set<number>();
  let match: RegExpExecArray | null;

  const pattern = new RegExp(REF_PATTERN.source, 'g');
  while ((match = pattern.exec(content)) !== null) {
    const index = parseInt(match[1] ?? '0', 10);
    if (index >= 1 && index <= materials.length) {
      refIndices.add(index);
    }
  }

  return Array.from(refIndices)
    .sort((a, b) => a - b)
    .map((refIndex): Citation | null => {
      const material = materials[refIndex - 1];
      if (!material) return null;

      return {
        refIndex,
        materialId: material.id,
        materialName: material.name,
        section: material.section,
        excerpt: extractExcerpt(material.content, 200),
      };
    })
    .filter((c): c is Citation => c !== null);
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