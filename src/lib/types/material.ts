/** Sections in the Yumeo sidebar */
export type MaterialSection =
  | 'references'
  | 'drafts'
  | 'figures'
  | 'tables'
  | 'templates'
  | 'equations'
  | 'diagrams';

/** A single uploaded research material */
export interface Material {
  id: string;
  projectId: string;
  section: MaterialSection;
  name: string;
  /** Extracted plain-text content (from PDF, OCR, etc.) */
  content: string;
  /** Supabase Storage public URL for the raw file */
  storageUrl?: string;
  metadata: MaterialMetadata;
  createdAt: Date;
}

/** File-level metadata attached to a material */
export interface MaterialMetadata {
  fileType: 'pdf' | 'image' | 'text' | 'markdown' | 'bibtex' | 'latex' | 'mermaid';
  fileSize: number;
  pageCount?: number;
  /** Raw page text for server-side chunking (PDF only). */
  pageText?: string[];
  /** e.g. "Fig. 1", "Table 2" */
  figureNumber?: string;
  caption?: string;
  doi?: string;
  authors?: string[];
  year?: number;
  order?: number;
  /** GitHub repo URL for imported materials */
  repoUrl?: string;
}

export type CreateMaterialInput = Omit<Material, 'id' | 'createdAt'>;
export type UpdateMaterialInput = Partial<Pick<Material, 'name' | 'content' | 'metadata'>>;

/** Display label per section */
export const SECTION_LABELS: Record<MaterialSection, string> = {
  references: 'References',
  drafts: 'Drafts',
  figures: 'Figures',
  tables: 'Tables',
  templates: 'Templates',
  equations: 'Equations',
  diagrams: 'Diagrams',
};

/** CSS variable accent color per section */
export const SECTION_ACCENT: Record<MaterialSection, string> = {
  references: 'var(--accent-refs)',
  drafts:     'var(--accent-drafts)',
  figures:    'var(--accent-figures)',
  tables:     'var(--accent-tables)',
  templates:  'var(--accent-template)',
  equations:  'var(--accent-equations)',
  diagrams:   'var(--accent-diagrams)',
};