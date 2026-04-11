// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT API ENDPOINT - /api/ai/chat
// Main endpoint for AI chat completions with automatic provider routing
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/ai-provider-client';
import { requireSession } from '@/lib/auth/session';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/chat
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await requireSession();
        const userId = session.id;

        const body = await req.json();

        // Rate limit check
        const rateLimit = await checkRateLimit(userId, RATE_LIMITS.aiChat);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
                { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
            );
        }

        // Check entitlement
        const access = await checkAccess(userId, 'ai_chat');
        if (!access.allowed) {
            return NextResponse.json(
                { error: access.reason, remaining: access.remaining },
                { status: 403 }
            );
        }

        // Validate request
        if (!body.messages || !Array.isArray(body.messages)) {
            return NextResponse.json(
                { error: 'Invalid request: messages array is required' },
                { status: 400 }
            );
        }

        if (!body.model) {
            return NextResponse.json(
                { error: 'Invalid request: model is required' },
                { status: 400 }
            );
        }

        // Extract system message from messages array
        const systemMessage = body.messages.find((m: any) => m.role === 'system');
        const nonSystemMessages = body.messages.filter((m: any) => m.role !== 'system');

        // Use callAI with messages
        const content = await callAI({
            messages: nonSystemMessages,
            system: systemMessage?.content,
            temperature: body.temperature,
            maxTokens: body.max_tokens,
        });

        return NextResponse.json(
            {
                choices: [{ message: { role: 'assistant', content } }],
                provider: 'callAI',
            },
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Provider': 'callAI',
                },
            }
        );
    } catch (error) {
        console.error('AI Chat API Error:', error);

        if ((error as Error).message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

