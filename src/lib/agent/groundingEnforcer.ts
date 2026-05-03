/**
 * Grounding Enforcer for Yumeo Research Assistant
 * Ensures AI only answers based on uploaded references
 */

/**
 * Common phrases indicating hallucination or external knowledge
 */
export const HALLUCINATION_INDICATORS = [
  'I am not aware',
  'As an AI, I',
  'In my training data',
  'It is generally accepted',
  'Common sense dictates',
  'Everyone knows',
  'It is well-known',
  'Based on general knowledge',
  'In typical scenarios',
  'Most researchers would agree',
  'Standard practice is',
  'The general consensus',
];

/**
 * Phrases that indicate the AI properly scoped its answer
 */
export const PROPER_GROUNDING_PHRASES = [
  'In your materials',
  'Your references mention',
  'According to',
  'Source:',
  '(Source:',
  'Your uploaded files',
  'In the provided',
  'Based on your references',
  'As stated in',
];

/**
 * Check if response appears grounded in materials
 */
export function checkGrounding(response: string): {
  isGrounded: boolean;
  hallucinations: string[];
  groundingIndicators: string[];
} {
  const hallucinations: string[] = [];
  const groundingIndicators: string[] = [];

  // Check for hallucination indicators
  for (const indicator of HALLUCINATION_INDICATORS) {
    if (response.toLowerCase().includes(indicator.toLowerCase())) {
      hallucinations.push(indicator);
    }
  }

  // Check for proper grounding phrases
  for (const phrase of PROPER_GROUNDING_PHRASES) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      groundingIndicators.push(phrase);
    }
  }

  // Response is grounded if it has grounding indicators and no hallucination phrases
  // OR if it properly says "I don't have this"
  const hasProperRefusal = response.includes("I don't have this in your uploaded materials");

  return {
    isGrounded: groundingIndicators.length > 0 || hasProperRefusal || hallucinations.length === 0,
    hallucinations: [...new Set(hallucinations)],
    groundingIndicators: [...new Set(groundingIndicators)],
  };
}

/**
 * Enforce strict grounding: if response seems hallucinated, provide standard refusal
 */
export function enforceGrounding(response: string): string {
  const grounding = checkGrounding(response);

  // If there are hallucinations detected and no grounding, return strict refusal
  if (grounding.hallucinations.length > 0 && grounding.groundingIndicators.length === 0) {
    return (
      "I don't have this in your uploaded materials. " +
      'To get an answer, please upload relevant references and try again.'
    );
  }

  return response;
}

/**
 * Generate system suffix to reinforce strict grounding
 * Append to system prompt before each request
 */
export function generateGroundingEnforcement(materialsCount: number): string {
  return `
GROUNDING ENFORCEMENT:
- You have access to ${materialsCount} uploaded reference(s)
- Answer ONLY using these materials
- If the answer is not in the materials, respond with: "I don't have this in your uploaded materials."
- Do NOT use external knowledge, training data, or assumptions
- Do NOT say "based on general knowledge" or "typically" — these are violations`;
}

/**
 * Check response for required citation patterns
 * Returns true if response properly cites sources
 */
export function hasSufficientCitations(response: string, minCitations = 1): boolean {
  // Count proper citation patterns: (Source: filename, p. N)
  const citationPattern = /\(Source:\s*[^,]+,\s*p\.\s*\d+/gi;
  const citations = response.match(citationPattern) || [];

  // Count at least minCitations proper citations
  return citations.length >= minCitations;
}

/**
 * Extract parts of response that might be unsourced
 */
export function identifyUnsourcedClaims(response: string): string[] {
  const unsourced: string[] = [];
  const paragraphs = response.split('\n\n');

  for (const para of paragraphs) {
    // Skip citations section
    if (para.includes('Sources:') || para.includes('(Source:')) {
      continue;
    }

    // Check if paragraph has assertive claims without citations
    const hasAssertiveClaim = /\b(shows|demonstrates|proves|indicates|suggests|reveals)\b/i.test(para);
    const hasCitation = /\(Source:/i.test(para);

    if (hasAssertiveClaim && !hasCitation) {
      unsourced.push(para.substring(0, 150) + '...');
    }
  }

  return unsourced;
}

/**
 * Validate that response follows all grounding rules
 */
export function validateGroundingCompliance(response: string): {
  compliant: boolean;
  issues: Array<{
    issue: string;
    severity: 'critical' | 'warning' | 'info';
    explanation: string;
  }>;
} {
  const issues: Array<{
    issue: string;
    severity: 'critical' | 'warning' | 'info';
    explanation: string;
  }> = [];

  const grounding = checkGrounding(response);
  const unsourced = identifyUnsourcedClaims(response);

  // Check for hallucinations
  if (grounding.hallucinations.length > 0) {
    issues.push({
      issue: 'Potential hallucination detected',
      severity: 'critical',
      explanation: `Used external knowledge: "${grounding.hallucinations[0]}"`,
    });
  }

  // Check for unsourced claims
  if (unsourced.length > 0) {
    issues.push({
      issue: `Found ${unsourced.length} claim(s) without sources`,
      severity: 'warning',
      explanation: 'Assertive claims must be cited: ' + unsourced[0],
    });
  }

  // Check for proper refusal pattern
  const shouldRefuse = response.includes("I don't have this");
  if (shouldRefuse && grounding.groundingIndicators.length === 0) {
    issues.push({
      issue: 'Proper refusal pattern used',
      severity: 'info',
      explanation: 'Response correctly indicates missing information',
    });
  }

  return {
    compliant: issues.filter((i) => i.severity === 'critical').length === 0,
    issues,
  };
}
