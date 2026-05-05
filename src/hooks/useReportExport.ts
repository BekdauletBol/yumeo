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
  }: UseReportExportProps) => {
    try {
      // Parse plain text from content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.innerText || content;

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
