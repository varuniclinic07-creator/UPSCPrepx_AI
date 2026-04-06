// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// OWASP-compliant security headers and protections
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

/**
 * Security headers following OWASP best practices
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob: https:; " +
        "frame-src 'self' https://api.razorpay.com; " +
        "connect-src 'self' https://*.supabase.co https://api.razorpay.com wss://*.supabase.co; " +
        "object-src 'none'; " +
        "base-uri 'self';"
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(self)'
    );

    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return response;
}

/**
 * Input sanitization utilities
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove JS protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number (Indian)
 */
export function isValidIndianPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleanPhone);
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}

/**
 * IP-based rate limiting for sensitive endpoints
 * Uses Redis-based sliding window rate limiter
 */
export async function checkIPRateLimit(
    ip: string,
    endpoint: string,
    limit: number = 10,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    try {
        // Import the real rate limiter
        const { checkRateLimit } = await import('@/lib/security/rate-limiter');

        const result = await checkRateLimit(`${ip}:${endpoint}`, {
            limit,
            window: windowSeconds,
            prefix: 'rl:ip'
        });

        return {
            allowed: result.success,
            remaining: result.remaining,
            resetTime: result.reset * 1000, // Convert to ms
            retryAfter: result.retryAfter
        };
    } catch (error) {
        console.error('[RateLimit] Error:', error);
        // Fail open if Redis unavailable
        return {
            allowed: true,
            remaining: limit,
            resetTime: Date.now() + (windowSeconds * 1000)
        };
    }
}

/**
 * Audit logging for security events
 */
export function logSecurityEvent(event: {
    type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'suspicious' | 'admin_action';
    userId?: string;
    ip: string;
    userAgent: string;
    details: Record<string, any>;
}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...event
    };

    // In production, send to SIEM/logging service
    console.log('[SECURITY]', JSON.stringify(logEntry));
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Generate cryptographically secure token
 */
export function generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
}