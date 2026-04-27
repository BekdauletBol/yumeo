import type { Material, MaterialSection } from '@/lib/types';
import { truncateToTokens } from '@/lib/utils/truncate';

/** Maximum tokens allocated per material in the context window */
const MAX_TOKENS_PER_MATERIAL = 3_000;

/** Maximum total materials included (avoid context overflow) */
const MAX_MATERIALS_IN_CONTEXT = 40;

/**
 * Build a structured context block from a set of materials.
 *
 * Materials are ordered by section priority:
 *   references → drafts → figures → tables → templates
 *
 * @param materials - All project materials
 * @returns         - Formatted context string for the system prompt
 */
export function buildMaterialContext(materials: Material[]): string {
  if (materials.length === 0) {
    return '(No materials uploaded yet.)';
  }

  const ordered = orderBySectionPriority(materials).slice(0, MAX_MATERIALS_IN_CONTEXT);

  return ordered
    .map((material, index) => {
      const refIndex      = index + 1;
      const truncated     = truncateToTokens(material.content, MAX_TOKENS_PER_MATERIAL);
      const metaLine      = buildMetaLine(material);

      return [
        `[REF:${refIndex}] ${material.name}`,
        metaLine,
        '---',
        truncated || '(No text content extracted)',
      ].join('\n');
    })
    .join('\n\n═══\n\n');
}

/**
 * Build a concise metadata line for a single material.
 */
function buildMetaLine(material: Material): string {
  const parts: string[] = [`Section: ${material.section}`];
  const { metadata }    = material;

  if (metadata.authors && metadata.authors.length > 0) {
    parts.push(`Authors: ${metadata.authors.slice(0, 3).join(', ')}`);
  }
  if (metadata.year)        parts.push(`Year: ${metadata.year}`);
  if (metadata.doi)         parts.push(`DOI: ${metadata.doi}`);
  if (metadata.pageCount)   parts.push(`Pages: ${metadata.pageCount}`);
  if (metadata.figureNumber) parts.push(metadata.figureNumber);

  return parts.join(' | ');
}

/** Section priority order for context placement */
const SECTION_ORDER: MaterialSection[] = [
  'references',
  'drafts',
  'figures',
  'tables',
  'templates',
];

function orderBySectionPriority(materials: Material[]): Material[] {
  return [...materials].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.section);
    const bi = SECTION_ORDER.indexOf(b.section);
    if (ai !== bi) return ai - bi;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Count approximate tokens for a set of materials.
 * Used to warn users when context is getting large.
 */
export function estimateContextTokens(materials: Material[]): number {
  return materials.reduce((sum, m) => {
    return sum + Math.ceil(m.content.length / 4);
  }, 0);
}