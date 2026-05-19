import { supabase, createServiceClient } from './supabase';
import type { Material, MaterialSection, CreateMaterialInput, UpdateMaterialInput } from '@/lib/types';

/**
 * Fetch all materials for a project, optionally filtered by section.
 */
export async function getMaterials(
  projectId: string,
  section?: MaterialSection,
): Promise<Material[]> {
  const serviceClient = createServiceClient();
  let query = serviceClient
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
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
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
  const serviceClient = createServiceClient();
  const needsProcessing = input.section === 'references' || input.section === 'drafts' || input.section === 'tables';
  const initialStatus = input.status ?? (needsProcessing ? 'processing' : 'ready');

  const { data, error } = await supabase
    .from('materials')
    .insert({
      project_id: input.projectId,
      section: input.section,
      name: input.name,
      content: input.content,
      storage_url: input.storageUrl ?? null,
      metadata: input.metadata,
      status: initialStatus,
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
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('materials')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      ...(input.storageUrl !== undefined && { storage_url: input.storageUrl }),
      ...(input.status !== undefined && { status: input.status }),
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(`Failed to update material: ${error.message}`);
  if (!data || data.length === 0) throw new Error('Material not found for update');
  
  return rowToMaterial(data[0]);
}

/**
 * Delete a material and its stored file (if any).
 */
export async function deleteMaterial(id: string): Promise<void> {
  const serviceClient = createServiceClient();
  // Fetch storage_url first so we can clean up storage
  const { data } = await serviceClient
    .from('materials')
    .select('storage_url')
    .eq('id', id)
    .single();

  if (data?.storage_url) {
    const path = storagePathFromUrl(data.storage_url as string);
    if (path) {
      await serviceClient.storage.from('materials').remove([path]);
    }
  }

  const { error } = await serviceClient.from('materials').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete material: ${error.message}`);
}

/**
 * Upload a raw file to Supabase Storage and return the public URL.
 * Path format: {userId}/{projectId}/{materialId}/original.{ext}
 * This format complies with the RLS policy: auth.uid()::text = (storage.foldername(name))[1]
 */
export async function uploadMaterialFile(
  userId: string,
  projectId: string,
  materialId: string,
  file: File | Buffer,
  fileName: string,
): Promise<string> {
  const serviceClient = createServiceClient();
  const ext = fileName.split('.').pop() ?? 'bin';
  const path = `${userId}/${projectId}/${materialId}/original.${ext}`;

  const { error } = await serviceClient.storage
    .from('materials')
    .upload(path, file, { 
      upsert: true,
      contentType: getContentType(ext)
    });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);

  const { data } = serviceClient.storage.from('materials').getPublicUrl(path);
  return data.publicUrl;
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

// ─── Private helpers ────────────────────────────────────────────────────────

function rowToMaterial(row: Record<string, unknown>): Material {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    section: row['section'] as MaterialSection,
    sectionId: (row['section_id'] as string | null) ?? undefined,
    name: row['name'] as string,
    content: row['content'] as string,
    storageUrl: (row['storage_url'] as string | null) ?? undefined,
    status: (row['status'] as Material['status']) ?? 'ready',
    metadata: row['metadata'] as Material['metadata'],
    createdAt: new Date(row['created_at'] as string),
  };
}

function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // Supabase storage URLs: /storage/v1/object/public/{bucket}/{path}
    // Expected path structure: userId/projectId/materialId/original.ext
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/materials\/(.+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}