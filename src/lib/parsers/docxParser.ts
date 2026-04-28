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
  /** Any messages/warnings from mammoth */
  warnings: string[];
}

export async function parseDocx(file: File): Promise<DocxParseResult> {
  // Dynamic import — keeps the bundle small; only loaded when needed
  const mammoth = await import('mammoth');

  const arrayBuffer = await file.arrayBuffer();

  // extractRawText gives us clean plain text without any HTML
  const result = await mammoth.extractRawText({ arrayBuffer });

  const text = result.value
    .replace(/\r\n/g, '\n')        // normalize line endings
    .replace(/\n{3,}/g, '\n\n')    // collapse triple+ blank lines
    .trim();

  return {
    text,
    warnings: result.messages
      .filter((m) => m.type === 'warning')
      .map((m) => m.message),
  };
}
