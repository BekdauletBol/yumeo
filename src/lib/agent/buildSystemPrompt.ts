import type { Material, ProjectSettings, ProjectSection } from '@/lib/types';
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
  return 4_000; // gpt-4o safe default (leaves ~4k for static text + history)
}

/**
 * Build the system prompt for the Yumeo research agent.
 * Dynamically sizes material context to fit within the model's token limit.
 */
export function buildSystemPrompt(
  materials: Material[],
  _settings: ProjectSettings,
  activeSections?: ProjectSection[],
  model?: string,
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
  const figures    = filteredMaterials.filter(m => m.section === 'figures');
  const tables     = filteredMaterials.filter(m => m.section === 'tables');
  const equations  = filteredMaterials.filter(m => m.section === 'equations');
  const diagrams   = filteredMaterials.filter(m => m.section === 'diagrams');
  const templates  = filteredMaterials.filter(m => m.section === 'templates');

  const activeTemplate = templates[0];

  // Draft budget: up to 25% of context, capped at 3 000 tokens for small models
  const draftBudget = Math.min(Math.floor(contextBudget * 0.25), resolvedModel.includes('gpt-5') ? 20_000 : 3_000);
  const draftContent = drafts.length > 0
    ? `Current Draft:\n${truncateToTokens(drafts[0]?.content ?? '', draftBudget)}`
    : 'No draft yet.';

  let templateSection: string;
  if (activeTemplate) {
    if (activeTemplate.metadata.isFileTemplate) {
      // Uploaded file — AI must follow its exact structure and style
      templateSection = `TEMPLATE FILE LOADED: "${activeTemplate.name}"
The researcher has uploaded this file as a structural and stylistic template.
YOU MUST follow the exact section order, heading names, and writing style from this document.
DO NOT invent section names or use standard academic structure — use the template structure instead.
Template content:
${truncateToTokens(activeTemplate.content, 800)}`;
    } else {
      // Handcrafted text template with {{ placeholder }} syntax
      templateSection = `Template being used: ${activeTemplate.name}
Template structure:
${truncateToTokens(activeTemplate.content, 500)}`;
    }
  } else {
    templateSection = 'No template uploaded. ⚠ Using standard academic structure (Introduction, Methods, Results, Discussion, Conclusion). Upload a template file in the Templates section to enforce a custom format.';
  }

  // Reference content: use remaining budget split evenly across files
  const referenceContext = buildMaterialContext(references, contextBudget);

  return `You are a STRICT RESEARCH ASSISTANT for Yumeo.

═══════════════════════════════════════════
ROLE & PRINCIPLES
═══════════════════════════════════════════
You are the researcher's academic writing partner. Your job is to:
- Ground all responses EXCLUSIVELY in uploaded materials
- Enforce academic rigor through proper citations and source verification
- Help structure and refine arguments based on evidence
- Never invent, hallucinate, or assume information not in the materials

═══════════════════════════════════════════
WORKSPACE MATERIALS
═══════════════════════════════════════════
Uploaded References (${references.length}): ${references.length > 0 ? references.map(r => r.name).join(', ') : 'None'}
${draftContent}
${figures.length > 0 ? `Figures (${figures.length}):\n${figures.map((f, i) => `• Figure ${f.metadata.figureNumber || i + 1}: ${f.metadata.caption || f.name} [file: ${f.name}]`).join('\n')}` : ''}
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
1. CITATION REQUIREMENT: Every factual claim must end with (Source: filename, page N).
2. GROUNDING: Answer ONLY from uploaded materials. If info is missing → say so exactly.
3. ACADEMIC INTEGRITY: Never invent authors, dates, or statistics.
4. WRITING: Help refine arguments with material-backed evidence only.
5. NO CONVERSATION: Never output conversational filler. Do NOT say "Here is the report" or "Let me know if you need anything else." Output ONLY the requested document text.
6. RESPONSE STYLE: Academic tone, concise, evidence-focused.
7. FIGURE INSERTION: When the researcher asks to insert a figure from an uploaded file, output a marker using EXACTLY this syntax: [FIGURE: filename, Figure N] — e.g. [FIGURE: results.pdf, Figure 3]. The editor will replace this marker with the actual image. Never describe the figure inline instead of inserting the marker.

Help the researcher produce rigorous, evidence-backed academic work.`;
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