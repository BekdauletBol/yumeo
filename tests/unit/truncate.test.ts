import { describe, it, expect } from 'vitest';
import { truncate, truncateToTokens, formatFileSize } from '@/lib/utils/truncate';

describe('truncate', () => {
  it('returns the string unchanged when within limit', () => {
    expect(truncate('Hello world', 20)).toBe('Hello world');
  });

  it('truncates at word boundary and appends ellipsis', () => {
    const result = truncate('The quick brown fox jumped', 20);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('handles exact-length strings', () => {
    const str = 'abcde';
    expect(truncate(str, 5)).toBe(str);
  });

  it('truncates strings with no spaces at character boundary', () => {
    const result = truncate('abcdefghijklmnopqrstuvwxyz', 10);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('truncateToTokens', () => {
  it('truncates to approximate token count (4 chars per token)', () => {
    const str = 'a'.repeat(400); // 400 chars ≈ 100 tokens
    const result = truncateToTokens(str, 50); // 50 tokens ≈ 200 chars
    expect(result.length).toBeLessThanOrEqual(200);
  });
});

describe('formatFileSize', () => {
  it('formats bytes under 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats KB range', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats MB range', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats exactly 1 KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });
});