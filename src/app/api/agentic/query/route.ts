// ═══════════════════════════════════════════════════════════════════════════
// AGENTIC QUERY API - Main entry point for agentic intelligence
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { agenticOrchestrator } from '@/lib/agentic/orchestrator';
import type { AgenticQueryRequest } from '@/types/agentic';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/agentic/query
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request
        if (!body.query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Normalize query for KG enrichment (best-effort)
        try {
            const normalized = await normalizeUPSCInput(body.query);
        } catch (e) {
            console.warn('Normalizer failed, using raw input:', e);
        }

        // Build request
        const request: AgenticQueryRequest = {
            query: body.query,
            context: body.context,
            options: {
                combineServices: body.combineServices ?? true,
                includeWebSearch: body.includeWebSearch ?? true,
                includeStaticMaterials: body.includeStaticMaterials ?? true,
                cache: body.cache ?? true,
            },
        };

        // Execute query
        const response = await agenticOrchestrator.query(request);

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'X-Services-Used': response.servicesUsed.join(','),
                'X-Intent': response.intent,
                'X-Processing-Time': String(response.processingTime),
            },
        });
    } catch (error) {
        console.error('Agentic query error:', error);

        return NextResponse.json(
            {
                error: 'Query failed',
                message: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/agentic/query - Health check
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        const health = await agenticOrchestrator.checkHealth();

        return NextResponse.json({
            status: 'healthy',
            services: health,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                message: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
