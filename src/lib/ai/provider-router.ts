// ═══════════════════════════════════════════════════════════════════════════
// AI PROVIDER ROUTER - Intelligent Multi-Provider Routing System
// Automatic routing between A4F (primary) and Groq (fallback)
// ═══════════════════════════════════════════════════════════════════════════

import { a4fClient } from './providers/a4f-client';
import { groqClient } from './providers/groq-client';
import { modelMapper } from './model-mapper';
import { getRateLimiter } from './rate-limiter';
import { getCircuitBreaker } from './circuit-breaker';

import type {
    AIProvider,
    AIRequest,
    ChatCompletionRequest,
    ChatCompletionResponse,
    StreamChunk,
    HealthCheckResult,
    ProviderClient,
    AIProviderError,
    AIProviderErrorCode,
    RouterConfig,
} from './providers/provider-types';

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: RouterConfig = {
    primaryProvider: 'a4f' as AIProvider,
    fallbackProviders: ['groq'] as AIProvider[],
    rateLimits: {
        a4f: { rpm: 10, concurrent: 5 },
        groq: { rpm: 30, concurrent: 10 },
    },
    circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        resetTimeout: 30000,
        monitorWindow: 60000,
    },
    retryStrategy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
    },
    enableCaching: process.env.ENABLE_REQUEST_CACHING === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300'),
};

// ═══════════════════════════════════════════════════════════════════════════
// AI PROVIDER ROUTER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AIProviderRouter {
    private config: RouterConfig;
    private providers: Map<AIProvider, any>;
    private rateLimiter = getRateLimiter();
    private circuitBreaker = getCircuitBreaker();

    constructor(config: Partial<RouterConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Initialize provider clients
        this.providers = new Map([
            ['a4f', a4fClient],
            ['groq', groqClient],
        ] as any);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MAIN ROUTING METHOD
    // ═════════════════════════════════════════════════════════════════════════

    async chat(request: AIRequest): Promise<ChatCompletionResponse> {
        const startTime = Date.now();

        try {
            // Determine which provider to use
            const provider = await this.selectProvider(request);

            // Get provider client
            const client = this.providers.get(provider);
            if (!client) {
                throw new Error(`Provider ${provider} not configured`);
            }

            // Prepare request for the selected provider
            const providerRequest = this.prepareRequest(request, provider);

            // Execute with circuit breaker protection
            const response = await this.circuitBreaker.execute(provider, async () => {
                // Consume rate limit token
                await this.rateLimiter.consumeToken(provider, request.userId);

                try {
                    // Make the API call
                    const result = await client.chatCompletion(providerRequest);

                    return result;
                } finally {
                    // Release concurrent slot
                    await this.rateLimiter.releaseSlot(provider);
                }
            });

            // Track metrics
            await this.trackRequest(provider, startTime, true, response.usage?.total_tokens);

            return response;
        } catch (error) {
            // Track failure
            await this.trackRequest(
                request.forceProvider || 'a4f',
                startTime,
                false,
                0,
                error as Error
            );

            // Try fallback if available
            if (!request.forceProvider && this.shouldFallback(error as AIProviderError)) {
                console.log('Primary provider failed, attempting fallback...');
                return this.chatWithFallback(request);
            }

            throw error;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STREAMING CHAT
    // ═════════════════════════════════════════════════════════════════════════

    async *streamChat(request: AIRequest): AsyncGenerator<StreamChunk> {
        // Determine provider
        const provider = await this.selectProvider(request);
        const client = this.providers.get(provider);

        if (!client) {
            throw new Error(`Provider ${provider} not configured`);
        }

        // Prepare request
        const providerRequest = this.prepareRequest(request, provider);
        providerRequest.stream = true;

        // Consume rate limit
        await this.rateLimiter.consumeToken(provider, request.userId);

        try {
            // Stream from provider
            for await (const chunk of client.streamChatCompletion(providerRequest)) {
                yield chunk;
            }
        } finally {
            // Release slot when done
            await this.rateLimiter.releaseSlot(provider);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FALLBACK ROUTING
    // ═════════════════════════════════════════════════════════════════════════

    private async chatWithFallback(request: AIRequest): Promise<ChatCompletionResponse> {
        for (const fallbackProvider of this.config.fallbackProviders) {
            try {
                console.log(`Trying fallback provider: ${fallbackProvider}`);

                // Check if fallback provider is available
                const canUse = await this.canUseProvider(fallbackProvider);
                if (!canUse) {
                    console.log(`Fallback provider ${fallbackProvider} is not available`);
                    continue;
                }

                // Try fallback
                const response = await this.chat({
                    ...request,
                    forceProvider: fallbackProvider,
                });

                console.log(`Fallback to ${fallbackProvider} succeeded`);
                return response;
            } catch (error) {
                console.error(`Fallback provider ${fallbackProvider} failed:`, error);
                continue;
            }
        }

        throw new Error('All providers failed, no fallback available');
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PROVIDER SELECTION
    // ═════════════════════════════════════════════════════════════════════════

    private async selectProvider(request: AIRequest): Promise<AIProvider> {
        // If provider is forced, use it
        if (request.forceProvider) {
            return request.forceProvider;
        }

        // Check if primary provider can be used
        const canUsePrimary = await this.canUseProvider(this.config.primaryProvider);

        if (canUsePrimary) {
            return this.config.primaryProvider;
        }

        // Try fallback providers
        for (const fallbackProvider of this.config.fallbackProviders) {
            const canUse = await this.canUseProvider(fallbackProvider);
            if (canUse) {
                console.log(`Primary provider unavailable, using fallback: ${fallbackProvider}`);
                return fallbackProvider;
            }
        }

        // If no provider available, still return primary (will fail with proper error)
        return this.config.primaryProvider;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PROVIDER AVAILABILITY CHECK
    // ═════════════════════════════════════════════════════════════════════════

    private async canUseProvider(provider: AIProvider): Promise<boolean> {
        // Check circuit breaker
        const circuitState = await this.circuitBreaker.getState(provider);
        if (circuitState.state === 'OPEN') {
            return false;
        }

        // Check rate limit
        const rateLimit = await this.rateLimiter.checkLimit(provider);
        if (!rateLimit.allowed) {
            return false;
        }

        return true;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REQUEST PREPARATION
    // ═════════════════════════════════════════════════════════════════════════

    private prepareRequest(
        request: AIRequest,
        provider: AIProvider
    ): ChatCompletionRequest {
        // If using Groq fallback, map the model
        if (provider === 'groq' && !modelMapper.isGroqModel(request.model)) {
            const taskType = request.taskType || modelMapper.inferTaskType(request);
            const groqModel = modelMapper.mapToGroq(request.model, taskType);

            console.log(`Mapping model ${request.model} → ${groqModel} for Groq`);

            return modelMapper.adaptParameters(
                { ...request, model: groqModel },
                groqModel
            );
        }

        // Return as-is for A4F or if already a Groq model
        return request;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FALLBACK DECISION
    // ═════════════════════════════════════════════════════════════════════════

    private shouldFallback(error: AIProviderError): boolean {
        // Retry only on specific error types
        return [
            'RATE_LIMIT_EXCEEDED' as AIProviderErrorCode,
            'PROVIDER_UNAVAILABLE' as AIProviderErrorCode,
            'TIMEOUT' as AIProviderErrorCode,
            'CIRCUIT_BREAKER_OPEN' as AIProviderErrorCode,
        ].includes(error.code);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ═════════════════════════════════════════════════════════════════════════

    async checkHealth(): Promise<Record<AIProvider, HealthCheckResult>> {
        const results: Record<string, HealthCheckResult> = {};

        for (const [providerName, client] of this.providers.entries()) {
            const provider = providerName as AIProvider;

            try {
                const startTime = Date.now();
                const isHealthy = await client.isAvailable();
                const latency = Date.now() - startTime;

                const rateLimit = await this.rateLimiter.checkLimit(provider);
                const circuitState = await this.circuitBreaker.getState(provider);

                results[provider] = {
                    provider,
                    isHealthy,
                    remainingRequests: rateLimit.remainingRequests,
                    circuitState: circuitState.state,
                    latency,
                };
            } catch (error) {
                results[provider] = {
                    provider,
                    isHealthy: false,
                    remainingRequests: 0,
                    circuitState: 'OPEN',
                    error: (error as Error).message,
                };
            }
        }

        return results as Record<AIProvider, HealthCheckResult>;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // METRICS TRACKING
    // ═════════════════════════════════════════════════════════════════════════

    private async trackRequest(
        provider: AIProvider,
        startTime: number,
        success: boolean,
        tokens?: number,
        error?: Error
    ): Promise<void> {
        const latency = Date.now() - startTime;

        // Track in metrics (implement metrics collector separately)
        console.log({
            provider,
            success,
            latency,
            tokens,
            error: error?.message,
        });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PREMIUM USER ROUTING (Priority access)
    // ═════════════════════════════════════════════════════════════════════════

    async chatPremium(request: AIRequest): Promise<ChatCompletionResponse> {
        // Premium users get priority and bypass some rate limits
        // This is a placeholder for future premium features
        return this.chat({ ...request, priority: 'high' });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET USAGE STATISTICS
    // ═════════════════════════════════════════════════════════════════════════

    async getUsageStats(): Promise<Record<AIProvider, any>> {
        const stats: Record<string, any> = {};

        for (const provider of this.providers.keys()) {
            stats[provider] = await this.rateLimiter.getUsageStats(provider as AIProvider);
        }

        return stats as Record<AIProvider, any>;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let routerInstance: AIProviderRouter | null = null;

export function getAIRouter(): AIProviderRouter {
    if (!routerInstance) {
        routerInstance = new AIProviderRouter();
    }
    return routerInstance;
}

// Export default instance for convenience
export const aiRouter = getAIRouter();
