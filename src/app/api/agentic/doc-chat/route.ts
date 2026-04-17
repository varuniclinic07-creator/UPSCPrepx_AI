// ═══════════════════════════════════════════════════════════════
// DOCUMENT CHAT PROXY
// Proxy to autodoc-thinker service (port 8031)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { resolveDocChatServiceUrl } from '@/lib/agentic/service-urls';

export const dynamic = 'force-dynamic';

const SERVICE_URL = resolveDocChatServiceUrl();

/**
 * POST /api/agentic/doc-chat (Chat with document)
 */
export async function POST(request: NextRequest) {
    try {
        await requireSession();  // Auth check
        const { documentId, question } = await request.json();

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        // Forward to service
        const response = await fetch(`${SERVICE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                document_id: documentId,
                question
            })
        });

        if (!response.ok) {
            throw new Error('Document chat service error');
        }

        const data = await response.json();

        return NextResponse.json({
            answer: data.answer,
            sources: data.sources || [],
            confidence: data.confidence || 0,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Doc chat proxy error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Please sign in' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Chat failed' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/agentic/doc-chat (Upload document)
 */
export async function PUT(request: NextRequest) {
    try {
        await requireSession();  // Auth check
        const formData = await request.formData();

        // Forward to service
        const response = await fetch(`${SERVICE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Document upload failed');
        }

        const data = await response.json();

        return NextResponse.json({
            documentId: data.document_id,
            filename: data.filename,
            pages: data.pages || 0
        });

    } catch (error: any) {
        console.error('Doc upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}
