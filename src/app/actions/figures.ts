'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import type { Figure } from '@/lib/types';
import { nanoid } from 'nanoid';

export async function createFigureAction(input: {
  projectId: string;
  materialId?: string;
  imageBase64: string; // The extracted image base64 data url
  pageNumber?: number;
  caption: string;
}): Promise<Figure> {
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

  // Upload image to Storage using {userId}/{filename} path structure for RLS
  const base64Data = input.imageBase64.split(',')[1] || input.imageBase64;
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `${userId}/${nanoid()}.jpg`;
  
  const { error: uploadErr } = await supabase
    .storage
    .from('project-figures')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true
    });
    
  if (uploadErr) throw new Error(`Failed to upload figure: ${uploadErr.message}`);

  const { data: publicUrlData } = supabase
    .storage
    .from('project-figures')
    .getPublicUrl(filename);
    
  // Get max order index
  const { data: existingFigures } = await supabase
    .from('figures')
    .select('order_index')
    .eq('project_id', input.projectId)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrder = existingFigures && existingFigures.length > 0 ? (existingFigures[0]?.order_index ?? 0) + 1 : 1;

  // Save metadata to figures table
  const { data, error } = await supabase
    .from('figures')
    .insert({
      project_id: input.projectId,
      material_id: input.materialId,
      url: publicUrlData.publicUrl,
      page_number: input.pageNumber,
      caption: input.caption,
      order_index: nextOrder
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to save figure metadata');
  }

  return {
    id: data.id,
    projectId: data.project_id,
    materialId: data.material_id,
    url: data.url,
    pageNumber: data.page_number,
    caption: data.caption,
    orderIndex: data.order_index,
    createdAt: new Date(data.created_at)
  };
}

export async function getFiguresAction(projectId: string): Promise<Figure[]> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('figures')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) throw new Error(error.message);

  return data.map(row => ({
    id: row.id,
    projectId: row.project_id,
    materialId: row.material_id,
    url: row.url,
    pageNumber: row.page_number,
    caption: row.caption,
    orderIndex: row.order_index,
    createdAt: new Date(row.created_at)
  }));
}

export async function updateFigureAction(id: string, updates: Partial<Figure>) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const dbUpdates: any = {};
  if (updates.caption !== undefined) dbUpdates.caption = updates.caption;
  if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

  const supabase = createServiceClient();
  const { error } = await supabase.from('figures').update(dbUpdates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateFigureOrderAction(projectId: string, updates: { id: string, orderIndex: number }[]) {
  const supabase = createServiceClient();
  for (const update of updates) {
    await supabase.from('figures').update({ order_index: update.orderIndex }).eq('id', update.id).eq('project_id', projectId);
  }
}

export async function deleteFigureAction(id: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { error } = await supabase.from('figures').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
