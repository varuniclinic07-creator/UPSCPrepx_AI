import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Resolve a browser-safe origin for redirects.
 * Prefer NEXT_PUBLIC_APP_URL / NEXTAUTH_URL in production; in dev rewrite
 * 0.0.0.0 (invalid client address) to localhost.
 */
function resolveRedirectOrigin(requestOrigin: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (envUrl && !/placeholder|your-production-domain|yourdomain|example\.com/i.test(envUrl)) {
    try {
      return new URL(envUrl).origin;
    } catch {
      // fall through
    }
  }
  try {
    const u = new URL(requestOrigin);
    if (u.hostname === '0.0.0.0' || u.hostname === '::' || u.hostname === '[::]') {
      u.hostname = 'localhost';
    }
    return u.origin;
  } catch {
    return requestOrigin;
  }
}

/**
 * GET /auth/callback
 * Handle OAuth callback from Supabase Auth
 * This route is called after user signs in with OAuth provider
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const origin = resolveRedirectOrigin(requestUrl.origin);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    const errorUrl = new URL('/login', origin);
    errorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createClient();

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Code exchange error:', exchangeError);
        const errorUrl = new URL('/login', origin);
        errorUrl.searchParams.set('error', 'Failed to complete sign in. Please try again.');
        return NextResponse.redirect(errorUrl);
      }

      // Check if user profile exists, create if not
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Create user profile
          const { error: profileError } = await (supabase.from('users') as any)
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
              avatar_url: data.user.user_metadata?.avatar_url || null,
              role: 'user',
              subscription_tier: 'trial',
              subscription_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              preferences: {},
            });

          if (profileError) {
            console.error('[Auth Callback] Profile creation error:', profileError);
            // Continue anyway - profile can be created later
          }
        }
      }

      // Redirect to intended destination
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err);
      const errorUrl = new URL('/login', origin);
      errorUrl.searchParams.set('error', 'An unexpected error occurred. Please try again.');
      return NextResponse.redirect(errorUrl);
    }
  }

  // No code provided - redirect to login
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'Invalid callback. Please try signing in again.');
  return NextResponse.redirect(loginUrl);
}