// ═══════════════════════════════════════════════════════════════
// AGENTIC ORCHESTRATOR
// Smart routing to appropriate agentic service
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';

const SERVICE_URLS = {
    webSearch: process.env.AGENTIC_WEB_SEARCH_URL || 'http://89.117.60.144:8030',
    docChat: process.env.AGENTIC_AUTODOC_URL || 'http://89.117.60.144:8031',
    fileSearch: process.env.AGENTIC_FILE_SEARCH_URL || 'http://89.117.60.144:8032'
};

interface OrchestrationRequest {
    query: string;
    context?: {
        documentId?: string;
        path?: string;
    };
    forceService?: 'web-search' | 'doc-chat' | 'file-search';
}

/**
 * Analyze query and determine which service to use
 */
function analyzeIntent(query: string): 'web-search' | 'doc-chat' | 'file-search' {
    const lowerQuery = query.toLowerCase();

    // Document chat keywords
    const docKeywords = ['pdf', 'document', 'explain this', 'what does this mean', 'summarize this', 'in this document'];
    if (docKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'doc-chat';
    }

    // File search keywords
    const fileKeywords = ['find notes', 'locate file', 'where is', 'search materials', 'show me files'];
    if (fileKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'file-search';
    }

    // Web search keywords (default)
    const webKeywords = ['latest', 'current', 'news', 'recent', 'today', 'search', 'google', 'what is'];
    if (webKeywords.some(kw => lowerQuery.includes(kw))) {
        return 'web-search';
    }

    // Default to web search
    return 'web-search';
}

/**
 * POST /api/agentic/orchestrator
 */
export async function POST(request: NextRequest) {
    try {
        await requireSession();  // Auth check
        const body: OrchestrationRequest = await request.json();

        const { query, context, forceService } = body;

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Determine service
        const service = forceService || analyzeIntent(query);

        let serviceUrl: string;
        let endpoint: string;
        let payload: any;

        switch (service) {
            case 'web-search':
                serviceUrl = SERVICE_URLS.webSearch;
                endpoint = '/search';
                payload = { query, max_results: 10 };
                break;

            case 'doc-chat':
                serviceUrl = SERVICE_URLS.docChat;
                endpoint = '/chat';
                payload = {
                    document_id: context?.documentId,
                    question: query
                };
                break;

            case 'file-search':
                serviceUrl = SERVICE_URLS.fileSearch;
                endpoint = '/search';
                payload = {
                    query,
                    path: context?.path || '/'
                };
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid service' },
                    { status: 400 }
                );
        }

        // Call service
        const response = await fetch(`${serviceUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Service error: ${response.statusText}`);
        }

        const data = await response.json();

        // Log usage
        // TODO: Track in database

        return NextResponse.json({
            service,
            query,
            result: data,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Orchestrator error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
