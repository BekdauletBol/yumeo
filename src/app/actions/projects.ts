'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import type { ProjectSettings } from '@/lib/types';

export async function updateProjectAction(id: string, updates: { settings?: ProjectSettings, name?: string, description?: string }) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  
  // Verify ownership
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
    
  if (projErr || !project) throw new Error('Project not found or unauthorized');

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);
    
  if (error) throw new Error(`Failed to update project: ${error.message}`);
}
