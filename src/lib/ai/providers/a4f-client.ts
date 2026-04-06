// ═══════════════════════════════════════════════════════════════════════════
// A4F.CO PROVIDER CLIENT
// Primary AI provider with 10 RPM rate limit
// ═══════════════════════════════════════════════════════════════════════════

import type {
    ProviderClient,
    ChatCompletionRequest,
    ChatCompletionResponse,
    StreamChunk,
    AIProviderError,
    AIProviderErrorCode,
} from './provider-types';

export class A4FClient implements ProviderClient {
    public readonly name = 'a4f' as const;
    private readonly baseURL: string;
    private readonly apiKey: string;

    constructor() {
        this.baseURL = process.env.A4F_BASE_URL || 'https://api.a4f.co/v1/';
        this.apiKey = process.env.A4F_API_KEY!;

        if (!this.apiKey) {
            throw new Error('A4F_API_KEY environment variable is required');
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CHAT COMPLETION
    // ═════════════════════════════════════════════════════════════════════════

    async chatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse> {
        try {
            const response = await fetch(`${this.baseURL}chat/completions`, {
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
                provider: 'a4f',
                fallback_used: false,
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
            const response = await fetch(`${this.baseURL}chat/completions`, {
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
            const response = await fetch(`${this.baseURL}models`, {
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
            return {
                name: 'AIProviderError',
                code: 'RATE_LIMIT_EXCEEDED' as AIProviderErrorCode,
                message: `A4F rate limit exceeded: ${message}`,
                provider: 'a4f',
                retryable: true,
                retryAfter: retryAfter ? parseInt(retryAfter) * 1000 : 60000,
            } as AIProviderError;
        }

        // Authentication error
        if (response.status === 401 || response.status === 403) {
            return {
                name: 'AIProviderError',
                code: 'AUTHENTICATION_ERROR' as AIProviderErrorCode,
                message: `A4F authentication failed: ${message}`,
                provider: 'a4f',
                retryable: false,
            } as AIProviderError;
        }

        // Model not found
        if (response.status === 404) {
            return {
                name: 'AIProviderError',
                code: 'MODEL_NOT_FOUND' as AIProviderErrorCode,
                message: `A4F model not found: ${message}`,
                provider: 'a4f',
                retryable: false,
            } as AIProviderError;
        }

        // Invalid parameters
        if (response.status === 400) {
            return {
                name: 'AIProviderError',
                code: 'INVALID_PARAMETERS' as AIProviderErrorCode,
                message: `A4F invalid parameters: ${message}`,
                provider: 'a4f',
                retryable: false,
            } as AIProviderError;
        }

        // Server error
        return {
            name: 'AIProviderError',
            code: 'PROVIDER_UNAVAILABLE' as AIProviderErrorCode,
            message: `A4F server error: ${message}`,
            provider: 'a4f',
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
                message: 'A4F request timeout',
                provider: 'a4f',
                retryable: true,
            } as AIProviderError;
        }

        // Generic error
        return {
            name: 'AIProviderError',
            code: 'UNKNOWN_ERROR' as AIProviderErrorCode,
            message: error.message || 'Unknown A4F error',
            provider: 'a4f',
            retryable: false,
        } as AIProviderError;
    }
}

// Export singleton instance
export const a4fClient = new A4FClient();
