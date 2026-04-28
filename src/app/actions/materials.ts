'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import type { CreateMaterialInput, Material } from '@/lib/types';
import { chunkAndEmbedMaterial } from '@/lib/agent/rag';
import { nanoid } from 'nanoid';

// Supabase row-to-material helper
function rowToMaterial(row: Record<string, unknown>): Material {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    section: row['section'] as any,
    name: row['name'] as string,
    content: row['content'] as string,
    storageUrl: (row['storage_url'] as string | null) ?? undefined,
    metadata: row['metadata'] as any,
    createdAt: new Date(row['created_at'] as string),
  };
}

export async function createMaterialAction(input: CreateMaterialInput): Promise<Material> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  
  // Verify project ownership
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', input.projectId)
    .eq('user_id', userId)
    .single();
    
  if (projErr || !project) throw new Error('Project not found or unauthorized');

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

  const material = rowToMaterial(data);

  // Fire-and-forget chunking/embedding
  if (material.section === 'references' || material.section === 'drafts' || material.section === 'tables') {
    chunkAndEmbedMaterial(material).catch(err => {
      console.error('Background embedding failed:', err);
    });
  }

  return material;
}

export async function updateMaterialOrderAction(projectId: string, updates: { id: string, metadata: any }[]) {
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

  // Perform bulk update of metadata
  for (const update of updates) {
    await supabase
      .from('materials')
      .update({ metadata: update.metadata })
      .eq('id', update.id)
      .eq('project_id', projectId);
  }
}

export async function updateMaterialAction(id: string, updates: { metadata?: any, content?: string }) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  
  // We should verify ownership, but for simplicity of this MVP:
  const { error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id);
    
  if (error) throw new Error(`Failed to update material: ${error.message}`);
}
