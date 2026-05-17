import type { Material, ProjectSettings, ProjectSection, Figure } from '@/lib/types';
import { truncateToTokens } from '@/lib/utils/truncate';

export const BLOCKED_TOPICS = [
  'weapons', 'explosives', 'bombs', 'terrorism', 'hacking systems',
  'illegal drugs', 'drug synthesis', 'violence instructions',
  'how to harm', 'how to kill', 'how to destroy',
];

/**
 * Token budgets per model.
 * gpt-4o on GitHub Models: hard 8 000 token request limit.
 * gpt-5 (openai/gpt-5) supports ~128 k context, so we can be generous.
 * We keep a safety margin: budgets here are for REFERENCE CONTENT only.
 * Static prompt text + conversation history use the remainder.
 */
function getContextBudget(model: string): number {
  if (model.includes('gpt-5') || model.includes('gpt5')) return 60_000;  // gpt-5: huge context
  if (model.includes('claude')) return 40_000;
  return 2_500; // gpt-4o: 8k total limit, leave room for system text + history
}

/**
 * Build the system prompt for the Yumeo research agent.
 * Dynamically sizes material context to fit within the model's token limit.
 */
export function buildSystemPrompt(
  materials: Material[],
  settings: ProjectSettings,
  activeSections?: ProjectSection[],
  model?: string,
  figures?: Figure[]
): string {
  // Filter materials to only include those from active sections
  let filteredMaterials = materials;
  if (activeSections && activeSections.length > 0) {
    const activeSectionIds = new Set(activeSections.map(s => s.id));
    filteredMaterials = materials.filter(m => !m.sectionId || activeSectionIds.has(m.sectionId));
  }

  const resolvedModel = model ?? 'gpt-4o';
  const contextBudget = getContextBudget(resolvedModel);

  // Categorize materials
  const references = filteredMaterials.filter(m => m.section === 'references');
  const drafts     = filteredMaterials.filter(m => m.section === 'drafts');
  const tables     = filteredMaterials.filter(m => m.section === 'tables');
  const equations  = filteredMaterials.filter(m => m.section === 'equations');
  const diagrams   = filteredMaterials.filter(m => m.section === 'diagrams');
  const templates  = filteredMaterials.filter(m => m.section === 'templates');

  const activeTemplate = templates[0];
  const figuresList = figures || [];

  // Draft budget: up to 25% of context, capped at 3 000 tokens for small models
  const draftBudget = Math.min(Math.floor(contextBudget * 0.25), resolvedModel.includes('gpt-5') ? 20_000 : 3_000);
  const draftContent = drafts.length > 0
    ? `Current Draft:\n${truncateToTokens(drafts[0]?.content ?? '', draftBudget)}`
    : 'No draft yet.';

  const templateSection = activeTemplate
    ? `Template being used: ${activeTemplate.name}\nTemplate structure:\n${truncateToTokens(activeTemplate.content, 2000)}`
    : 'No template uploaded.';

  const formatPreference = settings.outputFormatPreference || 'structured';
  const formatInstruction = formatPreference === 'plain'
    ? 'FORMATTING: DO NOT use any markdown headers, bolding, or complex structure. Provide plain academic prose only.'
    : 'FORMATTING: Use clear markdown headers (##) to structure your response into logical sections.';

  // Reference content: use remaining budget split evenly across files
  const referenceContext = buildMaterialContext(references, contextBudget);

  const prompt = `You are a STRICT RESEARCH ASSISTANT for Yumeo.

═══════════════════════════════════════════
ROLE & PRINCIPLES
═══════════════════════════════════════════
You are the researcher's academic writing partner. Your job is to:
- Ground all responses EXCLUSIVELY in uploaded materials
- Enforce academic rigor through proper APA 7th edition citations
- Help structure and refine arguments based on evidence
- Never invent, hallucinate, or assume information not in the materials

═══════════════════════════════════════════
WORKSPACE MATERIALS
═══════════════════════════════════════════
Uploaded References (${references.length}): ${references.length > 0 ? references.map(r => r.name).join(', ') : 'None'}
${draftContent}
${figuresList.length > 0 ? `Figures in this project (${figuresList.length}):\n${figuresList.map((f, i) => `- Figure ${f.orderIndex || i + 1}: [${f.caption || 'No caption'}] (from material_id: ${f.materialId || 'unknown'}) [${f.url}]`).join('\n')}` : ''}
${tables.length > 0 ? `Tables (${tables.length}):\n${tables.map((t, i) => `• Table ${t.metadata.figureNumber || i + 1}: ${t.metadata.caption || t.name}`).join('\n')}` : ''}
${equations.length > 0 ? `Equations (${equations.length}):\n${equations.map((e, i) => `• Eq ${e.metadata.figureNumber || i + 1}: ${e.content}`).join('\n')}` : ''}
${diagrams.length > 0 ? `Diagrams (${diagrams.length}):\n${diagrams.map((d, i) => `• Diagram ${d.metadata.figureNumber || i + 1}: ${d.content}`).join('\n')}` : ''}
${templateSection}

═══════════════════════════════════════════
REFERENCE CONTENT (GROUNDING SOURCE)
═══════════════════════════════════════════
${referenceContext}

═══════════════════════════════════════════
STRICT OPERATIONAL RULES
═══════════════════════════════════════════
1. CITATION REQUIREMENT: Use APA 7th edition for in-text mentions. IMPORTANT: After EVERY factual sentence or claim, you MUST append the system citation tag with page number: [REF:n, p. X]. Do not wait until the end of the paragraph. Every single sentence that uses information from sources must be immediately followed by its citation. Example: "Research shows that carbon levels are rising [REF:1, p. 4]. This trend is expected to continue [REF:1, p. 5]."
2. GROUNDING: Answer ONLY from uploaded materials. If info is missing → say so exactly.
3. ACADEMIC INTEGRITY: Never invent authors, dates, or statistics.
4. WRITING STYLE: 
   - Write in flowing academic prose. DO NOT use bullet points or robotic lists.
   - Use smooth transitions between paragraphs to ensure a cohesive narrative flow.
   - Each paragraph should typically be 4-6 sentences long.
   - Maintain a formal but readable academic tone.
   - ${formatInstruction}
5. NO CONVERSATION: Never output conversational filler. Do NOT say "Here is the report" or "Let me know if you need anything else." Output ONLY the requested document text.
6. APA 7th BIBLIOGRAPHY: When asked for a list of references, strictly follow APA 7th edition:
   * Authors: Last name, First initial. Middle initial. (e.g., Tarasak, P.)
   * Title: No quotes, sentence case.
   * Journal: Italicized (e.g., *Journal of Applied Learning*).
   * DOI: Full URL at the end (e.g., https://doi.org/...).

7. FIGURE INSERTION: If the user asks to insert a specific figure from a file, output exactly: [FIGURE: filename, Figure X]. AI must recognize the figure list provided in the Workspace Materials.
8. STYLE & STRUCTURE: If a template is provided, strictly follow its writing style and structure. 

Help the researcher produce rigorous, evidence-backed academic work.`;

  // Safety: cap total prompt length to avoid 413 errors on small models
  const maxChars = resolvedModel.includes('gpt-5') ? 240_000 : resolvedModel.includes('claude') ? 160_000 : 24_000;
  if (prompt.length > maxChars) {
    return prompt.slice(0, maxChars) + '\n[System prompt truncated to fit model limits]';
  }
  return prompt;
}

function buildMaterialContext(materials: Material[], totalBudget: number): string {
  if (materials.length === 0) return '(No reference content available.)';

  const tokensPerMaterial = Math.min(
    Math.floor(totalBudget / materials.length),
    20_000, // no single file eats more than 20k even on gpt-5
  );

  return materials
    .map((material, index) => {
      const truncated = truncateToTokens(material.content, tokensPerMaterial);
      return `[REF:${index + 1}] ${material.name}\n---\n${truncated}`;
    })
    .join('\n\n');
}
