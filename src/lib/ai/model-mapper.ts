// ═══════════════════════════════════════════════════════════════════════════
// MODEL MAPPER - A4F ↔ Groq Model Equivalence Mapping
// Maps A4F models to equivalent Groq models for seamless fallback
// ═══════════════════════════════════════════════════════════════════════════

import type { TaskType, ChatCompletionRequest } from './providers/provider-types';

// ═══════════════════════════════════════════════════════════════════════════
// MODEL EQUIVALENCE MAP
// ═══════════════════════════════════════════════════════════════════════════

const MODEL_EQUIVALENCE_MAP: Record<string, string> = {
    // Claude Models (Primary → Fallback)
    'provider-7/claude-opus-4-5-20251101': 'llama-3.3-70b-versatile',
    'provider-8/claude-sonnet-4.5': 'llama-3.3-70b-versatile',
    'provider-8/claude-sonnet-4-1-deep-thinking': 'deepseek-r1-distill-llama-70b',

    // Kimi Models (Thinking tasks)
    'provider-2/kimi-k2-thinking-tee': 'deepseek-r1-distill-llama-70b',
    'provider-2/kimi-k2-thinking': 'deepseek-r1-distill-llama-70b',

    // GLM Models (Chinese reasoning)
    'provider-8/glm-4.7-thinking': 'deepseek-r1-distill-llama-70b',
    'provider-8/glm-4-thinking': 'deepseek-r1-distill-llama-70b',

    // Qwen Models (General purpose)
    'provider-3/qwen-3-max': 'llama-3.3-70b-versatile',
    'provider-3/qwen-3-coder-plus': 'llama-3.1-8b-instant',
    'provider-3/qwen-3-long-context': 'llama-3.3-70b-versatile',

    // Grok Models
    'provider-3/grok-4.1-fast': 'llama-3.3-70b-versatile',
    'provider-3/grok-4.1': 'llama-3.3-70b-versatile',
};

// Task-specific routing for optimal performance
const TASK_MODEL_MAP: Record<TaskType, string> = {
    reasoning: 'deepseek-r1-distill-llama-70b',
    coding: 'llama-3.1-8b-instant',
    multimodal: 'llama-4-scout-17b-16e-instruct',
    general: 'llama-3.3-70b-versatile',
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL MAPPER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ModelMapper {
    /**
     * Map an A4F model to its Groq equivalent
     * Returns best match based on model name or task type
     */
    mapToGroq(a4fModel: string, taskType?: TaskType): string {
        // Direct mapping
        if (MODEL_EQUIVALENCE_MAP[a4fModel]) {
            return MODEL_EQUIVALENCE_MAP[a4fModel];
        }

        // Task-based mapping
        if (taskType && TASK_MODEL_MAP[taskType]) {
            return TASK_MODEL_MAP[taskType];
        }

        // Intelligent fallback based on model name patterns
        const modelLower = a4fModel.toLowerCase();

        if (modelLower.includes('thinking') || modelLower.includes('reasoning')) {
            return TASK_MODEL_MAP.reasoning;
        }

        if (modelLower.includes('coder') || modelLower.includes('code')) {
            return TASK_MODEL_MAP.coding;
        }

        if (modelLower.includes('vision') || modelLower.includes('multimodal')) {
            return TASK_MODEL_MAP.multimodal;
        }

        // Default fallback - best general model
        return TASK_MODEL_MAP.general;
    }

    /**
     * Adapt parameters from A4F format to Groq format
     * Groq uses OpenAI-compatible API, so most parameters work as-is
     */
    adaptParameters(request: ChatCompletionRequest, groqModel: string): ChatCompletionRequest {
        return {
            ...request,
            model: groqModel,

            // Groq has specific max_tokens limits per model
            max_tokens: this.adaptMaxTokens(request.max_tokens, groqModel),

            // Temperature range is same (0-2) for both
            temperature: request.temperature,

            // These are fully compatible
            top_p: request.top_p,
            frequency_penalty: request.frequency_penalty,
            presence_penalty: request.presence_penalty,
            stop: request.stop,
            stream: request.stream,
            user: request.user,
        };
    }

    /**
     * Adapt max_tokens to Groq's model-specific limits
     */
    private adaptMaxTokens(requestedTokens: number | undefined, model: string): number | undefined {
        if (!requestedTokens) return undefined;

        const MODEL_LIMITS: Record<string, number> = {
            'llama-3.3-70b-versatile': 32768,
            'llama-3.1-8b-instant': 8192,
            'deepseek-r1-distill-llama-70b': 32768,
            'llama-4-scout-17b-16e-instruct': 8192,
            'mixtral-8x7b-32768': 32768,
        };

        const limit = MODEL_LIMITS[model] || 8192;
        return Math.min(requestedTokens, limit);
    }

    /**
     * Get model capabilities for feature compatibility
     */
    getModelCapabilities(model: string): {
        supportsStreaming: boolean;
        supportsJSONMode: boolean;
        supportsFunctionCalling: boolean;
        maxContextLength: number;
    } {
        // All Groq models support streaming
        const supportsStreaming = true;

        // Model-specific capabilities
        const capabilities: Record<string, any> = {
            'llama-3.3-70b-versatile': {
                supportsJSONMode: true,
                supportsFunctionCalling: true,
                maxContextLength: 128000,
            },
            'llama-3.1-8b-instant': {
                supportsJSONMode: true,
                supportsFunctionCalling: false,
                maxContextLength: 8192,
            },
            'deepseek-r1-distill-llama-70b': {
                supportsJSONMode: true,
                supportsFunctionCalling: false,
                maxContextLength: 128000,
            },
            'llama-4-scout-17b-16e-instruct': {
                supportsJSONMode: false,
                supportsFunctionCalling: false,
                maxContextLength: 10485760, // 10M context
            },
        };

        return {
            supportsStreaming,
            ...(capabilities[model] || {
                supportsJSONMode: false,
                supportsFunctionCalling: false,
                maxContextLength: 8192,
            }),
        };
    }

    /**
     * Determine task type from request content
     * Used for intelligent routing when task type not specified
     */
    inferTaskType(request: ChatCompletionRequest): TaskType {
        const content = request.messages
            .map(m => m.content)
            .join(' ')
            .toLowerCase();

        // Check for coding-related keywords
        if (
            content.includes('code') ||
            content.includes('function') ||
            content.includes('programming') ||
            content.includes('debug') ||
            content.includes('implement')
        ) {
            return 'coding';
        }

        // Check for reasoning keywords
        if (
            content.includes('think') ||
            content.includes('reason') ||
            content.includes('analyze') ||
            content.includes('evaluate') ||
            content.includes('solve')
        ) {
            return 'reasoning';
        }

        // Check for multimodal keywords  
        if (
            content.includes('image') ||
            content.includes('vision') ||
            content.includes('picture') ||
            content.includes('photo')
        ) {
            return 'multimodal';
        }

        // Default to general
        return 'general';
    }

    /**
     * Get list of all available Groq models
     */
    getAvailableGroqModels(): string[] {
        return [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'deepseek-r1-distill-llama-70b',
            'llama-4-scout-17b-16e-instruct',
            'mixtral-8x7b-32768',
        ];
    }

    /**
     * Check if a model is Groq or A4F
     */
    isGroqModel(model: string): boolean {
        return this.getAvailableGroqModels().includes(model);
    }

    /**
     * Get recommended model for UPSC-specific tasks
     */
    getUPSCRecommendedModel(taskType: string): string {
        const UPSC_TASK_MODELS: Record<string, string> = {
            notes_generation: 'llama-3.3-70b-versatile',
            quiz_generation: 'llama-3.1-8b-instant',
            current_affairs_analysis: 'deepseek-r1-distill-llama-70b',
            answer_evaluation: 'llama-3.3-70b-versatile',
            topic_explanation: 'llama-3.3-70b-versatile',
            essay_writing: 'llama-3.3-70b-versatile',
        };

        return UPSC_TASK_MODELS[taskType] || TASK_MODEL_MAP.general;
    }
}

// Export singleton instance
export const modelMapper = new ModelMapper();
