/** Sections in the Yumeo sidebar */
export type MaterialSection =
  | 'references'
  | 'drafts'
  | 'figures'
  | 'tables'
  | 'templates'
  | 'equations'
  | 'diagrams';

export interface Material {
  id: string;
  projectId: string;
  section: MaterialSection;
  sectionId?: string;  // Reference to project_sections.id
  name: string;
  /** Raw markdown/text content extracted from the file */
  content: string;
  /** URL to the original file in Supabase storage */
  storageUrl?: string;
  /** Status of the background processing task */
  status?: 'uploading' | 'processing' | 'ready' | 'error';
  metadata: MaterialMetadata;
  createdAt: Date;
}

export interface Figure {
  id: string;
  projectId: string;
  materialId?: string;
  url: string;
  pageNumber?: number;
  caption: string;
  orderIndex: number;
  createdAt: Date;
}

/** A project section (dynamically created by user) */
export interface ProjectSection {
  id: string;
  projectId: string;
  name: string;  // User-friendly name (e.g., "My References")
  sectionType: MaterialSection;  // Type enum
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** File-level metadata attached to a material */
export interface MaterialMetadata {
  fileType: 'pdf' | 'image' | 'text' | 'markdown' | 'bibtex' | 'latex' | 'mermaid' | 'docx';
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
  /** If true, this material is used as the style/structure template for generation */
  isTemplate?: boolean;
}

export type CreateMaterialInput = Omit<Material, 'id' | 'createdAt'>;
export type UpdateMaterialInput = Partial<Pick<Material, 'name' | 'content' | 'metadata' | 'storageUrl' | 'status'>>;

// Allow sectionId to be passed in create input
export interface CreateMaterialWithSectionInput extends CreateMaterialInput {
  sectionId?: string;
}

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