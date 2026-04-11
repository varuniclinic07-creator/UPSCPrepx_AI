import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { applySecurityHeaders, handleCorsPreflight, isAllowedOrigin, validateRequestSecurity } from '@/lib/security/headers';
import { checkRateLimit, RateLimitPresets, getRateLimitHeaders } from '@/lib/rate-limit/redis-rate-limiter';
import { logger, logRequest, logError } from '@/lib/logging/logger';

// ═══════════════════════════════════════════════════════════════
// ROUTE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Routes that require authentication
const protectedRoutes = ['/dashboard'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];

// Public routes that don't need auth
const publicRoutes = ['/', '/privacy', '/terms', '/contact', '/pricing', '/api/health'];

// API routes with specific rate limits
const apiRateLimits: Record<string, typeof RateLimitPresets.api> = {
    '/api/auth': RateLimitPresets.auth,
    '/api/payments': RateLimitPresets.payment,
    '/api/webhooks': RateLimitPresets.webhook,
    '/api/admin': RateLimitPresets.admin,
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the canonical app URL for redirects
 */
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

/**
 * Generate request ID for tracing
 */
function generateRequestId(): string {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
    const startTime = Date.now();
    const { pathname } = request.nextUrl;

    // Generate request ID for tracing
    const requestId = generateRequestId();

    // Add request ID to headers for logging
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    // ═══════════════════════════════════════════════════════════
    // SKIP LIST
    // ═══════════════════════════════════════════════════════════

    // Skip static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
    ) {
        return NextResponse.next();
    }

    // Skip health checks
    if (pathname === '/api/health') {
        return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // ═══════════════════════════════════════════════════════════
    // CORS HANDLING
    // ═══════════════════════════════════════════════════════════

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        const origin = request.headers.get('origin');
        const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'].filter(Boolean);

        if (origin && isAllowedOrigin(origin, allowedOrigins)) {
            return handleCorsPreflight(request);
        }

        return NextResponse.next();
    }

    // ═══════════════════════════════════════════════════════════
    // SECURITY HEADERS
    // ═══════════════════════════════════════════════════════════

    let response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Apply security headers to all responses
    response = applySecurityHeaders(response);

    // ═══════════════════════════════════════════════════════════
    // RATE LIMITING
    // ═══════════════════════════════════════════════════════════

    // Apply rate limiting to API routes
    if (pathname.startsWith('/api')) {
        const identifier = `ip:${request.ip || request.headers.get('x-forwarded-for') || 'unknown'}`;

        // Find matching rate limit config
        let rateLimitConfig = RateLimitPresets.api;
        for (const [prefix, config] of Object.entries(apiRateLimits)) {
            if (pathname.startsWith(prefix)) {
                rateLimitConfig = config;
                break;
            }
        }

        try {
            const rateLimitResult = await checkRateLimit(identifier, rateLimitConfig);

            // Add rate limit headers
            const headers = getRateLimitHeaders(rateLimitResult);
            for (const [key, value] of Object.entries(headers)) {
                response.headers.set(key, value);
            }

            if (!rateLimitResult.allowed) {
                logger.warn('Rate limit exceeded', {
                    requestId,
                    identifier,
                    route: pathname,
                    retryAfter: rateLimitResult.retryAfter,
                });

                return NextResponse.json(
                    {
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: 'Too many requests. Please try again later.',
                            retryAfter: rateLimitResult.retryAfter,
                        },
                    },
                    {
                        status: 429,
                        headers,
                    }
                );
            }
        } catch (error) {
            // If rate limiting fails, log but don't block the request
            logger.error('Rate limiting error', { requestId, route: pathname }, error as Error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // REQUEST VALIDATION
    // ═══════════════════════════════════════════════════════════

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

    // Skip auth for public routes and most API routes
    if (publicRoutes.includes(pathname)) {
        logRequest(request, requestId);
        return response;
    }

    if (pathname.startsWith('/auth/callback')) {
        return response;
    }

    // API routes handle their own auth via requireSession
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/user')) {
        logRequest(request, requestId);
        return response;
    }

    // Update Supabase session
    const { response: sessionResponse, user } = await updateSession(request);
    response = sessionResponse;

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
        try {
            const supabase = await createServerSupabaseClient();
            const { data: userData } = await (supabase
                .from('users') as any)
                .select('role')
                .eq('id', user.id)
                .single();

            if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
                logger.warn('Unauthorized admin access attempt', {
                    requestId,
                    userId: user.id,
                    route: pathname,
                });

                return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
            }
        } catch (error) {
            logError(error as Error, {
                requestId,
                route: pathname,
                userId: user.id,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // LOGGING
    // ═══════════════════════════════════════════════════════════

    const duration = Date.now() - startTime;
    logger.info('Request completed', {
        requestId,
        method: request.method,
        route: pathname,
        status: response.status,
        duration,
        durationUnit: 'ms',
    });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};