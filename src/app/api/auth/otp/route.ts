// ═══════════════════════════════════════════════════════════════
// OTP API ROUTES
// /api/auth/otp/*
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, getOTPStatus } from '@/lib/sms/otp-service';
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/otp/send
 * Send OTP to mobile number
 * SECURITY: Rate limited to 3 requests per minute per phone
 */
export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Invalid phone number' },
                { status: 400 }
            );
        }

        // Apply rate limiting based on phone number
        return await withRateLimit(
            request,
            { ...RATE_LIMITS.otp, prefix: `rl:otp:${phone}` },
            async () => {
                const result = await sendOTP(phone);
                return NextResponse.json(result);
            }
        );

    } catch (error) {
        console.error('OTP send error:', error);
        return NextResponse.json(
            { error: 'Failed to send OTP' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/auth/otp/status?phone=xxx
 * Get OTP status for phone number
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number required' },
                { status: 400 }
            );
        }

        const status = await getOTPStatus(phone);

        return NextResponse.json(status);

    } catch (error) {
        console.error('OTP status error:', error);
        return NextResponse.json(
            { error: 'Failed to get OTP status' },
            { status: 500 }
        );
    }
}
