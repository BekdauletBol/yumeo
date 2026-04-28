import { supabase } from './supabase';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/lib/types';

/** Default settings for new projects */
const DEFAULT_SETTINGS: Project['settings'] = {
  agentModel: 'openai/gpt-4o',
  strictGrounding: true,
  language: 'en',
  exportFormat: 'markdown',
};

/**
 * Fetch all projects for the authenticated user.
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return (data ?? []).map(rowToProject);
}

/**
 * Fetch a single project by ID.
 * Throws if the project does not exist or does not belong to the user.
 */
export async function getProject(id: string, userId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(`Project not found: ${error.message}`);
  return rowToProject(data);
}

/**
 * Create a new project for the authenticated user.
 */
export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      settings: input.settings ?? DEFAULT_SETTINGS,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return rowToProject(data);
}

/**
 * Update project fields. Only the owner can update.
 */
export async function updateProject(
  id: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.settings !== undefined && { settings: input.settings }),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return rowToProject(data);
}

/**
 * Delete a project and all its materials (cascade).
 */
export async function deleteProject(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

// ─── Private helpers ────────────────────────────────────────────────────────

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    name: row['name'] as string,
    description: (row['description'] as string | null) ?? undefined,
    settings: row['settings'] as Project['settings'],
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}