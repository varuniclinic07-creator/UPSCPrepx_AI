import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Create Supabase client for browser/client components
 * Uses environment variables for configuration
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get singleton Supabase client for client-side use
 * Prevents multiple client instances
 */
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side');
  }
  
  if (!clientInstance) {
    clientInstance = createClient();
  }
  
  return clientInstance;
}

// Alias for convenience - matches common naming convention
export const createBrowserSupabaseClient = createClient;