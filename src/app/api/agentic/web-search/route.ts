// ═══════════════════════════════════════════════════════════════
// WEB SEARCH PROXY
// Proxy to agentic-web-search service (port 8030)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { resolveWebSearchServiceUrl } from '@/lib/agentic/service-urls';

export const dynamic = 'force-dynamic';

const SERVICE_URL = resolveWebSearchServiceUrl();

export async function POST(request: NextRequest) {
    try {
        await requireSession();  // Auth check - throws if not authenticated
        const { query, maxResults = 10 } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Forward to service
        const response = await fetch(`${SERVICE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                max_results: maxResults
            })
        });

        if (!response.ok) {
            throw new Error('Web search service error');
        }

        const data = await response.json();

        return NextResponse.json({
            query,
            results: data.results || [],
            cached: data.cached || false,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Web search proxy error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
