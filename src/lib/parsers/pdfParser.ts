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

export interface PDFParseOptions {
  extractImages?: boolean;
  maxImagePages?: number;
  maxImages?: number;
}

export async function parsePDF(file: File, options: PDFParseOptions = {}): Promise<PDFParseResult> {
  // eslint-disable-next-line no-console
  console.log(`[PDF] Starting parse for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  // Dynamic import to avoid SSR issues with PDF.js
  const pdfjsLib = await import('pdfjs-dist');

  // Use the locally bundled worker served from /public — avoids CSP issues
  // and external CDN failures on mobile / Vercel deployments.
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    // Disable web worker if it causes issues in certain environments, 
    // but usually we want it enabled for performance.
    // disableWorker: false, 
  });
  
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const pages: string[] = [];
  const images: string[] = [];
  let extractedImages = 0;
  let allowImageExtraction = options.extractImages ?? true;
  const maxImagePages = options.maxImagePages ?? pageCount;
  const maxImages = options.maxImages ?? Number.POSITIVE_INFINITY;

  for (let i = 1; i <= pageCount; i++) {
    try {
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
      const shouldExtractImages = allowImageExtraction && i <= maxImagePages && extractedImages < maxImages;
      if (shouldExtractImages) {
        const ops = await page.getOperatorList();
        for (let j = 0; j < ops.fnArray.length; j++) {
          if (extractedImages >= maxImages) {
            allowImageExtraction = false;
            break;
          }

          if (
            ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject ||
            ops.fnArray[j] === pdfjsLib.OPS.paintXObject
          ) {
            const objId = ops.argsArray[j][0];
            try {
              // Add a timeout to the promise to prevent hanging forever
              const imgObj = await Promise.race([
                new Promise<any>((resolve, reject) => {
                  try {
                    page.objs.get(objId, (obj: any) => {
                      if (obj) resolve(obj);
                      else reject(new Error('Empty image object'));
                    });
                  } catch (err) {
                    reject(err);
                  }
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Image extraction timeout')), 5000))
              ]);
              
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
                      imgData.data[dataIndex++] = imgObj.data[k + 1];
                      imgData.data[dataIndex++] = imgObj.data[k + 2];
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
                  extractedImages += 1;
                }
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn(`[PDF] Image extraction failed on page ${i}, obj ${objId}:`, err);
            }
          }
        }
      }
    } catch (pageErr) {
      // eslint-disable-next-line no-console
      console.error(`[PDF] Failed to parse page ${i}:`, pageErr);
      pages.push(`[Error parsing page ${i}]`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[PDF] Parse complete: ${pages.length} pages, ${images.length} images extracted`);

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
