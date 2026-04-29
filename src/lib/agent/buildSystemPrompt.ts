import type { Material, ProjectSettings } from '@/lib/types';
import { truncateToTokens } from '@/lib/utils/truncate';

const MATERIAL_CONTEXT_BUDGET_TOKENS = 6_000;

export const BLOCKED_TOPICS = [
  'weapons', 'explosives', 'bombs', 'terrorism', 'hacking systems',
  'illegal drugs', 'drug synthesis', 'violence instructions',
  'how to harm', 'how to kill', 'how to destroy',
];

/**
 * Build the system prompt for the Yumeo research agent.
 * Connects all workspace panels (references, drafts, figures, tables, equations, diagrams, templates).
 */
export function buildSystemPrompt(
  materials: Material[],
  _settings: ProjectSettings,
): string {
  // Categorize materials
  const references = materials.filter(m => m.section === 'references');
  const drafts = materials.filter(m => m.section === 'drafts');
  const figures = materials.filter(m => m.section === 'figures');
  const tables = materials.filter(m => m.section === 'tables');
  const equations = materials.filter(m => m.section === 'equations');
  const diagrams = materials.filter(m => m.section === 'diagrams');
  const templates = materials.filter(m => m.section === 'templates');

  const activeTemplate = templates[0];

  // Smart Template Handling: If no template, AI suggests structure
  const templateSection = activeTemplate 
    ? `Template being used: ${activeTemplate.name}\nTemplate structure:\n${activeTemplate.content}`
    : `No template uploaded. Infer appropriate academic structure (IEEE, APA, etc.) from the research field of the references. Suggest a format if one isn't detected.`;

  // Build the core context string for references (grounding)
  const referenceContext = buildMaterialContext(references);

  return `You are a research assistant for this project.

═══════════════════════════════════════════
WORKSPACE CONTEXT
═══════════════════════════════════════════

Uploaded references: ${references.length > 0 ? references.map(r => r.name).join(', ') : 'None.'}

${drafts.length > 0 
  ? `Current draft:\n${drafts[0].content}` 
  : 'No draft yet.'}

${figures.length > 0 
  ? `Figures:\n${figures.map((f, i) => `Figure ${f.metadata.figureNumber || i + 1}: ${f.metadata.caption || f.name}`).join('\n')}` 
  : ''}

${tables.length > 0 
  ? `Tables:\n${tables.map((t, i) => `Table ${t.metadata.figureNumber || i + 1}: ${t.metadata.caption || t.name}`).join('\n')}` 
  : ''}

${equations.length > 0 
  ? `Equations:\n${equations.map(e => `Equation ${e.metadata.figureNumber || '?'}: ${e.content}`).join('\n')}` 
  : ''}

${diagrams.length > 0 
  ? `Diagrams:\n${diagrams.map(d => `Diagram ${d.metadata.figureNumber || '?'}: ${d.content}`).join('\n')}` 
  : ''}

${templateSection}

═══════════════════════════════════════════
REFERENCE CONTENT (GROUNDING)
═══════════════════════════════════════════

${referenceContext}

═══════════════════════════════════════════
STRICT RULES
═══════════════════════════════════════════

1. Answer ONLY based on the uploaded references. Never hallucinate sources or authors.
2. If no template is detected, suggest an appropriate structure (e.g., IEEE, APA) based on the field. Say: "No template detected. Based on your references, I suggest [X] format. Want me to apply it?"
3. When the user mentions "Figure 1" or "Table 2", use the provided figure/table context to understand what they mean.
4. Help the user write, but do not write the entire paper for them unless explicitly asked for a draft of a section.
5. If the information is not in the materials, honestly say: "This information is not in your uploaded materials."
6. CITATIONS: Use [REF:n] inline (n = reference index). End with "SOURCES USED: [REF:1], [REF:2]" if applicable.

Help the researcher produce high-quality, grounded work.`;
}

function buildMaterialContext(materials: Material[]): string {
  if (materials.length === 0) return '(No reference content available.)';

  const tokensPerMaterial = Math.min(
    Math.floor(MATERIAL_CONTEXT_BUDGET_TOKENS / materials.length),
    3_000,
  );

  return materials
    .map((material, index) => {
      const refIndex = index + 1;
      const truncated = truncateToTokens(material.content, tokensPerMaterial);
      return `[REF:${refIndex}] ${material.name}\n---\n${truncated}`;
    })
    .join('\n\n');
}