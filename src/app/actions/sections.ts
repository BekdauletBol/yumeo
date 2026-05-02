'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import type { ProjectSection, MaterialSection } from '@/lib/types';

// Helper to convert database row to ProjectSection
function rowToProjectSection(row: Record<string, unknown>): ProjectSection {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    name: row['section_type'] === 'references' ? 'References' :
          row['section_type'] === 'drafts' ? 'Drafts' :
          row['section_type'] === 'figures' ? 'Figures' :
          row['section_type'] === 'tables' ? 'Tables' :
          row['section_type'] === 'templates' ? 'Templates' :
          row['section_type'] === 'equations' ? 'LaTeX Equations' :
          row['section_type'] === 'diagrams' ? 'Mermaid Diagrams' : 'Section',
    sectionType: row['section_type'] as MaterialSection,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get all sections for a project (both active and inactive)
 */
export async function getProjectSectionsAction(projectId: string): Promise<ProjectSection[]> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Verify project ownership
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projErr || !project) throw new Error('Project not found or unauthorized');

  // Get all sections
  const { data, error } = await supabase
    .from('project_sections')
    .select('id, project_id, section_type')
    .eq('project_id', projectId);

  if (error) throw new Error(error.message);
  return (data || []).map(rowToProjectSection);
}

/**
 * Get only active sections for a project
 */
export async function getActiveSectionsAction(projectId: string): Promise<ProjectSection[]> {
  return getProjectSectionsAction(projectId);
}

/**
 * Add a new section to a project
 */
export async function createProjectSectionAction(
  projectId: string,
  sectionType: MaterialSection,
  customName?: string
): Promise<ProjectSection> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Verify project ownership
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projErr || !project) throw new Error('Project not found or unauthorized');

  // Check if section already exists
  const { data: existing, error: checkErr } = await supabase
    .from('project_sections')
    .select('id')
    .eq('project_id', projectId)
    .eq('section_type', sectionType);

  // Silently skip if already exists
  if (existing && existing.length > 0 && existing[0]) {
    return rowToProjectSection({ 
      id: existing[0].id, 
      project_id: projectId, 
      section_type: sectionType 
    });
  }

  // Get default name
  const DEFAULT_NAMES: Record<MaterialSection, string> = {
    references: 'References',
    drafts: 'Drafts',
    figures: 'Figures',
    tables: 'Tables',
    templates: 'Templates',
    equations: 'LaTeX Equations',
    diagrams: 'Mermaid Diagrams',
  };

  const name = customName || DEFAULT_NAMES[sectionType];

  // Create section
  const { data, error } = await supabase
    .from('project_sections')
    .insert({
      project_id: projectId,
      section_type: sectionType,
    })
    .select('id, project_id, section_type')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create section');

  return rowToProjectSection(data);
}

/**
 * Remove a section and its materials
 */
export async function deleteProjectSectionAction(sectionId: string): Promise<void> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Verify ownership through project
  const { data: section, error: secErr } = await supabase
    .from('project_sections')
    .select('project_id')
    .eq('id', sectionId)
    .single();

  if (secErr || !section) throw new Error('Section not found');

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', section.project_id)
    .eq('user_id', userId)
    .single();

  if (projErr || !project) throw new Error('Project not found or unauthorized');

  // Delete section (cascade will remove materials)
  const { error: delErr } = await supabase
    .from('project_sections')
    .delete()
    .eq('id', sectionId);

  if (delErr) throw new Error(delErr.message);
}

/**
 * Toggle section active/inactive state
 */
export async function toggleProjectSectionAction(sectionId: string): Promise<ProjectSection> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Get section
  const { data: section, error: getErr } = await supabase
    .from('project_sections')
    .select('id, project_id, section_type')
    .eq('id', sectionId)
    .single();

  if (getErr || !section) throw new Error('Section not found');

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', section.project_id)
    .eq('user_id', userId)
    .single();

  if (!project) throw new Error('Project not found or unauthorized');

  return rowToProjectSection(section);
}

/**
 * Reorder sections (stub - feature not available with current schema)
 */
export async function reorderSectionsAction(
  projectId: string,
  sectionOrders: Array<{ id: string; displayOrder: number }>
): Promise<ProjectSection[]> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project) throw new Error('Project not found or unauthorized');

  // Return sections in current order
  return getProjectSectionsAction(projectId);
}
