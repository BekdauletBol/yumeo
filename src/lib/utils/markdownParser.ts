/**
 * markdownParser.ts
 *
 * Converts Markdown text into:
 *  1. A structured AST of `MdBlock[]` (used to build DOCX paragraphs)
 *  2. A clean HTML string (used for PDF rendering)
 *
 * Handles:
 *   # / ## / ###  → Headings
 *   **text**       → Bold
 *   *text*         → Italic
 *   `code`         → Inline code
 *   ---            → Horizontal rule
 *   - / * / 1.    → Lists
 *   > text         → Blockquote
 *   [REF:n]        → stripped (citation tags)
 *   AI preamble    → stripped ("Certainly! Based on..." etc.)
 */

// ─── Preamble patterns to strip before export ────────────────────────────────
const PREAMBLE_PATTERNS = [
  /^(certainly[!,.]?\s+based on (the|your|my) (provided|uploaded|given|available)[^.]*\.[\s\S]*?(?=\n#{1,3}\s|\n\n[A-Z]))/i,
  /^(sure[!,.]?\s+here[^\n]*\n+)/i,
  /^(of course[!,.]?\s+[^\n]*\n+)/i,
  /^(based on (the|your|my) (provided|uploaded|reference|given)[^\n]*\n+)/i,
  /^(here is (a|the|your)[^\n]*\n+)/i,
  /^(i('ve| have) (reviewed|analyzed|read|examined)[^\n]*\n+)/i,
  /^\s*\[REF:\d+\]\s*/gm,
];

/** Strip AI preamble phrases and citation tags from content before export */
export function stripPreamble(raw: string): string {
  let text = raw.trim();
  for (const pattern of PREAMBLE_PATTERNS) {
    text = text.replace(pattern, '');
  }
  return text.trim();
}

// ─── Block types ──────────────────────────────────────────────────────────────
export type MdInlineRun =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'boldItalic'; text: string }
  | { type: 'code'; text: string };

export type MdBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; runs: MdInlineRun[] }
  | { kind: 'paragraph'; runs: MdInlineRun[] }
  | { kind: 'hr' }
  | { kind: 'listItem'; ordered: boolean; index: number; runs: MdInlineRun[] }
  | { kind: 'blockquote'; runs: MdInlineRun[] }
  | { kind: 'codeBlock'; text: string };

// ─── Inline parser ─────────────────────────────────────────────────────────────
export function parseInline(text: string): MdInlineRun[] {
  const runs: MdInlineRun[] = [];
  // Pattern order matters: boldItalic > bold > italic > code
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      runs.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      runs.push({ type: 'boldItalic', text: match[2] });
    } else if (match[3]) {
      runs.push({ type: 'bold', text: match[3] });
    } else if (match[4]) {
      runs.push({ type: 'italic', text: match[4] });
    } else if (match[5]) {
      runs.push({ type: 'code', text: match[5] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return runs.filter((r) => r.text.length > 0);
}

// ─── Block parser ─────────────────────────────────────────────────────────────
export function parseMarkdown(raw: string): MdBlock[] {
  const cleaned = stripPreamble(raw);
  const lines = cleaned.split('\n');
  const blocks: MdBlock[] = [];

  let i = 0;
  let orderedIndex = 1;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Fenced code block
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        codeLines.push(lines[i] ?? '');
        i++;
      }
      blocks.push({ kind: 'codeBlock', text: codeLines.join('\n') });
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h3) { blocks.push({ kind: 'heading', level: 3, runs: parseInline(h3[1] ?? '') }); i++; continue; }
    if (h2) { blocks.push({ kind: 'heading', level: 2, runs: parseInline(h2[1] ?? '') }); i++; continue; }
    if (h1) { blocks.push({ kind: 'heading', level: 1, runs: parseInline(h1[1] ?? '') }); i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ kind: 'hr' });
      i++;
      orderedIndex = 1;
      continue;
    }

    // Unordered list
    const ul = line.match(/^[\*\-]\s+(.*)/);
    if (ul) {
      blocks.push({ kind: 'listItem', ordered: false, index: 0, runs: parseInline(ul[1] ?? '') });
      i++;
      orderedIndex = 1;
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.*)/);
    if (ol) {
      blocks.push({ kind: 'listItem', ordered: true, index: orderedIndex, runs: parseInline(ol[1] ?? '') });
      orderedIndex++;
      i++;
      continue;
    }

    // Blockquote
    const bq = line.match(/^>\s?(.*)/);
    if (bq) {
      blocks.push({ kind: 'blockquote', runs: parseInline(bq[1] ?? '') });
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === '') { i++; orderedIndex = 1; continue; }

    // Normal paragraph
    blocks.push({ kind: 'paragraph', runs: parseInline(line) });
    i++;
  }

  return blocks;
}

// ─── HTML renderer (for PDF) ──────────────────────────────────────────────────
function runsToHtml(runs: MdInlineRun[]): string {
  return runs.map((r) => {
    const esc = r.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    switch (r.type) {
      case 'bold':       return `<strong>${esc}</strong>`;
      case 'italic':     return `<em>${esc}</em>`;
      case 'boldItalic': return `<strong><em>${esc}</em></strong>`;
      case 'code':       return `<code>${esc}</code>`;
      default:           return esc;
    }
  }).join('');
}

export function markdownToHtml(raw: string, docTitle: string): string {
  const blocks = parseMarkdown(raw);

  const body = blocks.map((b) => {
    switch (b.kind) {
      case 'heading':    return `<h${b.level}>${runsToHtml(b.runs)}</h${b.level}>`;
      case 'paragraph':  return `<p>${runsToHtml(b.runs)}</p>`;
      case 'hr':         return `<hr>`;
      case 'listItem':   return b.ordered
        ? `<li value="${b.index}">${runsToHtml(b.runs)}</li>`
        : `<li>${runsToHtml(b.runs)}</li>`;
      case 'blockquote': return `<blockquote>${runsToHtml(b.runs)}</blockquote>`;
      case 'codeBlock':  return `<pre><code>${b.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`;
      default:           return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000;
      background: #fff;
      padding: 2.54cm;
      max-width: 21cm;
      margin: 0 auto;
    }
    h1 { font-size: 18pt; margin: 18pt 0 10pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
    h2 { font-size: 14pt; margin: 16pt 0 8pt; }
    h3 { font-size: 12pt; margin: 12pt 0 6pt; }
    p  { margin-bottom: 10pt; text-align: justify; }
    ul, ol { margin-left: 20pt; margin-bottom: 10pt; }
    li { margin-bottom: 4pt; }
    blockquote { border-left: 3pt solid #999; padding-left: 12pt; color: #555; margin: 12pt 0; font-style: italic; }
    code { font-family: 'Courier New', monospace; font-size: 10pt; background: #f5f5f5; padding: 1pt 3pt; }
    pre  { background: #f5f5f5; padding: 8pt; border: 1pt solid #ddd; margin: 10pt 0; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    hr { border: none; border-top: 1pt solid #ccc; margin: 14pt 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
  <h1>${docTitle}</h1>
${body}
</body>
</html>`;
}
