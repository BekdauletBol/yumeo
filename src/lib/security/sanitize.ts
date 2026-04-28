/**
 * Sanitize user-generated HTML to prevent XSS.
 * Uses DOMPurify on the client side.
 *
 * On the server, strings are never inserted as HTML so this is a no-op.
 */
export function sanitizeHtml(dirty: string): string {
    if (typeof window === 'undefined') return dirty; // server: no DOM
    // Dynamic import so DOMPurify only loads in the browser
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const DOMPurifyModule = require('dompurify');
    const purify = (DOMPurifyModule.default ?? DOMPurifyModule) as { sanitize: (dirty: string, config?: Record<string, unknown>) => string };
    return purify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }
  
  /**
   * Strip all HTML tags from a string, returning plain text.
   */
  export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
  
  /**
   * Validate that a file's MIME type matches its magic bytes.
   * Returns true if the file is safe to process.
   */
  export async function validateFileMagicBytes(file: File): Promise<boolean> {
    const MAGIC: Record<string, number[][]> = {
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
      'image/png': [[0x89, 0x50, 0x4e, 0x47]],
      'image/jpeg': [[0xff, 0xd8, 0xff]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    };
  
    const signatures = MAGIC[file.type];
    if (!signatures) return true; // Unknown type — allow, validate elsewhere
  
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
  
    return signatures.some((sig) =>
      sig.every((byte, i) => bytes[i] === byte),
    );
  }