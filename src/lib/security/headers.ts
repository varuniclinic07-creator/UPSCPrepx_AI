// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS AND PROTECTION
// OWASP security headers and middleware
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════

export interface SecurityHeadersOptions {
    contentSecurityPolicy?: boolean;
    strictTransportSecurity?: boolean;
    xContentTypeOptions?: boolean;
    xFrameOptions?: boolean;
    xXssProtection?: boolean;
    referrerPolicy?: boolean;
    permissionsPolicy?: boolean;
    cacheControl?: boolean;
}

const DEFAULT_OPTIONS: SecurityHeadersOptions = {
    contentSecurityPolicy: true,
    strictTransportSecurity: true,
    xContentTypeOptions: true,
    xFrameOptions: true,
    xXssProtection: true,
    referrerPolicy: true,
    permissionsPolicy: true,
    cacheControl: false,
};

/**
 * Get security headers
 */
export function getSecurityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (opts.contentSecurityPolicy) {
        headers['Content-Security-Policy'] = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://*.supabase.co https://*.razorpay.com",
            "frame-src 'self' https://checkout.razorpay.com",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ');
    }

    // Strict Transport Security (HSTS)
    if (opts.strictTransportSecurity) {
        headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // X-Content-Type-Options
    if (opts.xContentTypeOptions) {
        headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-Frame-Options
    if (opts.xFrameOptions) {
        headers['X-Frame-Options'] = 'DENY';
    }

    // X-XSS-Protection (legacy but still useful)
    if (opts.xXssProtection) {
        headers['X-XSS-Protection'] = '1; mode=block';
    }

    // Referrer-Policy
    if (opts.referrerPolicy) {
        headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    }

    // Permissions-Policy
    if (opts.permissionsPolicy) {
        headers['Permissions-Policy'] = [
            'accelerometer=()',
            'ambient-light-sensor=()',
            'autoplay=()',
            'battery=()',
            'camera=()',
            'cross-origin-isolated=()',
            'display-capture=()',
            'document-domain=()',
            'encrypted-media=()',
            'execution-while-not-rendered=()',
            'execution-while-out-of-viewport=()',
            'fullscreen=()',
            'geolocation=()',
            'gyroscope=()',
            'keyboard-map=()',
            'magnetometer=()',
            'microphone=()',
            'midi=()',
            'navigation-override=()',
            'payment=()',
            'picture-in-picture=()',
            'publickey-credentials-get=()',
            'screen-wake-lock=()',
            'sync-xhr=()',
            'usb=()',
            'web-share=()',
            'xr-spatial-tracking=()',
        ].join(', ');
    }

    // Cache-Control (for sensitive pages)
    if (opts.cacheControl) {
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
    }

    return headers;
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
    response: NextResponse,
    options?: SecurityHeadersOptions
): NextResponse {
    const headers = getSecurityHeaders(options);

    for (const [header, value] of Object.entries(headers)) {
        response.headers.set(header, value);
    }

    return response;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
}

// ═══════════════════════════════════════════════════════════════
// CORS PROTECTION
// ═══════════════════════════════════════════════════════════════

export interface CorsOptions {
    allowedOrigins: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
    allowedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ].filter(Boolean),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
};

/**
 * Validate origin against allowed origins
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
    if (!origin) return false;

    return allowedOrigins.some((allowed) => {
        // Exact match
        if (origin === allowed) return true;

        // Wildcard subdomain matching
        if (allowed.startsWith('*')) {
            const suffix = allowed.slice(1);
            return origin.endsWith(suffix);
        }

        return false;
    });
}

/**
 * Get CORS headers
 */
export function getCorsHeaders(options: CorsOptions = DEFAULT_CORS_OPTIONS): Record<string, string> {
    const {
        allowedOrigins,
        allowedMethods = DEFAULT_CORS_OPTIONS.allowedMethods,
        allowedHeaders = DEFAULT_CORS_OPTIONS.allowedHeaders,
        credentials = DEFAULT_CORS_OPTIONS.credentials,
        maxAge = DEFAULT_CORS_OPTIONS.maxAge,
    } = options;

    return {
        'Access-Control-Allow-Origin': allowedOrigins.join(', '),
        'Access-Control-Allow-Methods': (allowedMethods ?? []).join(', '),
        'Access-Control-Allow-Headers': (allowedHeaders ?? []).join(', '),
        'Access-Control-Allow-Credentials': (credentials ?? true).toString(),
        'Access-Control-Max-Age': (maxAge ?? 86400).toString(),
    };
}

/**
 * Handle CORS preflight
 */
export function handleCorsPreflight(request: NextRequest, options?: CorsOptions): NextResponse {
    const response = new NextResponse(null, { status: 204 });
    const origin = request.headers.get('origin');

    // Validate origin
    const allowedOrigins = options?.allowedOrigins || DEFAULT_CORS_OPTIONS.allowedOrigins;

    if (origin && isAllowedOrigin(origin, allowedOrigins)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        // Don't set ACAO for invalid origins
        response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0] || '');
    }

    // Set other CORS headers
    const corsHeaders = getCorsHeaders(options);
    for (const [header, value] of Object.entries(corsHeaders)) {
        if (header !== 'Access-Control-Allow-Origin') {
            response.headers.set(header, value);
        }
    }

    return response;
}

// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Validate CSRF token (timing-safe)
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    if (token.length !== expectedToken.length) return false;

    // Constant-time comparison using XOR (Edge-compatible, no Node.js APIs)
    const encoder = new TextEncoder();
    const a = encoder.encode(token);
    const b = encoder.encode(expectedToken);
    if (a.length !== b.length) return false;

    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a[i] ^ b[i];
    }
    return mismatch === 0;
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
    const cookies = request.cookies;
    return cookies.get('csrf_token')?.value || null;
}

/**
 * Set CSRF token in cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set('csrf_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });
}

// ═══════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object/string recursively
 */
export function sanitizeInput<T>(input: T): T {
    if (typeof input === 'string') {
        return sanitizeHtml(input) as T;
    }

    if (Array.isArray(input)) {
        return input.map((item) => sanitizeInput(item)) as T;
    }

    if (typeof input === 'object' && input !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] = sanitizeInput(value);
        }
        return sanitized as T;
    }

    return input;
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFilename?: string;
}

export function validateFileUpload(
    filename: string,
    maxSizeBytes: number,
    allowedExtensions: string[]
): FileValidationResult {
    // Sanitize filename
    const sanitizedFilename = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .toLowerCase();

    // Check extension
    const extension = sanitizedFilename.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
        };
    }

    // Check filename length
    if (sanitizedFilename.length > 255) {
        return {
            valid: false,
            error: 'Filename too long',
        };
    }

    return {
        valid: true,
        sanitizedFilename,
    };
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT HEADERS
// ═══════════════════════════════════════════════════════════════

export interface RateLimitHeaders {
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

export function getRateLimitHeaders(headers: RateLimitHeaders): Record<string, string> {
    return {
        'X-RateLimit-Limit': headers.limit.toString(),
        'X-RateLimit-Remaining': headers.remaining.toString(),
        'X-RateLimit-Reset': headers.resetAt.toString(),
        ...(headers.retryAfter && { 'Retry-After': headers.retryAfter.toString() }),
    };
}

// ═══════════════════════════════════════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface RequestValidationResult {
    valid: boolean;
    error?: string;
    statusCode?: number;
}

/**
 * Validate request has required security headers
 * Allows JSON, multipart (file uploads), form-urlencoded, and text content types.
 * Webhooks and auth callbacks may omit Content-Type entirely — that's OK.
 */
export function validateRequestSecurity(request: NextRequest): RequestValidationResult {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        const contentType = request.headers.get('content-type') || '';
        const pathname = request.nextUrl.pathname;

        // Exempt webhook and auth callback routes — they use varied content types
        const exemptPrefixes = ['/api/payments/', '/api/auth/', '/api/webhooks/', '/api/cron/'];
        const isExempt = exemptPrefixes.some(prefix => pathname.startsWith(prefix));

        if (!isExempt && contentType) {
            const allowedTypes = [
                'application/json',
                'multipart/form-data',
                'application/x-www-form-urlencoded',
                'text/plain',
            ];
            const isAllowed = allowedTypes.some(type => contentType.includes(type));

            if (!isAllowed) {
                return {
                    valid: false,
                    error: `Unsupported Content-Type: ${contentType}`,
                    statusCode: 415,
                };
            }
        }
    }

    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const securityMiddleware = securityHeadersMiddleware;
