/**
 * Phase 14: Router Integration Layer
 * Integrates intelligent router with existing AI provider client
 */

import { getAIProviderRouter, ProviderName, RoutingOptions, UserPlan } from './ai-provider-router';
import { getAdvancedLoadBalancer } from './load-balancer';
import { getProviderHealthChecker } from './health-checker';
import { getAIProviderClient } from '../ai-provider-client';
import { costTracker } from '@/lib/ai-cost/cost-tracker';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RoutedCallOptions {
  userId: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  system?: string;
  requiresStreaming?: boolean;
  priority?: 'cost' | 'speed' | 'quality' | 'balanced';
  onChunk?: (chunk: string) => void;
  skipSimplifiedLanguage?: boolean;
}

export interface RoutedCallResult {
  content: string;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  tokensUsed: number;
  cost: number;
}

export interface RoutedStreamResult {
  provider: ProviderName;
  model: string;
  latencyMs: number;
  tokensUsed: number;
  cost: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTED AI CALL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get user's plan from database
 */
async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return 'free';
    }

    // Check if subscription is still valid
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    if (periodEnd < now) {
      return 'free';
    }

    const planMap: Record<string, UserPlan> = {
      free: 'free',
      basic: 'basic',
      premium: 'premium',
      enterprise: 'enterprise',
    };

    return planMap[subscription.plan_type] || 'free';
  } catch (error) {
    console.error('[RouterIntegration] Failed to get user plan:', error);
    return 'free';
  }
}

/**
 * Estimate tokens from messages
 */
function estimateTokensFromMessages(messages: Array<{ role: string; content: string }>): number {
  let totalTokens = 0;

  for (const message of messages) {
    totalTokens += 4; // Base tokens for role + formatting
    totalTokens += Math.ceil(message.content.length / 4); // ~4 chars per token
  }

  totalTokens += 10; // System prompt overhead

  return totalTokens;
}

/**
 * Call AI with intelligent provider routing
 */
export async function callAIWithRouter(
  options: RoutedCallOptions
): Promise<RoutedCallResult> {
  const {
    userId,
    messages,
    temperature = 0.7,
    maxTokens = 2000,
    system,
    requiresStreaming = false,
    priority = 'balanced',
    onChunk,
    skipSimplifiedLanguage = false,
  } = options;

  const startTime = Date.now();
  const router = getAIProviderRouter();
  const loadBalancer = getAdvancedLoadBalancer();

  // Get user's plan
  const userPlan = await getUserPlan(userId);

  // Estimate tokens
  const estimatedTokens = estimateTokensFromMessages(messages);

  // Check budget before routing
  const budgetCheck = await costTracker.checkUsageLimits(userId, estimatedTokens);
  if (!budgetCheck.allowed) {
    throw new Error(budgetCheck.reason || 'Budget limit exceeded');
  }

  // Build routing options
  const routingOptions: RoutingOptions = {
    userId,
    userPlan,
    estimatedTokens,
    requiresStreaming,
    priority,
  };

  // Select best provider
  const decision = await router.selectProvider(routingOptions);

  console.log(
    `[RouterIntegration] Selected ${decision.selectedProvider} for user ${userId}: ${decision.reason}`
  );

  // Start tracking request for load balancing
  router.startRequest(decision.selectedProvider);
  loadBalancer.startRequest(decision.selectedProvider);

  try {
    // Build API request
    const providerConfig = (await import('./ai-provider-router')).PROVIDER_CONFIGS[
      decision.selectedProvider
    ];

    const apiKey = process.env[providerConfig.apiKeyEnv];

    if (!apiKey) {
      throw new Error(`No API key configured for ${decision.selectedProvider}`);
    }

    // Prepare messages with system prompt
    const finalMessages = [...messages];
    const baseSystem = system || 'You are an expert UPSC CSE educator.';

    if (!skipSimplifiedLanguage) {
      const SIMPLIFIED_LANGUAGE_PROMPT = `
CRITICAL LANGUAGE RULES — FOLLOW STRICTLY:
1. Write for a 10th-class student. One reading = full understanding.
2. No jargon without explanation. Technical terms get parenthetical definitions.
3. Real-life Indian examples for every concept.
4. Analogies.
5. Max 15 words per sentence.
6. Mnemonics.
7. Exam tips.
8. If Hindi: use simple Hindi (Hinglish acceptable).
`.trim();

      const sysIdx = finalMessages.findIndex((m) => m.role === 'system');
      if (sysIdx >= 0) {
        finalMessages[sysIdx] = {
          ...finalMessages[sysIdx],
          content: `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${finalMessages[sysIdx].content}`,
        };
      } else {
        finalMessages.unshift({ role: 'system', content: SIMPLIFIED_LANGUAGE_PROMPT });
      }
    } else if (!system && finalMessages.every((m) => m.role !== 'system')) {
      finalMessages.unshift({ role: 'system', content: baseSystem });
    }

    // Make API call
    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: decision.selectedModel,
        messages: finalMessages,
        temperature,
        max_tokens: maxTokens,
        stream: requiresStreaming,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `Provider ${decision.selectedProvider} returned ${response.status}: ${response.statusText}`
      );
    }

    let content = '';
    let completionTokens = 0;

    if (requiresStreaming && onChunk) {
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const chunkContent = data.choices?.[0]?.delta?.content || '';
              if (chunkContent) {
                content += chunkContent;
                onChunk(chunkContent);
              }
            } catch (e) {
              console.warn('[RouterIntegration] Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      completionTokens = estimateTokensFromMessages([{ role: 'assistant', content }]);
    } else {
      // Handle non-streaming response
      const data = await response.json();
      content = data.choices?.[0]?.message?.content || '';
      completionTokens = data.usage?.completion_tokens || estimateTokensFromMessages([{ role: 'assistant', content }]);
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = estimatedTokens + completionTokens;

    // Record success for health monitoring
    router.recordSuccess(decision.selectedProvider, latencyMs);
    loadBalancer.endRequest(decision.selectedProvider);

    // Calculate actual cost
    const cost = costTracker.calculateCost(
      decision.selectedProvider,
      estimatedTokens,
      completionTokens
    );

    // Record usage for billing
    await costTracker.recordUsage({
      userId,
      provider: decision.selectedProvider,
      model: decision.selectedModel,
      endpoint: '/api/ai/chat',
      promptTokens: estimatedTokens,
      completionTokens,
      totalTokens,
      cost,
      latencyMs,
    });

    return {
      content,
      provider: decision.selectedProvider,
      model: decision.selectedModel,
      latencyMs,
      tokensUsed: totalTokens,
      cost,
    };
  } catch (error) {
    // Record failure for health monitoring
    router.recordFailure(
      decision.selectedProvider,
      error instanceof Error ? error : new Error(String(error))
    );
    loadBalancer.endRequest(decision.selectedProvider);

    // Try fallback providers
    if (decision.fallbackProviders.length > 0) {
      console.log(
        `[RouterIntegration] Trying fallback providers: ${decision.fallbackProviders.join(', ')}`
      );

      for (const fallbackProvider of decision.fallbackProviders) {
        try {
          console.log(`[RouterIntegration] Attempting fallback to ${fallbackProvider}`);

          const fallbackConfig = (await import('./ai-provider-router')).PROVIDER_CONFIGS[
            fallbackProvider
          ];

          const fallbackApiKey = process.env[fallbackConfig.apiKeyEnv];

          if (!fallbackApiKey) {
            console.warn(`[RouterIntegration] No API key for ${fallbackProvider}, skipping`);
            continue;
          }

          router.startRequest(fallbackProvider);
          loadBalancer.startRequest(fallbackProvider);

          const fallbackResponse = await fetch(`${fallbackConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${fallbackApiKey}`,
            },
            body: JSON.stringify({
              model: fallbackConfig.models[0],
              messages,
              temperature,
              max_tokens: maxTokens,
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (!fallbackResponse.ok) {
            throw new Error(
              `Fallback ${fallbackProvider} returned ${fallbackResponse.status}`
            );
          }

          const fallbackData = await fallbackResponse.json();
          const fallbackContent = fallbackData.choices?.[0]?.message?.content || '';
          const fallbackLatency = Date.now() - startTime;

          router.recordSuccess(fallbackProvider, fallbackLatency);
          loadBalancer.endRequest(fallbackProvider);

          const fallbackCompletionTokens =
            fallbackData.usage?.completion_tokens ||
            estimateTokensFromMessages([{ role: 'assistant', content: fallbackContent }]);

          const fallbackCost = costTracker.calculateCost(
            fallbackProvider,
            estimatedTokens,
            fallbackCompletionTokens
          );

          await costTracker.recordUsage({
            userId,
            provider: fallbackProvider,
            model: fallbackConfig.models[0],
            endpoint: '/api/ai/chat',
            promptTokens: estimatedTokens,
            completionTokens: fallbackCompletionTokens,
            totalTokens: estimatedTokens + fallbackCompletionTokens,
            cost: fallbackCost,
            latencyMs: fallbackLatency,
          });

          console.log(
            `[RouterIntegration] Fallback to ${fallbackProvider} successful`
          );

          return {
            content: fallbackContent,
            provider: fallbackProvider,
            model: fallbackConfig.models[0],
            latencyMs: fallbackLatency,
            tokensUsed: estimatedTokens + fallbackCompletionTokens,
            cost: fallbackCost,
          };
        } catch (fallbackError) {
          console.error(
            `[RouterIntegration] Fallback ${fallbackProvider} failed:`,
            fallbackError
          );
          router.recordFailure(
            fallbackProvider,
            fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
          );
          loadBalancer.endRequest(fallbackProvider);
          continue;
        }
      }
    }

    // All providers and fallbacks failed
    throw new Error(
      `All AI providers failed - primary: ${decision.selectedProvider}, fallbacks: ${decision.fallbackProviders.join(', ')}. Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Initialize the router system
 * Call this once at application startup
 */
export function initializeRouterSystem(): void {
  const healthChecker = getProviderHealthChecker(30000); // 30 second interval
  const loadBalancer = getAdvancedLoadBalancer();

  // Start health checks
  healthChecker.start();

  // Start auto-rebalancing
  loadBalancer.startAutoRebalance();

  console.log('[RouterIntegration] Router system initialized');

  return { healthChecker, loadBalancer };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS FOR EXISTING CLIENT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Integration helper: Wrap existing callAI to use router
 */
export function createRoutedCallAI() {
  return async function callAI(
    promptOrOptions: string | {
      prompt?: string;
      messages?: Array<{ role: string; content: string }>;
      system?: string;
      temperature?: number;
      maxTokens?: number;
      skipSimplifiedLanguage?: boolean;
    },
    options?: {
      userId?: string;
      temperature?: number;
      maxTokens?: number;
      system?: string;
      skipSimplifiedLanguage?: boolean;
    }
  ): Promise<string> {
    // Extract userId from options or environment
    const userId = options?.userId || process.env.DEFAULT_USER_ID || 'anonymous';

    // Normalize input
    let messages: Array<{ role: string; content: string }> = [];
    let temperature = options?.temperature ?? 0.7;
    let maxTokens = options?.maxTokens ?? 2000;
    let system = options?.system;
    let skipSimplified = options?.skipSimplifiedLanguage ?? false;

    if (typeof promptOrOptions === 'string') {
      messages = [
        { role: 'user', content: promptOrOptions },
      ];
    } else {
      if (promptOrOptions.messages) {
        messages = [...promptOrOptions.messages];
      } else {
        messages = [{ role: 'user', content: promptOrOptions.prompt || '' }];
      }
      temperature = promptOrOptions.temperature ?? temperature;
      maxTokens = promptOrOptions.maxTokens ?? maxTokens;
      system = promptOrOptions.system ?? system;
      skipSimplified = promptOrOptions.skipSimplifiedLanguage ?? skipSimplified;
    }

    const result = await callAIWithRouter({
      userId,
      messages,
      temperature,
      maxTokens,
      system,
      skipSimplifiedLanguage: skipSimplified,
    });

    return result.content;
  };
}
