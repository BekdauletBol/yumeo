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
    agentModel: 'openai/gpt-4o' | 'openai/gpt-4o-mini' | 'openai/gpt-5' | 'claude-opus-4-5' | 'claude-sonnet-4-5';
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