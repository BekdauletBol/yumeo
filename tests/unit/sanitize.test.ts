import { describe, it, expect, vi } from 'vitest';
import { stripHtml, validateFileMagicBytes } from '@/lib/security/sanitize';

// ─── stripHtml ────────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtml('<p>Hello world</p>')).toBe('Hello world');
  });

  it('strips nested tags', () => {
    expect(stripHtml('<div><strong>Bold</strong> and <em>italic</em></div>')).toBe(
      'Bold and italic',
    );
  });

  it('preserves plain text unchanged', () => {
    expect(stripHtml('No HTML here')).toBe('No HTML here');
  });

  it('strips script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>Safe text')).toBe('alert("xss")Safe text');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('handles malformed HTML gracefully', () => {
    expect(stripHtml('<div unclosed')).toBe('');
  });
});

// ─── validateFileMagicBytes ───────────────────────────────────────────────────

describe('validateFileMagicBytes', () => {
  function makeFile(bytes: number[], type: string): File {
    const buffer = new Uint8Array(bytes).buffer;
    return new File([buffer], 'test', { type });
  }

  it('accepts a valid PDF (starts with %PDF)', async () => {
    const file = makeFile([0x25, 0x50, 0x44, 0x46, 0x2d], 'application/pdf');
    const result = await validateFileMagicBytes(file);
    expect(result).toBe(true);
  });

  it('rejects a PDF MIME type with wrong magic bytes', async () => {
    const file = makeFile([0x89, 0x50, 0x4e, 0x47], 'application/pdf'); // PNG bytes
    const result = await validateFileMagicBytes(file);
    expect(result).toBe(false);
  });

  it('accepts a valid PNG', async () => {
    const file = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a], 'image/png');
    const result = await validateFileMagicBytes(file);
    expect(result).toBe(true);
  });

  it('accepts a valid JPEG', async () => {
    const file = makeFile([0xff, 0xd8, 0xff, 0xe0], 'image/jpeg');
    const result = await validateFileMagicBytes(file);
    expect(result).toBe(true);
  });

  it('allows unknown MIME types through (returns true)', async () => {
    const file = makeFile([0x00, 0x01, 0x02], 'text/plain');
    const result = await validateFileMagicBytes(file);
    expect(result).toBe(true); // Unknown type — not blocked
  });
});