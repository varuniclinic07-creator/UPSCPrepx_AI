// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION CRON JOB
// /api/cron/subscriptions
// Scheduled job for subscription maintenance
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { runSubscriptionMaintenance } from '@/lib/payments/subscription-cron';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/subscriptions
 * Run subscription maintenance tasks
 * Protected by cron secret
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('[Cron] CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            console.warn('[Cron] Invalid or missing cron secret');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Run maintenance
        console.log('[Cron] Starting subscription maintenance...');
        await runSubscriptionMaintenance();

        return NextResponse.json({
            success: true,
            message: 'Subscription maintenance completed'
        });

    } catch (error) {
        console.error('[Cron] Subscription maintenance failed:', error);

        return NextResponse.json(
            { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/subscriptions
 * Health check for cron endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/cron/subscriptions',
        description: 'Subscription maintenance cron job'
    });
}
