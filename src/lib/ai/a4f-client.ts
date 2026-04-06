import OpenAI from 'openai';

// ═══════════════════════════════════════════════════════════════════════════
// A4F CLIENT - Lazy Initialization
// CRITICAL: Client is created lazily to avoid crashes during build
// ═══════════════════════════════════════════════════════════════════════════

let _a4fClient: OpenAI | null = null;

/**
 * Get A4F client with lazy initialization
 * This prevents crashes during Next.js build when env vars are not available
 */
export function getA4FClient(): OpenAI {
  if (!_a4fClient) {
    const apiKey = process.env.A4F_API_KEY;
    const baseURL = process.env.A4F_BASE_URL || 'https://api.a4f.co/v1';

    if (!apiKey) {
      console.error('[A4F Client] A4F_API_KEY not configured!');
      // Return a mock client that will throw meaningful errors
      throw new Error('A4F_API_KEY environment variable is not configured');
    }

    _a4fClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }
  return _a4fClient;
}

// For backwards compatibility - but this is lazy now
export const a4fClient = {
  get chat() {
    return getA4FClient().chat;
  },
  get images() {
    return getA4FClient().images;
  },
};

/**
 * Available models on A4F platform
 * IMPORTANT: Respect 10 RPM rate limit!
 */
export const A4F_MODELS = {
  // Fast models - for quick responses
  GROK_FAST: 'provider-3/grok-4.1-fast',
  GEMINI_FLASH: 'provider-1/gemini-2.5-flash-preview-05-20',

  // Thinking/reasoning models - for complex tasks
  KIMI_THINKING: 'provider-2/kimi-k2-thinking-tee',
  GEMINI_THINKING: 'provider-1/gemini-2.5-flash-preview-04-17-thinking',

  // Research models - for comprehensive research
  SONAR_REASONING: 'provider-3/sonar-reasoning-pro',
  SONAR_PRO: 'provider-3/sonar-pro',

  // Embedding models
  QWEN_EMBEDDING: 'provider-5/qwen3-embedding-8b',

  // Image generation
  FLUX_SCHNELL: 'provider-3/FLUX.1-schnell',
  FLUX_DEV: 'provider-3/FLUX.1-dev',

  // Text-to-speech
  GEMINI_TTS: 'provider-3/gemini-2.5-flash-preview-tts',

  // Video generation
  WAN_VIDEO: 'provider-6/wan-2.1',
} as const;

export type A4FModel = (typeof A4F_MODELS)[keyof typeof A4F_MODELS];

/**
 * Model selection based on task type
 */
export function selectModel(
  task: 'fast' | 'thinking' | 'research' | 'embedding' | 'image'
): A4FModel {
  switch (task) {
    case 'fast':
      return A4F_MODELS.GROK_FAST;
    case 'thinking':
      return A4F_MODELS.KIMI_THINKING;
    case 'research':
      return A4F_MODELS.SONAR_REASONING;
    case 'embedding':
      return A4F_MODELS.QWEN_EMBEDDING;
    case 'image':
      return A4F_MODELS.FLUX_SCHNELL;
    default:
      return A4F_MODELS.GROK_FAST;
  }
}

/**
 * Model info for display
 */
export const MODEL_INFO: Record<string, { name: string; description: string }> = {
  [A4F_MODELS.GROK_FAST]: {
    name: 'Grok Fast',
    description: 'Quick responses for simple tasks',
  },
  [A4F_MODELS.KIMI_THINKING]: {
    name: 'Kimi Thinking',
    description: 'Deep reasoning for complex problems',
  },
  [A4F_MODELS.SONAR_REASONING]: {
    name: 'Sonar Research',
    description: 'Web-grounded research and analysis',
  },
  [A4F_MODELS.FLUX_SCHNELL]: {
    name: 'FLUX Image',
    description: 'Fast image generation',
  },
};