import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const REMEMBER_ME_KEY = 'upsc_remember_me';

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set at build time.'
    );
  }
  return { supabaseUrl, anonKey };
}

function shouldPersistSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function setRememberMe(value: boolean) {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
  // Reset singleton so next call picks up the new setting
  clientInstance = null;
}

/**
 * Create Supabase client for browser/client components.
 * Session persistence is OFF by default — only enabled when
 * the user explicitly checks "Remember Me" at login.
 */
export function createClient() {
  const { supabaseUrl, anonKey } = getSupabaseEnv();
  const persist = shouldPersistSession();

  return createBrowserClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: persist,
      autoRefreshToken: persist,
    },
  });
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

// Alias for convenience
export const createBrowserSupabaseClient = createClient;