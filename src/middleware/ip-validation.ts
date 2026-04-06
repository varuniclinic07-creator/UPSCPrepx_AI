// ═══════════════════════════════════════════════════════════════
// IP VALIDATION MIDDLEWARE
// Enforces one registration per IP address
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Hash IP address with SHA-256
 */
function hashIP(ip: string, salt: string = process.env.IP_HASH_SALT || 'upsc_salt_2024'): string {
    return crypto
        .createHash('sha256')
        .update(ip + salt)
        .digest('hex');
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
    // Try various headers (for proxy/load balancer scenarios)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to remote address
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.ip ||
        '0.0.0.0';
}

/**
 * Get device fingerprint from headers
 */
function getDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || '';
    const acceptEncoding = request.headers.get('accept-encoding') || '';

    const fingerprint = crypto
        .createHash('md5')
        .update(`${userAgent}${acceptLanguage}${acceptEncoding}`)
        .digest('hex');

    return fingerprint;
}

export interface IPValidationResult {
    allowed: boolean;
    reason?: string;
    existingEmail?: string;
    ipHash: string;
    ipAddress: string;
    deviceFingerprint: string;
}

/**
 * Check if IP can register
 */
export async function validateIPForRegistration(
    request: NextRequest,
    email: string
): Promise<IPValidationResult> {
    const supabase = await createClient();

    const ipAddress = getClientIP(request);
    const ipHash = hashIP(ipAddress);
    const deviceFingerprint = getDeviceFingerprint(request);

    // Call database function
    const { data, error } = await (supabase as any).rpc('check_ip_registration', {
        p_ip_address: ipAddress,
        p_email: email
    });

    if (error) {
        console.error('IP validation error:', error);
        return {
            allowed: false,
            reason: 'IP validation service error',
            ipHash,
            ipAddress,
            deviceFingerprint
        };
    }

    const result = (data as any)?.[0] || {};

    return {
        allowed: result.can_register,
        reason: result.reason,
        existingEmail: result.existing_email,
        ipHash,
        ipAddress,
        deviceFingerprint
    };
}

/**
 * Record IP registration
 */
export async function recordIPRegistration(
    ipAddress: string,
    ipHash: string,
    userId: string,
    userEmail: string,
    userAgent: string,
    deviceFingerprint: string
): Promise<void> {
    const supabase = await createClient();

    await supabase.from('ip_registrations').insert({
        ip_address: ipAddress,
        ip_hash: ipHash,
        user_id: userId,
        user_email: userEmail,
        user_agent: userAgent,
        device_fingerprint: deviceFingerprint
    } as any);
}

/**
 * Middleware for IP validation
 */
export async function ipValidationMiddleware(request: NextRequest) {
    const url = new URL(request.url);

    // Only apply to registration endpoints
    if (!url.pathname.includes('/api/auth/register')) {
        return NextResponse.next();
    }

    try {
        const body = await request.json();
        const email = body.email;

        if (!email) {
            return NextResponse.json(
                { error: 'Email required' },
                { status: 400 }
            );
        }

        const validation = await validateIPForRegistration(request, email);

        if (!validation.allowed) {
            return NextResponse.json(
                {
                    error: 'Registration not allowed from this IP',
                    reason: validation.reason,
                    upgradeRequired: validation.reason?.includes('One registration per IP')
                },
                { status: 403 }
            );
        }

        // Attach validation result to request for use in handler
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-ip-validation', JSON.stringify(validation));

        return NextResponse.next({
            request: {
                headers: requestHeaders
            }
        });

    } catch (error) {
        console.error('IP validation middleware error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
