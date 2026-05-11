'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';

export async function saveClaudeKeyAction(apiKey: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  
  // In a real app, encrypt the API key before storing.
  // We use upsert to insert or update the user's settings.
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      encrypted_claude_key: apiKey,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to save API key: ${error.message}`);
  }
}

import crypto from 'crypto';

export async function hasClaudeKeyAction() {
  const { userId } = auth();
  if (!userId) return false;

  const supabase = createServiceClient();
  
  const { data } = await supabase
    .from('user_settings')
    .select('encrypted_claude_key')
    .eq('user_id', userId)
    .single();

  return !!data?.encrypted_claude_key;
}

export async function generateApiKeyAction(projectId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  
  // verify user owns project
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).single();
  if (project?.user_id !== userId) throw new Error('Unauthorized project access');

  const clearKey = `sk_yumeo_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(clearKey).digest('hex');

  const { error } = await supabase.from('api_keys').insert({
    project_id: projectId,
    key_hash: keyHash,
  });

  if (error) throw new Error(error.message);

  return clearKey;
}

export async function getApiKeysAction(projectId: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('api_keys').select('id, created_at, key_hash').eq('project_id', projectId);
  if (error) throw new Error(error.message);
  
  return data;
}

export async function deleteApiKeyAction(id: string) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createServiceClient();
  const { error } = await supabase.from('api_keys').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
