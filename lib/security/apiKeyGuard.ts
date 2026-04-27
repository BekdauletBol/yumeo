/**
 * Guard that ensures the Anthropic API key is never exposed to the browser.
 * Call this at the top of every server-side function that uses the key.
 *
 * @throws Error if called in a browser environment.
 */
export function assertServerSide(): void {
    if (typeof window !== 'undefined') {
      throw new Error(
        'SECURITY: Attempted to access Anthropic API key in a browser context. ' +
          'All AI calls must go through /api routes.',
      );
    }
  }
  
  import { createServiceClient } from '@/lib/db/supabase';

  /**
   * Retrieve the Anthropic API key from user settings or environment variables.
   * Must only be called on the server.
   */
  export async function getAnthropicKey(userId?: string): Promise<string> {
    assertServerSide();
    
    if (userId) {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('user_settings')
        .select('encrypted_claude_key')
        .eq('user_id', userId)
        .single();
        
      if (data?.encrypted_claude_key) {
        // In a real app, you would decrypt this key.
        return data.encrypted_claude_key;
      }
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local');
    }
    return key;
  }