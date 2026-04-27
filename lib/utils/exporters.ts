import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

/**
 * Export content as a Markdown string (no transformation needed).
 */
export function exportAsMarkdown(content: string, title: string): string {
  return `# ${title}\n\n${content}`;
}

/**
 * Export content as a .docx Blob using the docx library.
 */
export async function exportAsDocx(content: string, title: string): Promise<Blob> {
  const paragraphs = content
    .split('\n\n')
    .filter(Boolean)
    .map((text) => {
      const trimmed = text.trim();
      if (trimmed.startsWith('# ')) {
        return new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
        });
      }
      if (trimmed.startsWith('## ')) {
        return new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: trimmed })],
        spacing: { after: 200 },
      });
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          ...paragraphs,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Export content as a LaTeX string.
 */
export function exportAsLatex(content: string, title: string): string {
  const escaped = content
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');

  return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\title{${title}}
\\date{\\today}

\\begin{document}
\\maketitle

${escaped}

\\end{document}`;
}

/**
 * Trigger a browser download of a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}