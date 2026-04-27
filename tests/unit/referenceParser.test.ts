import { describe, it, expect } from 'vitest';
import { parseBibTeX, formatReference } from '@/lib/parsers/referenceParser';

const SAMPLE_BIBTEX = `
@article{smith2023,
  title  = {Neural Networks for Classification},
  author = {Smith, J. and Doe, A. and Lee, B.},
  year   = {2023},
  journal = {Nature Machine Intelligence},
  doi    = {10.1234/nmi.2023.42},
  abstract = {We present a novel approach to classification.}
}

@book{jones2021,
  title  = {Deep Learning Fundamentals},
  author = {Jones, R.},
  year   = {2021}
}
`;

describe('parseBibTeX', () => {
  it('parses an @article entry', () => {
    const refs = parseBibTeX(SAMPLE_BIBTEX);
    const article = refs.find((r) => r.key === 'smith2023');
    expect(article).toBeDefined();
    expect(article?.type).toBe('article');
    expect(article?.title).toContain('Neural Networks');
  });

  it('extracts authors correctly', () => {
    const refs = parseBibTeX(SAMPLE_BIBTEX);
    const article = refs.find((r) => r.key === 'smith2023');
    expect(article?.authors).toContain('Smith, J.');
    expect(article?.authors).toContain('Doe, A.');
  });

  it('extracts year as a number', () => {
    const refs = parseBibTeX(SAMPLE_BIBTEX);
    const article = refs.find((r) => r.key === 'smith2023');
    expect(article?.year).toBe(2023);
  });

  it('extracts DOI', () => {
    const refs = parseBibTeX(SAMPLE_BIBTEX);
    const article = refs.find((r) => r.key === 'smith2023');
    expect(article?.doi).toBe('10.1234/nmi.2023.42');
  });

  it('parses a @book entry', () => {
    const refs = parseBibTeX(SAMPLE_BIBTEX);
    const book = refs.find((r) => r.key === 'jones2021');
    expect(book).toBeDefined();
    expect(book?.type).toBe('book');
    expect(book?.title).toContain('Deep Learning');
  });

  it('returns empty array for empty input', () => {
    expect(parseBibTeX('')).toHaveLength(0);
  });
});

describe('formatReference', () => {
  it('formats a full reference correctly', () => {
    const formatted = formatReference({
      type: 'article',
      key: 'test',
      title: 'Test Title',
      authors: ['Smith, J.'],
      year: 2023,
      journal: 'Science',
      doi: '10.1/test',
      raw: '',
    });
    expect(formatted).toContain('Smith, J.');
    expect(formatted).toContain('(2023)');
    expect(formatted).toContain('Test Title');
    expect(formatted).toContain('Science');
  });

  it('handles missing optional fields', () => {
    const formatted = formatReference({
      type: 'misc',
      key: 'minimal',
      raw: '',
    });
    // Should not throw and should return some string
    expect(typeof formatted).toBe('string');
  });
});