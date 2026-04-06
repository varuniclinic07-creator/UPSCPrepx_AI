import { a4fClient, A4F_MODELS, type A4FModel } from './a4f-client';
import { waitForRateLimit } from './rate-limiter';

export interface GenerateOptions {
  model?: A4FModel;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  userId?: string;
}

/**
 * Generate text using A4F API
 * Automatically handles rate limiting
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    model = A4F_MODELS.GROK_FAST,
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = 'You are a helpful UPSC exam preparation assistant. Write in simple, clear language that is easy to understand.',
    userId = 'global',
  } = options;

  // Wait for rate limit (provider, userId)
  await waitForRateLimit('a4f', userId);

  try {
    const response = await a4fClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[AI Generate] Error:', error);

    // Check if rate limit error
    if (error instanceof Error && error.message.includes('rate')) {
      throw new Error('AI service rate limit exceeded. Please try again in a minute.');
    }

    throw new Error('Failed to generate content. Please try again.');
  }
}

/**
 * Generate text with thinking/reasoning model
 * Use for complex tasks that require deep analysis
 */
export async function generateWithThinking(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    model: A4F_MODELS.KIMI_THINKING,
    maxTokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.3,
  });
}

/**
 * Generate text with research model
 * Use for tasks requiring web-grounded information
 */
export async function generateWithResearch(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    model: A4F_MODELS.SONAR_REASONING,
    maxTokens: options.maxTokens || 3000,
  });
}

/**
 * Generate image using A4F API
 */
export async function generateImage(
  prompt: string,
  userId: string = 'global'
): Promise<string> {
  await waitForRateLimit('a4f', userId);

  try {
    const response = await a4fClient.images.generate({
      model: A4F_MODELS.FLUX_SCHNELL,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    console.error('[AI Image] Error:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
}

/**
 * Stream text generation
 * Use for real-time display of AI responses
 */
export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: GenerateOptions = {}
): Promise<void> {
  const {
    model = A4F_MODELS.GROK_FAST,
    maxTokens = 2000,
    systemPrompt = 'You are a helpful UPSC exam preparation assistant.',
    userId = 'global',
  } = options;

  await waitForRateLimit('a4f', userId);

  try {
    const stream = await a4fClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('[AI Stream] Error:', error);
    throw new Error('Failed to stream content. Please try again.');
  }
}

/**
 * Parse JSON from AI response
 * Handles common formatting issues
 */
export function parseAIJson<T>(response: string): T | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[AI Parse] No JSON found in response');
      return null;
    }

    // Clean up common issues
    const jsonStr = jsonMatch[0]
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('[AI Parse] Failed to parse JSON:', error);
    return null;
  }
}