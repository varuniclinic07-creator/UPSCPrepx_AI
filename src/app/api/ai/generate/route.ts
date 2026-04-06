// ═══════════════════════════════════════════════════════════════════════════
// AI GENERATION ENDPOINT - /api/ai/generate
// Simple text generation endpoint (alternative to chat)
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getAIRouter } from '@/lib/ai/provider-router';
import type { AIRequest } from '@/lib/ai/providers/provider-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/generate
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request
        if (!body.prompt) {
            return NextResponse.json(
                { error: 'Invalid request: prompt is required' },
                { status: 400 }
            );
        }

        // Build AI request from simple prompt
        const aiRequest: AIRequest = {
            model: body.model || 'provider-8/claude-sonnet-4.5',
            messages: [
                {
                    role: 'system',
                    content: body.systemPrompt || 'You are a helpful AI assistant for UPSC CSE preparation.',
                },
                {
                    role: 'user',
                    content: body.prompt,
                },
            ],
            temperature: body.temperature ?? 0.7,
            max_tokens: body.max_tokens ?? 4096,
            userId: body.userId,
            taskType: body.taskType,
        };

        // Get router instance
        const router = getAIRouter();

        // Generate response
        const response = await router.chat(aiRequest);

        // Extract generated text
        const generatedText = response.choices[0]?.message?.content || '';

        return NextResponse.json(
            {
                text: generatedText,
                model: response.model,
                provider: response.provider,
                usage: response.usage,
                fallback_used: response.fallback_used,
            },
            {
                status: 200,
                headers: {
                    'X-Provider': response.provider || 'unknown',
                    'X-Fallback-Used': response.fallback_used ? 'true' : 'false',
                },
            }
        );
    } catch (error: any) {
        console.error('AI Generation API Error:', error);

        return NextResponse.json(
            {
                error: error.code || 'GENERATION_ERROR',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
