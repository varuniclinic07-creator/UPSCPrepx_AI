// ═══════════════════════════════════════════════════════════════
// CSRF PROTECTION UTILITY
// Implements anti-CSRF tokens for state-changing operations
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.ENCRYPTION_KEY || 'default-csrf-secret-change-me';

/**
 * Generate CSRF token
 * Uses HMAC with user session + timestamp for validation
 */
export function generateCSRFToken(sessionId?: string): string {
    const timestamp = Date.now().toString();
    const payload = `${sessionId || 'anonymous'}-${timestamp}`;

    const token = crypto
        .createHmac('sha256', CSRF_SECRET)
        .update(payload)
        .digest('hex');

    // Return token with timestamp for validation
    return `${token}.${timestamp}`;
}

/**
 * Validate CSRF token
 * Checks token signature and expiry (1 hour default)
 */
export function validateCSRFToken(
    token: string,
    sessionId?: string,
    maxAgeMs: number = 3600000 // 1 hour
): boolean {
    try {
        const [signature, timestamp] = token.split('.');

        if (!signature || !timestamp) {
            return false;
        }

        // Check token age
        const tokenTime = parseInt(timestamp, 10);
        if (isNaN(tokenTime) || Date.now() - tokenTime > maxAgeMs) {
            return false;
        }

        // Verify signature
        const payload = `${sessionId || 'anonymous'}-${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', CSRF_SECRET)
            .update(payload)
            .digest('hex');

        // Timing-safe comparison
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

/**
 * CSRF Protection Middleware Helper
 * Use in API routes for state-changing operations
 */
export async function withCSRFProtection<T>(
    request: NextRequest,
    handler: () => Promise<T>,
    sessionId?: string
): Promise<T | NextResponse> {
    // Skip CSRF check for safe methods
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return handler();
    }

    // Get CSRF token from header or body
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) {
        return NextResponse.json(
            { error: 'Missing CSRF token' },
            { status: 403 }
        );
    }

    if (!validateCSRFToken(headerToken, sessionId)) {
        return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
        );
    }

    return handler();
}

/**
 * Set CSRF cookie for client-side usage
 */
export async function setCSRFCookie(sessionId?: string): Promise<string> {
    const token = generateCSRFToken(sessionId);
    const cookieStore = await cookies();

    cookieStore.set(CSRF_TOKEN_NAME, token, {
        httpOnly: false, // Client needs to read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 // 1 hour
    });

    return token;
}

/**
 * Origin/Referer validation for additional CSRF protection
 */
export function validateRequestOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // For non-browser requests, skip this check
    if (!origin && !referer) {
        // Could be a direct API call - rely on CSRF token
        return true;
    }

    const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        `https://${host}`,
        `http://${host}`, // For development
    ].filter(Boolean);

    // Check origin
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
        return true;
    }

    // Check referer
    if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed as string))) {
        return true;
    }

    return false;
}

/**
 * Combined CSRF and Origin protection
 * Recommended for sensitive operations
 */
export async function withFullCSRFProtection<T>(
    request: NextRequest,
    handler: () => Promise<T>,
    sessionId?: string
): Promise<T | NextResponse> {
    const method = request.method.toUpperCase();

    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return handler();
    }

    // Validate origin
    if (!validateRequestOrigin(request)) {
        console.warn('[CSRF] Origin validation failed:', request.headers.get('origin'));
        return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
        );
    }

    // Validate CSRF token
    return withCSRFProtection(request, handler, sessionId);
}
