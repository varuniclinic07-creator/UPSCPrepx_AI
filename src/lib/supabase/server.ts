import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE SERVER CLIENT - Robust Error Handling
// Following backend-architect.md: "Explicit Error Handling - Fail fast with descriptive errors"
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create Supabase client for server components and API routes
 * Handles cookie management for auth session with robust error handling
 */
export async function createServerSupabaseClient() {
  // Validate environment variables first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL is not configured');
    throw new Error('Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }

  if (!anonKey) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    throw new Error('Supabase Anon Key not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
  }

  try {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value;
            } catch (error) {
              console.warn(`[Supabase] Error getting cookie ${name}:`, error);
              return undefined;
            }
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Handle cookie errors in Server Components
              // This can happen when streaming responses
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // Handle cookie errors in Server Components
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('[Supabase] Failed to create server client:', error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create admin Supabase client with service role key
 * ONLY use for admin operations - bypasses RLS
 */
export async function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  if (!serviceRoleKey) {
    throw new Error('Supabase Service Role Key not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        get() { return undefined; },
        set() { },
        remove() { },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Alias for convenience - matches common naming convention
export const createClient = createServerSupabaseClient;