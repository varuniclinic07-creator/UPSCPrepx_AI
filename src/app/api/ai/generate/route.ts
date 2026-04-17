// ═══════════════════════════════════════════════════════════════════════════
// AI GENERATION ENDPOINT - /api/ai/generate
// Simple text generation endpoint (alternative to chat)
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/ai-provider-client';
import { requireSession } from '@/lib/auth/session';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/ai/generate — endpoint info
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    return NextResponse.json({
        endpoint: '/api/ai/generate',
        method: 'POST',
        description: 'AI text generation endpoint',
        required: { prompt: 'string' },
        optional: { systemPrompt: 'string', temperature: 'number', max_tokens: 'number' },
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/generate
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await requireSession();
        const userId = session.id;

        const body = await req.json();

        // Rate limit check
        const rateLimit = await checkRateLimit(userId, RATE_LIMITS.aiGenerate);
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
        if (!body.prompt) {
            return NextResponse.json(
                { error: 'Invalid request: prompt is required' },
                { status: 400 }
            );
        }

        // Generate response using callAI
        const generatedText = await callAI(body.prompt, {
            system: body.systemPrompt || 'You are a helpful AI assistant for UPSC CSE preparation.',
            temperature: body.temperature ?? 0.7,
            maxTokens: body.max_tokens ?? 4096,
        });

        return NextResponse.json(
            {
                text: generatedText,
                provider: 'callAI',
            },
            {
                status: 200,
                headers: {
                    'X-Provider': 'callAI',
                },
            }
        );
    } catch (error: any) {
        console.error('AI Generation API Error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                error: error.code || 'GENERATION_ERROR',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
