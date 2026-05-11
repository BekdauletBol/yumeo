'use client';

/**
 * DOCX text extraction using mammoth.js.
 * Runs in the browser — mammoth works with ArrayBuffer natively.
 *
 * @param file - The .docx File object
 * @returns    - Extracted plain text
 */
export interface DocxParseResult {
  text: string;
  images?: string[];
  warnings: string[];
}

export async function parseDocx(file: File): Promise<DocxParseResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  
  const images: string[] = [];
  const options = {
    convertImage: mammoth.images.imgElement((image) => {
      return image.read("base64").then((imageBuffer) => {
        const src = "data:" + image.contentType + ";base64," + imageBuffer;
        images.push(src);
        return { src };
      });
    })
  };

  const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, options);
  const rawResult = await mammoth.extractRawText({ arrayBuffer });

  const text = rawResult.value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text,
    images,
    warnings: [...htmlResult.messages, ...rawResult.messages]
      .filter((m) => m.type === 'warning')
      .map((m) => m.message),
  };
}
