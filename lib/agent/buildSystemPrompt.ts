import type { Material, ProjectSettings } from '@/lib/types';
import { truncateToTokens } from '@/lib/utils/truncate';

/**
 * Maximum tokens to use per material in the context window.
 * Keeps total context under ~100k tokens for large projects.
 */
const MAX_TOKENS_PER_MATERIAL = 3000;

/**
 * Build the system prompt for the Yumeo research agent.
 *
 * The agent's behaviour changes based on `strictGrounding`:
 * - strict: answers ONLY from uploaded materials; refuses to hallucinate
 * - flexible: prefers materials but supplements with general knowledge
 *
 * @param materials - All materials loaded into the current project
 * @param settings  - Project-level AI settings
 * @returns         - Complete system prompt string
 */
export function buildSystemPrompt(
  materials: Material[],
  settings: ProjectSettings,
): string {
  const groundingInstruction = settings.strictGrounding
    ? `CRITICAL CONSTRAINT: You must answer ONLY based on the materials provided below.
If the answer cannot be found in the materials, respond with exactly:
"This information is not in your uploaded materials."
Never invent facts, citations, statistics, or quotes not present in the context.
Never claim a source says something it does not say.`
    : `PREFERENCE: Use the provided materials as your primary source.
You may supplement with general knowledge when the materials are insufficient,
but clearly distinguish: "Based on general knowledge (not in your materials): ..."`;

  const citationInstruction = `
CITATION FORMAT:
When you use information from a source, cite it inline as [REF:n] where n is the
material's index number shown below. For example: "The sample size was 200 [REF:1]."

At the end of your response, include a section:
SOURCES USED: [REF:1], [REF:3] (list only the ones you actually cited)

If you used no materials (e.g. general greeting), omit the SOURCES USED section.`;

  const materialContext = buildMaterialContext(materials);

  return `You are Yumeo, a research assistant embedded in a structured Research IDE.
You are not a general chatbot — you are a specialist who has read everything in
the researcher's uploaded materials.

${groundingInstruction}

${citationInstruction}

RESEARCHER'S LOADED MATERIALS (${materials.length} file${materials.length === 1 ? '' : 's'}):

${materialContext}

Always be precise, cite sources, and stay grounded in the evidence.`;
}

/**
 * Serialize materials into the prompt context block.
 * Each material gets a [REF:n] index for citation.
 */
function buildMaterialContext(materials: Material[]): string {
  if (materials.length === 0) {
    return '(No materials uploaded yet. Ask the researcher to upload files.)';
  }

  return materials
    .map((material, index) => {
      const refIndex = index + 1;
      const truncatedContent = truncateToTokens(material.content, MAX_TOKENS_PER_MATERIAL);
      const meta = buildMaterialMeta(material);

      return [
        `[REF:${refIndex}] ${material.name}`,
        `Type: ${material.section} | ${meta}`,
        '---',
        truncatedContent || '(No text content extracted)',
      ].join('\n');
    })
    .join('\n\n═══\n\n');
}

/**
 * Build a compact metadata string for the prompt context.
 */
function buildMaterialMeta(material: Material): string {
  const parts: string[] = [];
  const { metadata } = material;

  if (metadata.authors && metadata.authors.length > 0) {
    parts.push(`Authors: ${metadata.authors.slice(0, 3).join(', ')}`);
  }
  if (metadata.year) parts.push(`Year: ${metadata.year}`);
  if (metadata.doi) parts.push(`DOI: ${metadata.doi}`);
  if (metadata.pageCount) parts.push(`Pages: ${metadata.pageCount}`);
  if (metadata.figureNumber) parts.push(metadata.figureNumber);
  if (metadata.caption) parts.push(`Caption: ${material.metadata.caption}`);

  return parts.length > 0 ? parts.join(' | ') : `File type: ${metadata.fileType}`;
}