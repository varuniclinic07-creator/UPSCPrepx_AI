// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT STREAMING API - /api/ai/chat/stream
// Server-Sent Events (SSE) streaming for real-time AI responses
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { callAIStream } from '@/lib/ai/ai-provider-client';
import { requireSession } from '@/lib/auth/session';
import { checkAccess } from '@/lib/auth/check-access';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/ai/chat/stream - SSE Streaming
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
      // For streaming, return SSE error event
      const encoder = new TextEncoder();
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter })}\n\n`),
        {
          status: 429,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Retry-After': String(rateLimit.retryAfter || 60),
          },
        }
      );
    }

    // Check entitlement
    const access = await checkAccess(userId, 'ai_chat');
    if (!access.allowed) {
      const encoder = new TextEncoder();
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ error: access.reason, remaining: access.remaining })}\n\n`),
        {
          status: 403,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      const encoder = new TextEncoder();
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ error: 'Invalid request: messages array is required' })}\n\n`),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    if (!body.model) {
      const encoder = new TextEncoder();
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ error: 'Invalid request: model is required' })}\n\n`),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Extract system message
    const systemMessage = body.messages.find((m: any) => m.role === 'system');
    const nonSystemMessages = body.messages.filter((m: any) => m.role !== 'system');

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullContent = '';
    let providerUsed = '';

    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (chunk: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        };

        const sendMetadata = (metadata: { provider: string; tokens?: number }) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', ...metadata })}\n\n`));
        };

        const sendDone = () => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', content: fullContent, provider: providerUsed })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        };

        const sendError = (error: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error, type: 'error' })}\n\n`));
          controller.close();
        };

        try {
          // Send initial metadata
          sendMetadata({ provider: 'initializing' });

          await callAIStream(
            {
              messages: nonSystemMessages,
              system: systemMessage?.content,
              temperature: body.temperature,
              maxTokens: body.max_tokens,
              onChunk: (chunk) => {
                fullContent += chunk;
                sendChunk(chunk);
              },
              onComplete: () => {
                providerUsed = 'callAI';
                sendMetadata({ provider: providerUsed });
                sendDone();
              },
              onError: (error) => {
                console.error('Streaming error:', error);
                sendError(error.message);
              },
            }
          );
        } catch (error) {
          console.error('Stream error:', error);
          sendError((error as Error).message);
        }
      },
      cancel() {
        // Client disconnected - cleanup if needed
        console.log('Client disconnected from stream');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('Streaming API Error:', error);

    const encoder = new TextEncoder();
    return new Response(
      encoder.encode(`data: ${JSON.stringify({ error: 'Internal server error', type: 'error' })}\n\n`),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
