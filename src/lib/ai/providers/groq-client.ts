// ═══════════════════════════════════════════════════════════════════════════
// GROQ PROVIDER CLIENT
// Fallback AI provider with higher rate limits
// ═══════════════════════════════════════════════════════════════════════════

import type {
    ProviderClient,
    ChatCompletionRequest,
    ChatCompletionResponse,
    StreamChunk,
    AIProviderError,
    AIProviderErrorCode,
} from './provider-types';

export class GroqClient implements ProviderClient {
    public readonly name = 'groq' as const;
    private readonly baseURL: string;
    private readonly apiKey: string;

    constructor() {
        this.baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
        this.apiKey = process.env.GROQ_API_KEY!;

        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY environment variable is required');
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CHAT COMPLETION
    // ═════════════════════════════════════════════════════════════════════════

    async chatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse> {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.max_tokens ?? 4096,
                    top_p: request.top_p,
                    frequency_penalty: request.frequency_penalty,
                    presence_penalty: request.presence_penalty,
                    stop: request.stop,
                    user: request.user,
                }),
            });

            if (!response.ok) {
                throw await this.handleHTTPError(response);
            }

            const data = await response.json();

            return {
                ...data,
                provider: 'groq',
                fallback_used: true,
            };
        } catch (error) {
            throw this.wrapError(error);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STREAMING CHAT COMPLETION
    // ═════════════════════════════════════════════════════════════════════════

    async *streamChatCompletion(
        request: ChatCompletionRequest
    ): AsyncGenerator<StreamChunk> {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.7,
                    max_tokens: request.max_tokens ?? 4096,
                    top_p: request.top_p,
                    frequency_penalty: request.frequency_penalty,
                    presence_penalty: request.presence_penalty,
                    stop: request.stop,
                    stream: true,
                    user: request.user,
                }),
            });

            if (!response.ok) {
                throw await this.handleHTTPError(response);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(trimmed.slice(6));
                            yield json;
                        } catch (e) {
                            console.error('Failed to parse SSE chunk:', e);
                        }
                    }
                }
            }
        } catch (error) {
            throw this.wrapError(error);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ═════════════════════════════════════════════════════════════════════════

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                signal: AbortSignal.timeout(5000),
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═════════════════════════════════════════════════════════════════════════

    private async handleHTTPError(response: Response): Promise<AIProviderError> {
        let errorData: any;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        const message = errorData.error?.message || errorData.message || 'Unknown error';

        // Rate limit error
        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

            return {
                name: 'AIProviderError',
                code: 'RATE_LIMIT_EXCEEDED' as AIProviderErrorCode,
                message: `Groq rate limit exceeded: ${message}`,
                provider: 'groq',
                retryable: true,
                retryAfter: retryAfterMs,
            } as AIProviderError;
        }

        // Authentication error
        if (response.status === 401 || response.status === 403) {
            return {
                name: 'AIProviderError',
                code: 'AUTHENTICATION_ERROR' as AIProviderErrorCode,
                message: `Groq authentication failed: ${message}`,
                provider: 'groq',
                retryable: false,
            } as AIProviderError;
        }

        // Model not found
        if (response.status === 404) {
            return {
                name: 'AIProviderError',
                code: 'MODEL_NOT_FOUND' as AIProviderErrorCode,
                message: `Groq model not found: ${message}`,
                provider: 'groq',
                retryable: false,
            } as AIProviderError;
        }

        // Invalid parameters
        if (response.status === 400) {
            return {
                name: 'AIProviderError',
                code: 'INVALID_PARAMETERS' as AIProviderErrorCode,
                message: `Groq invalid parameters: ${message}`,
                provider: 'groq',
                retryable: false,
            } as AIProviderError;
        }

        // Server error
        return {
            name: 'AIProviderError',
            code: 'PROVIDER_UNAVAILABLE' as AIProviderErrorCode,
            message: `Groq server error: ${message}`,
            provider: 'groq',
            retryable: true,
        } as AIProviderError;
    }

    private wrapError(error: any): AIProviderError {
        if (error.code) {
            return error as AIProviderError;
        }

        // Network timeout
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
            return {
                name: 'AIProviderError',
                code: 'TIMEOUT' as AIProviderErrorCode,
                message: 'Groq request timeout',
                provider: 'groq',
                retryable: true,
            } as AIProviderError;
        }

        // Generic error
        return {
            name: 'AIProviderError',
            code: 'UNKNOWN_ERROR' as AIProviderErrorCode,
            message: error.message || 'Unknown Groq error',
            provider: 'groq',
            retryable: false,
        } as AIProviderError;
    }
}

// Export singleton instance
export const groqClient = new GroqClient();
