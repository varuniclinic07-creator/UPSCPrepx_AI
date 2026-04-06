// ═══════════════════════════════════════════════════════════════════════════
// AI HEALTH CHECK ENDPOINT - /api/ai/health
// Returns health status of all AI providers
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getAIRouter } from '@/lib/ai/provider-router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/ai/health
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        const router = getAIRouter();

        // Get health status of all providers
        const health = await router.checkHealth();

        // Get usage statistics
        const usage = await router.getUsageStats();

        // Determine overall system health
        const allHealthy = Object.values(health).every(h => h.isHealthy);

        return NextResponse.json(
            {
                status: allHealthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                providers: health,
                usage,
            },
            { status: allHealthy ? 200 : 503 }
        );
    } catch (error) {
        console.error('Health check error:', error);

        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
