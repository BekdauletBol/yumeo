import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a lazy-initialized browser-safe Supabase client.
 *
 * The client is created on first call — never at module import time.
 * This prevents Vercel build failures when env vars are absent during
 * the "Collecting page data" phase of next build.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('ENV CHECK (Client):', { url: !!url, key: !!key });
    return null;
  }
  _client = createClient(url, key);
  return _client;
}

/**
 * Compatibility alias — existing code that calls supabase.from() etc.
 * will call getSupabaseClient() at runtime via this getter.
 *
 * Usage: `import { supabase } from '@/lib/db/supabase'`
 * then:  `supabase.from('...')`  — works as before, lazy under the hood.
 */
export const supabase: SupabaseClient = new Proxy(
  // placeholder object — never accessed directly
  {} as SupabaseClient,
  {
    get(_t, prop: string | symbol) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client not initialized. Check your environment variables.');
      }
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  },
);

/**
 * Server-side Supabase client with service role key (bypasses RLS).
 * Only use in API routes and server actions — never in the browser.
 * 
 * Throws an error if environment variables are missing to ensure
 * TypeScript safety and immediate failure in misconfigured environments.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    const errorMsg = 'Missing Supabase service configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.';
    console.error('ENV CHECK (Service):', { 
      url: !!url, 
      serviceKey: !!serviceKey,
      location: typeof window === 'undefined' ? 'Server' : 'Browser'
    });
    throw new Error(errorMsg);
  }
  return createClient(url, serviceKey);
}