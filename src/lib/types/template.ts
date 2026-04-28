/** A researcher-defined template with {{ placeholder }} syntax */
export interface Template {
    id: string;
    projectId: string;
    name: string;
    /** Raw template string containing {{ section_name }} placeholders */
    body: string;
    /** Generated output after AI fills the template */
    generatedContent?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /** Known placeholder names the AI knows how to fill */
  export type TemplatePlaceholder =
    | 'abstract'
    | 'introduction'
    | 'related_work'
    | 'methodology'
    | 'results'
    | 'discussion'
    | 'conclusion'
    | 'references';
  
  /** Extracted placeholder from a template body */
  export interface ParsedPlaceholder {
    name: string;
    raw: string; // e.g. "{{ abstract }}"
    start: number;
    end: number;
  }
  
  /** Result of a template generation request */
  export interface GenerationResult {
    templateId: string;
    content: string;
    citationsUsed: string[];
    generatedAt: Date;
  }