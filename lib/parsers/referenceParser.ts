/**
 * Parse BibTeX entries into structured metadata.
 *
 * Supports common entry types: @article, @book, @inproceedings, @misc
 */

export interface ParsedReference {
    type: string;
    key: string;
    title?: string;
    authors?: string[];
    year?: number;
    journal?: string;
    doi?: string;
    url?: string;
    abstract?: string;
    raw: string;
  }
  
  /**
   * Parse a BibTeX string into an array of references.
   */
  export function parseBibTeX(bibtex: string): ParsedReference[] {
    const entries: ParsedReference[] = [];
  
    // Match each @type{key, ...} block
    const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([^@]*)/g;
    let match: RegExpExecArray | null;
  
    while ((match = entryRegex.exec(bibtex)) !== null) {
      const type = (match[1] ?? '').toLowerCase();
      const key = match[2] ?? '';
      const body = match[3] ?? '';
  
      const fields = parseFields(body);
  
      entries.push({
        type,
        key,
        title: fields['title'],
        authors: parseAuthors(fields['author'] ?? ''),
        year: fields['year'] ? parseInt(fields['year'], 10) : undefined,
        journal: fields['journal'] ?? fields['booktitle'],
        doi: fields['doi'],
        url: fields['url'],
        abstract: fields['abstract'],
        raw: match[0],
      });
    }
  
    return entries;
  }
  
  /**
   * Convert a ParsedReference to a formatted display string.
   */
  export function formatReference(ref: ParsedReference): string {
    const parts: string[] = [];
    if (ref.authors && ref.authors.length > 0) {
      parts.push(ref.authors.join(', '));
    }
    if (ref.year) parts.push(`(${ref.year})`);
    if (ref.title) parts.push(ref.title);
    if (ref.journal) parts.push(ref.journal);
    if (ref.doi) parts.push(`DOI: ${ref.doi}`);
    return parts.join('. ');
  }
  
  /**
   * Fetch metadata for a DOI using the Crossref API.
   * Returns null if the DOI cannot be resolved.
   */
  export async function fetchDOIMetadata(
    doi: string,
  ): Promise<Partial<ParsedReference> | null> {
    try {
      const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Yumeo/1.0 (mailto:support@yumeo.app)' },
      });
      if (!response.ok) return null;
  
      const data = (await response.json()) as {
        message: {
          title?: string[];
          author?: { given?: string; family?: string }[];
          issued?: { 'date-parts'?: number[][] };
          'container-title'?: string[];
          DOI?: string;
          abstract?: string;
        };
      };
  
      const msg = data.message;
      const year = msg.issued?.['date-parts']?.[0]?.[0];
  
      return {
        title: msg.title?.[0],
        authors: msg.author?.map(
          (a) => `${a.family ?? ''}${a.given ? ', ' + a.given : ''}`,
        ),
        year: typeof year === 'number' ? year : undefined,
        journal: msg['container-title']?.[0],
        doi: msg.DOI,
        abstract: msg.abstract,
      };
    } catch {
      return null;
    }
  }
  
  // ─── Private helpers ─────────────────────────────────────────────────────────
  
  function parseFields(body: string): Record<string, string> {
    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*[{"']?([\s\S]*?)[}"']\s*(?=,\s*\w+\s*=|$)/g;
    let match: RegExpExecArray | null;
  
    while ((match = fieldRegex.exec(body)) !== null) {
      const key = (match[1] ?? '').toLowerCase();
      const value = (match[2] ?? '').replace(/[{}]/g, '').trim();
      fields[key] = value;
    }
  
    return fields;
  }
  
  function parseAuthors(authorString: string): string[] {
    if (!authorString.trim()) return [];
    return authorString
      .split(' and ')
      .map((a) => a.trim())
      .filter(Boolean);
  }