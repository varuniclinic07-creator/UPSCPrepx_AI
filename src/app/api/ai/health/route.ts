// ═══════════════════════════════════════════════════════════════════════════
// AI HEALTH CHECK ENDPOINT - /api/ai/health
// Returns health status of all AI providers
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/ai-provider-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/ai/health
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        // Simple health check: attempt a minimal callAI invocation
        const testResponse = await callAI('Respond with OK', {
            maxTokens: 5,
            temperature: 0,
        });

        const isHealthy = testResponse && testResponse.length > 0;

        return NextResponse.json(
            {
                status: isHealthy ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                provider: 'callAI',
            },
            { status: isHealthy ? 200 : 503 }
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
