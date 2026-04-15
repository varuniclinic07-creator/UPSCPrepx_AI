import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ═══════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];
const publicRoutes = ['/', '/privacy', '/terms', '/contact', '/pricing', '/api/health'];

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS (inlined — no external imports for Edge safety)
// ═══════════════════════════════════════════════════════════════

function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return response;
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE SESSION (inlined — avoid import chain issues)
// ═══════════════════════════════════════════════════════════════

async function refreshSession(request: NextRequest) {
    let response = NextResponse.next({ request: { headers: request.headers } });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        return { response, user: null };
    }

    try {
        const supabase = createServerClient(supabaseUrl, anonKey, {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        });

        const { data: { user } } = await supabase.auth.getUser();
        return { response, user };
    } catch {
        return { response, user: null };
    }
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE (Edge-compatible — fully self-contained)
// ═══════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
    try {
        const { pathname } = request.nextUrl;

        // Skip static assets
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/static') ||
            /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
        ) {
            return NextResponse.next();
        }

        // Health check — fast path
        if (pathname === '/api/health') {
            return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
        }

        // CORS preflight
        if (request.method === 'OPTIONS') {
            const res = new NextResponse(null, { status: 204 });
            const origin = request.headers.get('origin');
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            res.headers.set('Access-Control-Allow-Origin', origin === appUrl ? origin : appUrl);
            res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.headers.set('Access-Control-Allow-Credentials', 'true');
            res.headers.set('Access-Control-Max-Age', '86400');
            return res;
        }

        // Create response with security headers
        let response = NextResponse.next({ request: { headers: request.headers } });
        response = addSecurityHeaders(response);

        // Public routes — return immediately
        if (publicRoutes.includes(pathname)) {
            return response;
        }

        // Auth callbacks — pass through
        if (pathname.startsWith('/auth/callback')) {
            return response;
        }

        // API routes handle their own auth
        if (pathname.startsWith('/api/')) {
            return response;
        }

        // Protected pages — refresh session
        const { response: sessionResponse, user } = await refreshSession(request);
        response = addSecurityHeaders(sessionResponse);

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

        // Admin role check
        if (isAdminRoute && user) {
            const role = (user as any).user_metadata?.role || (user as any).app_metadata?.role;
            if (role !== 'admin' && role !== 'super_admin') {
                return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
            }
        }

        return response;
    } catch (error) {
        // Never let middleware crash kill the entire request
        console.error('[Middleware] Unhandled error:', error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
