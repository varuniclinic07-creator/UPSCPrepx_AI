/**
 * AI Usage Tracking Middleware
 * Automatically tracks token usage and costs for all AI requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { costTracker, TokenUsage, calculateCost } from './cost-tracker';
import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════
// USAGE TRACKING TYPES
// ═══════════════════════════════════════════════════════════

interface AIUsageContext {
  userId: string;
  provider: string;
  model: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  sessionId?: string;
}

// ═══════════════════════════════════════════════════════════
// USAGE TRACKING WRAPPER
// ═══════════════════════════════════════════════════════════

/**
 * Wrap AI API handler with automatic usage tracking
 */
export async function withUsageTracking(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    endpoint: string;
    defaultProvider?: string;
    defaultModel?: string;
  }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // No user, skip tracking
      return handler(request);
    }

    // Parse request body for token estimation
    let promptTokens = 0;
    let provider = options.defaultProvider || '9router';
    let model = options.defaultModel || 'default';

    try {
      const body = await request.json();

      // Extract messages for token counting
      if (body.messages && Array.isArray(body.messages)) {
        promptTokens = costTracker.countMessageTokens(body.messages);
      }

      // Extract provider/model if provided
      if (body.provider) provider = body.provider;
      if (body.model) model = body.model;
    } catch {
      // Body parsing failed, use defaults
    }

    // Check usage limits before processing
    const limitCheck = await costTracker.checkUsageLimits(user.id, promptTokens);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          code: 'USAGE_LIMIT_EXCEEDED',
          budgetStatus: limitCheck.budgetStatus,
        },
        { status: 429 }
      );
    }

    // Execute handler
    const response = await handler(request);

    // Track usage after successful response
    const latencyMs = Date.now() - startTime;

    // Try to extract completion tokens from response
    let completionTokens = 0;
    try {
      const responseBody = await response.clone().json();
      if (responseBody.usage?.completion_tokens) {
        completionTokens = responseBody.usage.completion_tokens;
      } else if (responseBody.content) {
        completionTokens = costTracker.estimateTokens(responseBody.content);
      }
    } catch {
      // Response parsing failed, estimate from latency
      completionTokens = Math.floor(latencyMs / 10); // Rough estimate
    }

    // Record usage
    const usage: TokenUsage = {
      userId: user.id,
      provider,
      model,
      endpoint: options.endpoint,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: calculateCost(provider, promptTokens, completionTokens),
      latencyMs,
      sessionId: request.headers.get('x-session-id') || undefined,
      createdAt: new Date().toISOString(),
    };

    // Record asynchronously (don't block response)
    costTracker.recordUsage(usage).catch(console.error);

    // Add usage headers to response
    response.headers.set('X-RateLimit-Remaining',
      (limitCheck.budgetStatus?.tokensRemaining || 0).toString());
    response.headers.set('X-Cost-Remaining',
      (limitCheck.budgetStatus?.costRemaining || 0).toFixed(4));

    return response;
  } catch (error) {
    console.error('[UsageTracking] Error:', error);
    return handler(request);
  }
}

// ═══════════════════════════════════════════════════════════
// TOKEN STREAM TRACKING
// ═══════════════════════════════════════════════════════════

/**
 * Track token usage for streaming responses
 */
export async function trackStreamingUsage(
  request: NextRequest,
  response: Response,
  options: {
    userId: string;
    provider: string;
    model: string;
    endpoint: string;
    promptTokens: number;
    sessionId?: string;
  }
): Promise<Response> {
  const startTime = Date.now();
  let completionTokens = 0;
  let contentLength = 0;

  // Create a new readable stream that counts tokens
  const reader = response.body?.getReader();
  if (!reader) {
    return response;
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Track final usage
            const latencyMs = Date.now() - startTime;
            const usage: TokenUsage = {
              userId: options.userId,
              provider: options.provider,
              model: options.model,
              endpoint: options.endpoint,
              promptTokens: options.promptTokens,
              completionTokens,
              totalTokens: options.promptTokens + completionTokens,
              cost: calculateCost(options.provider, options.promptTokens, completionTokens),
              latencyMs,
              sessionId: options.sessionId,
              createdAt: new Date().toISOString(),
            };

            costTracker.recordUsage(usage).catch(console.error);
            controller.close();
            break;
          }

          // Count tokens in chunk
          const text = new TextDecoder().decode(value);
          completionTokens += costTracker.estimateTokens(text);
          contentLength += value.length;

          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  // Create new response with tracking stream
  return new Response(stream, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

// ═══════════════════════════════════════════════════════════
// USAGE QUOTA CHECK
// ═══════════════════════════════════════════════════════════

/**
 * Check if user has remaining quota for AI operations
 */
export async function checkAIQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: {
    tokens: number;
    cost: number;
    requests: number;
  };
  limits: {
    tokens: number;
    cost: number;
    requests: number;
  };
  warnings: string[];
}> {
  const budgetStatus = await costTracker.getBudgetStatus(userId);

  return {
    allowed: !budgetStatus.isOverLimit,
    remaining: {
      tokens: budgetStatus.tokensRemaining,
      cost: budgetStatus.costRemaining,
      requests: budgetStatus.requestsLimit - budgetStatus.requestsToday,
    },
    limits: {
      tokens: budgetStatus.tokensLimit,
      cost: budgetStatus.costLimit,
      requests: budgetStatus.requestsLimit,
    },
    warnings: budgetStatus.warnings,
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const usageTracking = {
  withUsageTracking,
  trackStreamingUsage,
  checkAIQuota,
};
