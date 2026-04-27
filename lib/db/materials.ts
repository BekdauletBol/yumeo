import { supabase } from './supabase';
import type { Material, MaterialSection, CreateMaterialInput, UpdateMaterialInput } from '@/lib/types';

/**
 * Fetch all materials for a project, optionally filtered by section.
 */
export async function getMaterials(
  projectId: string,
  section?: MaterialSection,
): Promise<Material[]> {
  let query = supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (section) query = query.eq('section', section);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch materials: ${error.message}`);
  return (data ?? []).map(rowToMaterial);
}

/**
 * Fetch a single material by ID.
 */
export async function getMaterial(id: string): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Material not found: ${error.message}`);
  return rowToMaterial(data);
}

/**
 * Create a material record after uploading the file to Supabase Storage.
 */
export async function createMaterial(input: CreateMaterialInput): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      project_id: input.projectId,
      section: input.section,
      name: input.name,
      content: input.content,
      storage_url: input.storageUrl ?? null,
      metadata: input.metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create material: ${error.message}`);
  return rowToMaterial(data);
}

/**
 * Update material content or metadata (e.g. after re-extraction).
 */
export async function updateMaterial(
  id: string,
  input: UpdateMaterialInput,
): Promise<Material> {
  const { data, error } = await supabase
    .from('materials')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update material: ${error.message}`);
  return rowToMaterial(data);
}

/**
 * Delete a material and its stored file (if any).
 */
export async function deleteMaterial(id: string): Promise<void> {
  // Fetch storage_url first so we can clean up storage
  const { data } = await supabase
    .from('materials')
    .select('storage_url')
    .eq('id', id)
    .single();

  if (data?.storage_url) {
    const path = storagePathFromUrl(data.storage_url as string);
    if (path) {
      await supabase.storage.from('materials').remove([path]);
    }
  }

  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete material: ${error.message}`);
}

/**
 * Upload a raw file to Supabase Storage and return the public URL.
 * Path format: {projectId}/{materialId}/{filename}
 */
export async function uploadMaterialFile(
  projectId: string,
  materialId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${projectId}/${materialId}/original.${ext}`;

  const { error } = await supabase.storage
    .from('materials')
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);

  const { data } = supabase.storage.from('materials').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Private helpers ────────────────────────────────────────────────────────

function rowToMaterial(row: Record<string, unknown>): Material {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    section: row['section'] as MaterialSection,
    name: row['name'] as string,
    content: row['content'] as string,
    storageUrl: (row['storage_url'] as string | null) ?? undefined,
    metadata: row['metadata'] as Material['metadata'],
    createdAt: new Date(row['created_at'] as string),
  };
}

function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Supabase storage URLs: /storage/v1/object/public/{bucket}/{path}
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/materials\/(.+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}