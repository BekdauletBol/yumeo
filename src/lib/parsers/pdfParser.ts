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
  /** Extracted images as base64 data URLs */
  images?: string[];
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
  const images: string[] = [];

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

    // Extract images
    const ops = await page.getOperatorList();
    for (let j = 0; j < ops.fnArray.length; j++) {
      if (
        ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject ||
        ops.fnArray[j] === pdfjsLib.OPS.paintJpegXObject
      ) {
        const objId = ops.argsArray[j][0];
        try {
          const imgObj = await new Promise<any>((resolve, reject) => {
            try {
              page.objs.get(objId, resolve);
            } catch (err) {
              reject(err);
            }
          });
          
          if (imgObj && imgObj.data && imgObj.width && imgObj.height) {
            // Downscale to max 800px width/height to save space
            const MAX_DIM = 800;
            let targetW = imgObj.width;
            let targetH = imgObj.height;
            if (targetW > MAX_DIM || targetH > MAX_DIM) {
              const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
              targetW = Math.round(targetW * ratio);
              targetH = Math.round(targetH * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imgData = ctx.createImageData(imgObj.width, imgObj.height);
              
              if (imgObj.data.length === imgData.data.length) {
                imgData.data.set(imgObj.data);
              } else if (imgObj.data.length === (imgObj.width * imgObj.height * 3)) {
                let dataIndex = 0;
                for (let k = 0; k < imgObj.data.length; k += 3) {
                  imgData.data[dataIndex++] = imgObj.data[k];
                  imgData.data[dataIndex++] = imgObj.data[k+1];
                  imgData.data[dataIndex++] = imgObj.data[k+2];
                  imgData.data[dataIndex++] = 255;
                }
              }
              
              ctx.putImageData(imgData, 0, 0);

              // If downscaling is needed, draw to another canvas
              if (targetW !== imgObj.width) {
                const scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = targetW;
                scaledCanvas.height = targetH;
                const scaledCtx = scaledCanvas.getContext('2d');
                if (scaledCtx) {
                  scaledCtx.drawImage(canvas, 0, 0, targetW, targetH);
                  images.push(scaledCanvas.toDataURL('image/jpeg', 0.8));
                }
              } else {
                images.push(canvas.toDataURL('image/jpeg', 0.8));
              }
            }
          }
        } catch (err) {
          console.warn('Failed to extract image from PDF page', i, err);
        }
      }
    }
  }

  return {
    text: pages.join('\n\n'),
    pageCount,
    pages,
    images,
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