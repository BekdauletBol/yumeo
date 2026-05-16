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
  volume?: string;
  issue?: string;
  pages?: string;
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
      volume: fields['volume'],
      issue: fields['number'] ?? fields['issue'],
      pages: fields['pages'],
      doi: fields['doi'],
      url: fields['url'],
      abstract: fields['abstract'],
      raw: match[0],
    });
  }

  return entries;
}

/**
 * Convert a ParsedReference to a formatted display string (APA 7th Edition).
 * Format: Author, A. A. (Year). Title. Journal Name, Vol(Issue), Pages. https://doi.org/DOI
 */
export function formatReference(ref: ParsedReference): string {
  const parts: string[] = [];

  // 1. Authors: Last, F. M.
  if (ref.authors && ref.authors.length > 0) {
    const formattedAuthors = ref.authors.map(a => {
      // Handle "Last, First" or "First Last"
      if (a.includes(',')) {
        const [last, first] = a.split(',').map(s => s.trim());
        const initials = first ? first.split(/\s+/).map(n => `${n[0]}.`).join(' ') : '';
        return `${last}, ${initials}`.trim();
      } else {
        const names = a.split(/\s+/);
        const last = names.pop() || '';
        const initials = names.map(n => `${n[0]}.`).join(' ');
        return `${last}, ${initials}`.trim();
      }
    });

    if (formattedAuthors.length > 1) {
      const lastAuthor = formattedAuthors.pop();
      parts.push(`${formattedAuthors.join(', ')} & ${lastAuthor}`);
    } else {
      parts.push(formattedAuthors[0] || '');
    }
  }

  // 2. Year
  if (ref.year) {
    parts.push(`(${ref.year})`);
  }

  // 3. Title (no quotes, ends with period)
  if (ref.title) {
    const title = ref.title.trim().endsWith('.') ? ref.title : `${ref.title}.`;
    parts.push(title);
  }

  // 4. Journal/Container (italics) + Volume/Issue + Pages
  let container = '';
  if (ref.journal) {
    container += `*${ref.journal.trim()}*`;
    
    if (ref.volume) {
      container += `, ${ref.volume}`;
      if (ref.issue) container += `(${ref.issue})`;
    }
    
    if (ref.pages) {
      container += `, ${ref.pages.replace('--', '–')}`;
    }
    
    if (!container.endsWith('.')) container += '.';
    parts.push(container);
  }

  // 5. DOI/URL
  if (ref.doi) {
    const doiUrl = ref.doi.startsWith('http') ? ref.doi : `https://doi.org/${ref.doi}`;
    parts.push(doiUrl);
  } else if (ref.url) {
    parts.push(ref.url);
  }

  return parts.join(' ');
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
        volume?: string;
        'journal-issue'?: { issue?: string };
        page?: string;
        DOI?: string;
        abstract?: string;
      };
    };

    const msg = data.message;
    const year = msg.issued?.['date-parts']?.[0]?.[0];

    return {
      title: msg.title?.[0],
      authors: msg.author?.map(
        (a) => `${a.family ?? ''}, ${a.given ?? ''}`,
      ),
      year: typeof year === 'number' ? year : undefined,
      journal: msg['container-title']?.[0],
      volume: msg.volume,
      issue: msg['journal-issue']?.issue,
      pages: msg.page,
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
  // Improved field regex to handle various BibTeX value formats
  const fieldRegex = /(\w+)\s*=\s*[{"']?([\s\S]*?)[}"']?\s*(?=,\s*\w+\s*=|$)/g;
  let match: RegExpExecArray | null;

  while ((match = fieldRegex.exec(body)) !== null) {
    const key = (match[1] ?? '').toLowerCase();
    let value = (match[2] ?? '').replace(/[{}]/g, '').trim();
    // Strip trailing commas if they were accidentally captured
    if (value.endsWith(',')) value = value.slice(0, -1);
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