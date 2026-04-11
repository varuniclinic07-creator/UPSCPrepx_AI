/**
 * AI Generation Utilities
 * Uses callAI() with 9Router → Groq → Ollama fallback chain
 */

import { callAI } from './ai-provider-client';

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  userId?: string;
}

/**
 * Generate text using the AI provider chain
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = 'You are a helpful UPSC exam preparation assistant. Write in simple, clear language that is easy to understand.',
  } = options;

  return callAI(prompt, {
    system: systemPrompt,
    maxTokens,
    temperature,
  });
}

/**
 * Generate text with deep reasoning
 * Uses higher token limit and lower temperature for analytical tasks
 */
export async function generateWithThinking(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    maxTokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.3,
    systemPrompt: options.systemPrompt || 'You are an expert UPSC analyst. Think step by step. Provide thorough, well-reasoned analysis.',
  });
}

/**
 * Generate text with research context
 * For tasks requiring comprehensive information
 */
export async function generateWithResearch(
  prompt: string,
  options: Omit<GenerateOptions, 'model'> = {}
): Promise<string> {
  return generateText(prompt, {
    ...options,
    maxTokens: options.maxTokens || 3000,
    systemPrompt: options.systemPrompt || 'You are a UPSC research assistant. Provide comprehensive, well-sourced, up-to-date information.',
  });
}

/**
 * Generate image (placeholder — image generation requires dedicated service)
 */
export async function generateImage(
  prompt: string,
  _userId: string = 'global'
): Promise<string> {
  console.warn('[AI Image] Image generation not yet connected to new provider chain');
  return '';
}

/**
 * Stream text generation using callAI
 * Note: Currently buffers full response then calls onChunk once.
 * True streaming will be added via callAIStream().
 */
export async function streamText(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: GenerateOptions = {}
): Promise<void> {
  const result = await generateText(prompt, options);
  onChunk(result);
}

/**
 * Parse JSON from AI response
 * Handles common formatting issues (markdown fences, extra whitespace)
 */
export function parseAIJson<T>(response: string): T | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[AI Parse] No JSON found in response');
      return null;
    }

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
