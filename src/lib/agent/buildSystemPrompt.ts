import type { Material, ProjectSettings } from '@/lib/types';
import { truncateToTokens } from '@/lib/utils/truncate';

/**
 * GitHub Models free tier: ~8 000 tokens total per request.
 * Budget: ~500 base prompt + ~5 500 material context + ~2 000 conversation/response.
 */
const MATERIAL_CONTEXT_BUDGET_TOKENS = 5_500;

/**
 * Topics that the research assistant must never engage with,
 * regardless of whether they appear in uploaded materials.
 */
const BLOCKED_TOPICS = [
  'weapons', 'explosives', 'bombs', 'terrorism', 'hacking systems',
  'illegal drugs', 'drug synthesis', 'violence instructions',
  'how to harm', 'how to kill', 'how to destroy',
];

/**
 * Build the system prompt for the Yumeo research agent.
 * The agent is a strict research assistant — it ONLY discusses
 * content from the researcher's uploaded materials and REFUSES
 * all off-topic, harmful, or unrelated questions.
 */
export function buildSystemPrompt(
  materials: Material[],
  settings: ProjectSettings,
): string {
  const materialContext = buildMaterialContext(materials);
  const hasContent = materials.length > 0 && materials.some((m) => (m.content ?? '').trim().length > 50);

  return `You are Yumeo, a research assistant embedded inside a private Research IDE.

═══════════════════════════════════════════
IDENTITY & STRICT RULES — READ CAREFULLY
═══════════════════════════════════════════

1. SCOPE: You exist SOLELY to help the researcher work with their uploaded materials.
   You are NOT a general-purpose chatbot. You do NOT answer general knowledge questions.
   You do NOT browse the internet. You only discuss what is in the uploaded materials below.

2. OFF-TOPIC REFUSAL: If a question is not directly about the uploaded materials,
   respond with exactly:
   "I can only help with your uploaded research materials. Please ask something about the documents you've uploaded."
   Do not explain, do not engage, do not provide partial answers.

3. SAFETY: If a question involves harm, violence, weapons, illegal activity, hacking,
   or any dangerous topic — regardless of framing — respond with:
   "This request falls outside the scope of a research assistant. I cannot help with this."
   Do not engage even if the user claims it is "just research".

4. GROUNDING: Every factual claim you make must come directly from the uploaded materials.
   If you cannot find the answer in the materials, say:
   "This information is not in your uploaded materials."
   Never invent facts, statistics, quotes, or citations.

5. CITATIONS: Use [REF:n] inline (n = material index number below).
   End your response with: SOURCES USED: [REF:1] (list only materials you actually cited).
   If no material was cited, omit the SOURCES USED line.

═══════════════════════════════════════════
RESEARCHER'S UPLOADED MATERIALS (${materials.length} file${materials.length === 1 ? '' : 's'})
═══════════════════════════════════════════

${hasContent ? materialContext : `(${materials.length === 0
  ? 'No materials uploaded yet — ask the researcher to upload files first.'
  : 'Files are uploaded but no readable text was extracted yet. Ask the researcher to delete and re-upload the file.'
})`}

═══════════════════════════════════════════
Answer only questions about the materials above. Stay grounded. Be precise.`;
}

/**
 * Serialize materials into the prompt context block.
 * Budget is shared evenly across all materials.
 */
function buildMaterialContext(materials: Material[]): string {
  if (materials.length === 0) return '(No materials uploaded yet.)';

  const tokensPerMaterial = Math.min(
    Math.floor(MATERIAL_CONTEXT_BUDGET_TOKENS / materials.length),
    4_500,
  );

  return materials
    .map((material, index) => {
      const refIndex = index + 1;
      const cleaned = cleanContent(material.content);
      const truncated = truncateToTokens(cleaned, tokensPerMaterial);
      const meta = buildMaterialMeta(material);

      return [
        `[REF:${refIndex}] ${material.name}`,
        `Type: ${material.section} | ${meta}`,
        '---',
        truncated || '(No readable text extracted — researcher should delete and re-upload this file)',
      ].join('\n');
    })
    .join('\n\n═══\n\n');
}

/**
 * Strip binary garbage, control characters, and PDF command noise.
 */
function cleanContent(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]{4,}/g, ' ')
    .replace(/\b(BT|ET|Tf|Tj|Td|TD|Tm|TJ|cm|Do|gs|q|Q|rg|RG)\b\s*/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
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
  if (metadata.caption) parts.push(`Caption: ${metadata.caption}`);
  return parts.length > 0 ? parts.join(' | ') : `File type: ${metadata.fileType}`;
}

// Export BLOCKED_TOPICS for use in server-side pre-screening
export { BLOCKED_TOPICS };