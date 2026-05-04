import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface UseReportExportProps {
  title: string;
  content: string;
  citations?: Array<{ author: string; year: number; page: number }>;
}

export function useReportExport() {
  const exportToDOCX = async ({
    title,
    content,
    citations = [],
  }: UseReportExportProps) => {
    try {
      // Parse HTML content to plain text (simplified)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.innerText;

      // Check for unverified citations
      const hasUnverifiedCitations = citations.some(
        (c) => !c.author || !c.year
      );

      if (hasUnverifiedCitations) {
        alert('Cannot export: Please verify all citations first.');
        return;
      }

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: plainText,
                spacing: { after: 200 },
              }),
              // Add citations
              ...(citations.length > 0 ? [
                new Paragraph({
                  text: 'References',
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 200, after: 200 },
                }),
                ...citations.map(
                  (c) =>
                    new Paragraph({
                      text: `${c.author}, ${c.year}, p. ${c.page}`,
                      spacing: { after: 100 },
                    })
                ),
              ] : []),
            ],
          },
        ],
      });

      // Generate and download
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || 'report'}.docx`);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      alert('Failed to export document');
    }
  };

  const exportToPDF = async ({
    title,
    content,
    citations = [],
  }: UseReportExportProps) => {
    try {
      // For now, suggest exporting as DOCX then converting
      // In production, use a library like jsPDF or html2pdf
      alert(
        'PDF export coming soon. For now, export as DOCX and convert using your preferred tool.'
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export document');
    }
  };

  return { exportToDOCX, exportToPDF };
}
