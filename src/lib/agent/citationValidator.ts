/**
 * Citation Validator for Yumeo Research Assistant
 * Ensures all claims are properly sourced and cited
 */

/**
 * Patterns for detecting unsourced claims
 */
export const UNSOURCED_PATTERNS = [
  // Claims without citations
  /\b(According to|Studies show|Research indicates|It is known that)\s+[^(]*(?!\(Source:|[SEP].*p\.\s*\d+\))/gi,
  // Weak citations
  /\(Source:\s*p\.\s*\?\)/gi,
  // Missing page numbers on PDFs
  /\(Source:\s*[^,]+\.pdf\s*,\s*p\.\s*\?\)/gi,
];

/**
 * Patterns for properly cited claims
 */
export const PROPER_CITATION_PATTERN = /\(Source:\s*[^,]+,\s*p\.\s*\d+(?:-\d+)?\)/gi;

/**
 * Validate that a response follows citation rules
 * Returns array of issues found, or empty array if citation is strict
 */
export function validateCitations(response: string): {
  passed: boolean;
  issues: Array<{
    type: 'missing-source' | 'weak-source' | 'vague-reference';
    line: string;
    suggestion: string;
  }>;
} {
  const issues: Array<{
    type: 'missing-source' | 'weak-source' | 'vague-reference';
    line: string;
    suggestion: string;
  }> = [];

  const lines = response.split('\n');

  for (const line of lines) {
    // Skip headers and metadata lines
    if (line.trim().startsWith('═') || line.trim().startsWith('Sources:') || line.trim() === '') {
      continue;
    }

    // Check for unsourced claims
    for (const pattern of UNSOURCED_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          type: 'missing-source',
          line: line.substring(0, 100),
          suggestion: 'Add citation: (Source: filename, page N)',
        });
      }
    }

    // Check for weak sources (missing page numbers)
    if (/\(Source:\s*\?\)/gi.test(line)) {
      issues.push({
        type: 'weak-source',
        line: line.substring(0, 100),
        suggestion: 'Specify page number: (Source: filename, p. X)',
      });
    }

    // Check for vague references
    if (/\(Source:\s*materials?\)/gi.test(line)) {
      issues.push({
        type: 'vague-reference',
        line: line.substring(0, 100),
        suggestion: 'Specify exact source: (Source: specific_file.pdf, p. X)',
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Extract all citations from a response
 */
export function extractCitations(response: string): Array<{
  source: string;
  page?: number;
  fullCitation: string;
}> {
  const citations: Array<{
    source: string;
    page?: number;
    fullCitation: string;
  }> = [];

  const citationRegex = /\(Source:\s*([^,]+),\s*p\.\s*(\d+)(?:-\d+)?\)/gi;
  let match;

  while ((match = citationRegex.exec(response)) !== null) {
    if (match[1] && match[2]) {
      citations.push({
        source: match[1].trim(),
        page: parseInt(match[2], 10),
        fullCitation: match[0],
      });
    }
  }

  return citations;
}

/**
 * Check if response answers based ONLY on provided materials
 * Returns warning if response seems to use external knowledge
 */
export function detectExternalKnowledge(response: string): {
  likelyExternal: boolean;
  indicators: string[];
} {
  const indicators: string[] = [];

  // Phrases indicating external knowledge (not from materials)
  const externalIndicators = [
    /\b(generally|typically|usually|it is well-known that)\b/gi,
    /\b(common sense|everyone knows|obviously)\b/gi,
    /\b(as we all know|as mentioned earlier)\b/gi, // "as mentioned earlier" without citation
    /\b(in general|broadly speaking)\b/gi,
  ];

  for (const pattern of externalIndicators) {
    const matches = response.match(pattern);
    if (matches) {
      indicators.push(...matches);
    }
  }

  return {
    likelyExternal: indicators.length > 0,
    indicators: [...new Set(indicators)],
  };
}

/**
 * Format citation properly for academic use
 */
export function formatCitation(
  sourceFilename: string,
  pageNumber?: number,
  pageEnd?: number,
): string {
  if (!pageNumber) {
    return `(Source: ${sourceFilename})`;
  }

  if (pageEnd && pageEnd !== pageNumber) {
    return `(Source: ${sourceFilename}, p. ${pageNumber}-${pageEnd})`;
  }

  return `(Source: ${sourceFilename}, p. ${pageNumber})`;
}
