// ═══════════════════════════════════════════════════════════════
// FILE SEARCH PROXY
// Proxy to agentic-file-search service (port 8032)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';

const SERVICE_URL = process.env.AGENTIC_FILE_SEARCH_URL || 'http://localhost:8032';

export async function POST(request: NextRequest) {
    try {
        await requireSession();  // Auth check
        const { query, path = '/' } = await request.json();

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
                path
            })
        });

        if (!response.ok) {
            throw new Error('File search service error');
        }

        const data = await response.json();

        return NextResponse.json({
            query,
            results: data.results || [],
            path: data.path || path,
            total: data.total || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('File search proxy error:', error);

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
