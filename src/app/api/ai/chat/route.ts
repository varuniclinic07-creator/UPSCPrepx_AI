// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT API ENDPOINT - /api/ai/chat
// Main endpoint for AI chat completions with automatic provider routing
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getAIRouter } from '@/lib/ai/provider-router';
import type { AIRequest } from '@/lib/ai/providers/provider-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/chat
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

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

        // Build AI request
        const aiRequest: AIRequest = {
            model: body.model,
            messages: body.messages,
            temperature: body.temperature,
            max_tokens: body.max_tokens,
            top_p: body.top_p,
            frequency_penalty: body.frequency_penalty,
            presence_penalty: body.presence_penalty,
            stop: body.stop,
            stream: body.stream || false,
            userId: body.userId,
            priority: body.priority,
            taskType: body.taskType,
            forceProvider: body.forceProvider,
        };

        // Get router instance
        const router = getAIRouter();

        // Handle streaming vs non-streaming
        if (aiRequest.stream) {
            return handleStreamingRequest(router, aiRequest);
        } else {
            return handleNonStreamingRequest(router, aiRequest);
        }
    } catch (error) {
        console.error('AI Chat API Error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: (error as Error).message,
            },
            { status: 500 }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLE NON-STREAMING REQUEST
// ═══════════════════════════════════════════════════════════════════════════

async function handleNonStreamingRequest(router: any, aiRequest: AIRequest) {
    try {
        const response = await router.chat(aiRequest);

        return NextResponse.json(response, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Provider': response.provider || 'unknown',
                'X-Fallback-Used': response.fallback_used ? 'true' : 'false',
            },
        });
    } catch (error: any) {
        const statusCode = getStatusCodeFromError(error);

        return NextResponse.json(
            {
                error: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                provider: error.provider,
                retryable: error.retryable || false,
                retryAfter: error.retryAfter,
            },
            {
                status: statusCode,
                headers: error.retryAfter
                    ? { 'Retry-After': String(Math.ceil(error.retryAfter / 1000)) }
                    : {},
            }
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLE STREAMING REQUEST
// ═══════════════════════════════════════════════════════════════════════════

async function handleStreamingRequest(router: any, aiRequest: AIRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of router.streamChat(aiRequest)) {
                    const data = `data: ${JSON.stringify(chunk)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                }

                // Send completion marker
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            } catch (error) {
                console.error('Streaming error:', error);

                const errorData = {
                    error: (error as any).code || 'STREAMING_ERROR',
                    message: (error as Error).message,
                };

                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
                );
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getStatusCodeFromError(error: any): number {
    switch (error.code) {
        case 'RATE_LIMIT_EXCEEDED':
            return 429;
        case 'AUTHENTICATION_ERROR':
            return 401;
        case 'INVALID_PARAMETERS':
            return 400;
        case 'MODEL_NOT_FOUND':
            return 404;
        case 'PROVIDER_UNAVAILABLE':
        case 'CIRCUIT_BREAKER_OPEN':
            return 503;
        case 'TIMEOUT':
            return 504;
        default:
            return 500;
    }
}
