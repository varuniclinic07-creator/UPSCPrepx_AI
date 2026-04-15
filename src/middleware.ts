import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { applySecurityHeaders, handleCorsPreflight, isAllowedOrigin, validateRequestSecurity } from '@/lib/security/headers';

// ═══════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];
const publicRoutes = ['/', '/privacy', '/terms', '/contact', '/pricing', '/api/health'];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getCanonicalUrl(request: NextRequest): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    const isValidEnvUrl = envUrl &&
        !envUrl.includes('your-production-domain') &&
        !envUrl.includes('yourdomain') &&
        !envUrl.includes('example.com') &&
        envUrl.startsWith('https://');

    if (process.env.NODE_ENV === 'production' && isValidEnvUrl) {
        return envUrl;
    }
    return request.nextUrl.origin;
}

function generateRequestId(): string {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE (Edge-compatible — no ioredis, no pino)
// ═══════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const requestId = generateRequestId();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    // Skip static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
    ) {
        return NextResponse.next();
    }

    // Health check
    if (pathname === '/api/health') {
        return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
        const origin = request.headers.get('origin');
        const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'].filter(Boolean);
        if (origin && isAllowedOrigin(origin, allowedOrigins)) {
            return handleCorsPreflight(request);
        }
        return NextResponse.next();
    }

    // Security headers
    let response = NextResponse.next({
        request: { headers: requestHeaders },
    });
    response = applySecurityHeaders(response);

    // Request validation for API routes
    if (pathname.startsWith('/api')) {
        const validation = validateRequestSecurity(request);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: validation.statusCode || 400 }
            );
        }
    }

    // ═══════════════════════════════════════════════════════════
    // AUTHENTICATION & AUTHORIZATION
    // ═══════════════════════════════════════════════════════════

    if (publicRoutes.includes(pathname)) {
        return response;
    }

    if (pathname.startsWith('/auth/callback')) {
        return response;
    }

    // API routes handle their own auth
    if (pathname.startsWith('/api/')) {
        return response;
    }

    // Update Supabase session
    const { response: sessionResponse, user } = await updateSession(request);
    response = sessionResponse;

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Redirect unauthenticated users
    if ((isProtectedRoute || isAdminRoute) && !user) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin role check — done via user metadata from session (no DB call in Edge)
    if (isAdminRoute && user) {
        const role = user.user_metadata?.role || user.app_metadata?.role;
        if (role !== 'admin' && role !== 'super_admin') {
            return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
        }
    }

    return response;
  } catch (error) {
    // Never let middleware crash kill the entire request — degrade gracefully
    console.error('[Middleware] Unhandled error:', error);
    return NextResponse.next();
  }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
