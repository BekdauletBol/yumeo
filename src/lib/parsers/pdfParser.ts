'use client';

/**
 * PDF text extraction using Mozilla PDF.js.
 * Runs in the browser only (or in a Web Worker for performance).
 *
 * @param file - The PDF File object from a file input or drag-and-drop
 * @returns    - Extracted text content and page count
 */
export interface PDFParseResult {
  text: string;
  pageCount: number;
  /** Text per page, for future granular citation */
  pages: string[];
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  // Dynamic import to avoid SSR issues with PDF.js
  const pdfjsLib = await import('pdfjs-dist');

  // Use the locally bundled worker served from /public — avoids CSP issues
  // and external CDN failures on mobile / Vercel deployments.
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const pages: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }

  return {
    text: pages.join('\n\n'),
    pageCount,
    pages,
  };
}

/**
 * Extract metadata hints from a PDF's first page and filename.
 * Returns best-guess year, authors, DOI etc.
 */
export function extractPDFMetadataHints(
  firstPageText: string,
  _filename: string,
): {
  year?: number;
  doi?: string;
} {
  const result: { year?: number; doi?: string } = {};

  // Year: look for 4-digit year in range 1900–2099
  const yearMatch = firstPageText.match(/\b(19|20)\d{2}\b/);
  if (yearMatch?.[0]) result.year = parseInt(yearMatch[0], 10);

  // DOI
  const doiMatch = firstPageText.match(/\b10\.\d{4,}\/[^\s]+/);
  if (doiMatch?.[0]) result.doi = doiMatch[0].replace(/[.,;]$/, '');

  return result;
}