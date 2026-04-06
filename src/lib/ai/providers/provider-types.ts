// ═══════════════════════════════════════════════════════════════════════════
// AI PROVIDER TYPES - Shared type definitions for all providers
// ═══════════════════════════════════════════════════════════════════════════

export type AIProvider = 'a4f' | 'groq';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type TaskType = 'reasoning' | 'coding' | 'multimodal' | 'general';

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
    stream?: boolean;
    user?: string;
}

export interface AIRequest extends ChatCompletionRequest {
    userId?: string;
    priority?: 'low' | 'medium' | 'high';
    taskType?: TaskType;
    forceProvider?: AIProvider;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatCompletionChoice {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    provider?: AIProvider;
    fallback_used?: boolean;
}

export interface StreamChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
        };
        finish_reason: string | null;
    }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER CLIENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface ProviderClient {
    name: AIProvider;

    chatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse>;

    streamChatCompletion(
        request: ChatCompletionRequest
    ): AsyncGenerator<StreamChunk>;

    isAvailable(): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RateLimitResult {
    allowed: boolean;
    remainingRequests: number;
    resetAt: Date;
    retryAfter?: number;
}

export interface RateLimitConfig {
    rpm: number;              // Requests per minute
    concurrent: number;       // Max concurrent requests
    userQuotaDaily?: number;  // Per-user daily quota
}

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CircuitBreakerConfig {
    failureThreshold: number;    // Failures before opening
    successThreshold: number;    // Successes to close from half-open
    resetTimeout: number;        // Time before half-open (ms)
    monitorWindow: number;       // Rolling window for failures (ms)
}

export interface CircuitBreakerState {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime?: number;
    lastStateChange: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// METRICS TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProviderMetrics {
    requestCount: number;
    successCount: number;
    failureCount: number;
    averageLatency: number;
    rateLimitHits: number;
    circuitBreakerTrips: number;
    fallbackUsage: number;
    tokensConsumed: number;
    lastUpdated: Date;
}

export interface RequestMetadata {
    provider: AIProvider;
    model: string;
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: string;
    tokensUsed?: number;
    fallbackUsed: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RouterConfig {
    primaryProvider: AIProvider;
    fallbackProviders: AIProvider[];
    rateLimits: Record<AIProvider, RateLimitConfig>;
    circuitBreaker: CircuitBreakerConfig;
    retryStrategy: {
        maxRetries: number;
        backoffMultiplier: number;
        initialDelay: number;
    };
    enableCaching: boolean;
    cacheTTL: number;
}

export interface HealthCheckResult {
    provider: AIProvider;
    isHealthy: boolean;
    remainingRequests: number;
    circuitState: CircuitState;
    latency?: number;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

export enum AIProviderErrorCode {
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
    CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
    MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
    INVALID_PARAMETERS = 'INVALID_PARAMETERS',
    TIMEOUT = 'TIMEOUT',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AIProviderError extends Error {
    constructor(
        public code: AIProviderErrorCode,
        message: string,
        public provider?: AIProvider,
        public retryable: boolean = false,
        public retryAfter?: number
    ) {
        super(message);
        this.name = 'AIProviderError';
    }
}
