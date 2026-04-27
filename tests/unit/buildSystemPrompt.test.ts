import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/lib/agent/buildSystemPrompt';
import type { Material, ProjectSettings } from '@/lib/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_SETTINGS: ProjectSettings = {
  agentModel: 'claude-sonnet-4-5',
  strictGrounding: true,
  language: 'en',
  exportFormat: 'markdown',
};

function makeMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 'mat-1',
    projectId: 'proj-1',
    section: 'references',
    name: 'Smith et al. 2023.pdf',
    content: 'Neural networks show remarkable performance on classification tasks.',
    metadata: {
      fileType: 'pdf',
      fileSize: 102_400,
      authors: ['Smith, J.', 'Doe, A.'],
      year: 2023,
      doi: '10.1234/example',
      pageCount: 12,
    },
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  it('includes the Yumeo identity preamble', () => {
    const prompt = buildSystemPrompt([], BASE_SETTINGS);
    expect(prompt).toContain('Yumeo');
    expect(prompt).toContain('Research IDE');
  });

  it('includes CRITICAL CONSTRAINT when strictGrounding is true', () => {
    const prompt = buildSystemPrompt([], { ...BASE_SETTINGS, strictGrounding: true });
    expect(prompt).toContain('CRITICAL CONSTRAINT');
    expect(prompt).toContain('not in your uploaded materials');
  });

  it('does not include CRITICAL CONSTRAINT when strictGrounding is false', () => {
    const prompt = buildSystemPrompt([], { ...BASE_SETTINGS, strictGrounding: false });
    expect(prompt).not.toContain('CRITICAL CONSTRAINT');
    expect(prompt).toContain('PREFERENCE');
  });

  it('includes [REF:1] for the first material', () => {
    const mat = makeMaterial();
    const prompt = buildSystemPrompt([mat], BASE_SETTINGS);
    expect(prompt).toContain('[REF:1]');
    expect(prompt).toContain('Smith et al. 2023.pdf');
  });

  it('includes [REF:2] for the second material', () => {
    const mat1 = makeMaterial({ id: 'mat-1', name: 'Paper A.pdf' });
    const mat2 = makeMaterial({ id: 'mat-2', name: 'Paper B.pdf' });
    const prompt = buildSystemPrompt([mat1, mat2], BASE_SETTINGS);
    expect(prompt).toContain('[REF:1]');
    expect(prompt).toContain('[REF:2]');
    expect(prompt).toContain('Paper A.pdf');
    expect(prompt).toContain('Paper B.pdf');
  });

  it('shows correct material count in the prompt', () => {
    const mats = [makeMaterial({ id: 'a' }), makeMaterial({ id: 'b' }), makeMaterial({ id: 'c' })];
    const prompt = buildSystemPrompt(mats, BASE_SETTINGS);
    expect(prompt).toContain('3 files');
  });

  it('includes author and year metadata', () => {
    const mat = makeMaterial();
    const prompt = buildSystemPrompt([mat], BASE_SETTINGS);
    expect(prompt).toContain('Smith, J.');
    expect(prompt).toContain('2023');
  });

  it('includes material content (truncated if needed)', () => {
    const mat = makeMaterial({ content: 'Unique sentinel content XYZ-42' });
    const prompt = buildSystemPrompt([mat], BASE_SETTINGS);
    expect(prompt).toContain('Unique sentinel content XYZ-42');
  });

  it('handles empty materials list gracefully', () => {
    const prompt = buildSystemPrompt([], BASE_SETTINGS);
    expect(prompt).toContain('No materials uploaded');
  });

  it('includes citation format instructions', () => {
    const prompt = buildSystemPrompt([], BASE_SETTINGS);
    expect(prompt).toContain('[REF:n]');
    expect(prompt).toContain('SOURCES USED');
  });
});