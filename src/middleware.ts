import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/notes', '/quiz', '/video', '/profile', '/current-affairs'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];

/**
 * Get the canonical app URL for redirects
 * Ensures production uses the correct domain
 */
function getCanonicalUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Validate that envUrl is a real domain, not a placeholder
  const isValidEnvUrl = envUrl &&
    !envUrl.includes('your-production-domain') &&
    !envUrl.includes('yourdomain') &&
    !envUrl.includes('example.com') &&
    envUrl.startsWith('https://');

  // In production, use the configured URL only if it's valid
  if (process.env.NODE_ENV === 'production' && isValidEnvUrl) {
    return envUrl;
  }

  // Fallback to the request URL (handles missing/invalid env vars)
  return request.nextUrl.origin;
}

/**
 * Validate redirect URL to prevent open redirect attacks
 */
function isValidRedirect(url: string, canonicalUrl: string): boolean {
  try {
    const targetUrl = new URL(url, canonicalUrl);
    const appUrl = new URL(canonicalUrl);
    return targetUrl.host === appUrl.host;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for public routes that don't need auth checks
  const publicRoutes = ['/', '/privacy', '/terms', '/contact', '/api/health'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware for auth callback - it handles its own redirects
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // Skip middleware for static assets and API routes that handle their own auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/user')) {
    return NextResponse.next();
  }

  // Update Supabase session
  const { response, user } = await updateSession(request);

  // Check route type
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes
  if ((isProtectedRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // CRITICAL: Admin role verification
  if (isAdminRoute && user) {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/health (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health).*)',
  ],
};