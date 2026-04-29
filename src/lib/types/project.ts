/** Yumeo project entity */
export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    settings: ProjectSettings;
  }
  
  /** Per-project AI and export configuration */
  export interface ProjectSettings {
    agentModel: 'gpt-4o' | 'gpt-4-turbo' | 'o1-preview' | 'claude-3-5-sonnet-latest' | 'claude-3-5-haiku-latest' | 'claude-3-opus-latest';
    /** When true, AI only uses uploaded materials — never external knowledge */
    strictGrounding: boolean;
    language: string;
    exportFormat: 'markdown' | 'docx' | 'latex';
  }
  
  /** Partial used when creating a new project */
  export type CreateProjectInput = Pick<Project, 'name'> &
    Partial<Pick<Project, 'description' | 'settings'>>;
  
  /** Partial used when updating a project */
  export type UpdateProjectInput = Partial<
    Pick<Project, 'name' | 'description' | 'settings'>
  >;