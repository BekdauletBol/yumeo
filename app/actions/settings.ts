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
