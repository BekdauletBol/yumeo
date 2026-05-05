/**
 * useReportExport.ts
 *
 * Exports a report to DOCX (proper headings/bold/italic/HR) or PDF (print dialog).
 * Markdown is fully parsed — no raw asterisks or hash signs in output.
 */
import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, BorderStyle, AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';
import { parseMarkdown, markdownToHtml, type MdInlineRun } from '@/lib/utils/markdownParser';

export interface ExportPayload {
  title: string;
  content: string;
}

// ─── Inline runs → docx TextRuns ─────────────────────────────────────────────
function runsToDocx(runs: MdInlineRun[]): TextRun[] {
  return runs.map((r) => {
    switch (r.type) {
      case 'bold':
        return new TextRun({ text: r.text, bold: true });
      case 'italic':
        return new TextRun({ text: r.text, italics: true });
      case 'boldItalic':
        return new TextRun({ text: r.text, bold: true, italics: true });
      case 'code':
        return new TextRun({
          text: r.text,
          font: 'Courier New',
          color: '444444',
        });
      default:
        return new TextRun({ text: r.text });
    }
  });
}

// ─── DOCX export ─────────────────────────────────────────────────────────────
export async function exportToDOCX({ title, content }: ExportPayload): Promise<void> {
  const blocks = parseMarkdown(content);

  const children: Paragraph[] = [
    // Document title
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true, size: 36 })],
      spacing: { after: 400 },
    }),
  ];

  for (const block of blocks) {
    switch (block.kind) {
      case 'heading': {
        const levels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
        };
        children.push(
          new Paragraph({
            heading: levels[block.level] ?? HeadingLevel.HEADING_1,
            children: runsToDocx(block.runs),
            spacing: { before: 300, after: 100 },
          }),
        );
        break;
      }

      case 'paragraph': {
        children.push(
          new Paragraph({
            children: runsToDocx(block.runs),
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
          }),
        );
        break;
      }

      case 'hr': {
        children.push(
          new Paragraph({
            children: [new TextRun('')],
            border: {
              bottom: {
                color: 'AAAAAA',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { before: 200, after: 200 },
          }),
        );
        break;
      }

      case 'listItem': {
        const bullet = block.ordered ? `${block.index}. ` : '• ';
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: bullet }),
              ...runsToDocx(block.runs),
            ],
            indent: { left: 360 },
            spacing: { after: 80 },
          }),
        );
        break;
      }

      case 'blockquote': {
        children.push(
          new Paragraph({
            children: runsToDocx(block.runs),
            indent: { left: 720 },
            spacing: { after: 120 },
            border: {
              left: {
                color: '999999',
                space: 8,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
        );
        break;
      }

      case 'codeBlock': {
        for (const line of block.text.split('\n')) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 20, color: '333333' })],
              indent: { left: 360 },
              spacing: { after: 0 },
            }),
          );
        }
        break;
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 }, // 12pt = 24 half-points
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch = 1440 twips
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || 'report'}.docx`);
}

// ─── PDF export (using html2pdf.js) ─────────────────────────────
export async function exportToPDF({ title, content }: ExportPayload): Promise<void> {
  const html = markdownToHtml(content, title);
  
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  
  // Dynamically import html2pdf to avoid SSR issues
  // @ts-ignore - html2pdf doesn't have great types out of the box
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin:       1,
    filename:     `${title || 'report'}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
  };

  await html2pdf().set(opt).from(container).save();
}

// ─── Hook (for use in React components) ──────────────────────────────────────
export function useReportExport() {
  return { exportToDOCX, exportToPDF };
}
