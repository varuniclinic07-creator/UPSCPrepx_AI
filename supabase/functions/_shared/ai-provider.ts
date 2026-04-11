/**
 * Shared AI Provider — callAI() with 3-provider fallback chain
 * v8 Spec: 9Router → Groq → Ollama
 * EVERY Edge Function MUST use callAI(). Never call providers directly.
 */

import { SIMPLIFIED_LANGUAGE_PROMPT } from './simplified-lang.ts';

interface CallAIOptions {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  skipSimplifiedLanguage?: boolean;
}

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}

function getProviders(): ProviderConfig[] {
  return [
    {
      name: '9router',
      baseUrl: Deno.env.get('NINE_ROUTER_BASE_URL') || 'https://rq9whnn.9router.com/v1',
      apiKey: Deno.env.get('NINE_ROUTER_API_KEY') || Deno.env.get('NINEROUTER_API_KEY') || '',
      model: Deno.env.get('NINE_ROUTER_MODEL') || 'kr/claude-sonnet-4.5',
      timeout: 30000,
    },
    {
      name: 'groq',
      baseUrl: Deno.env.get('GROQ_BASE_URL') || 'https://api.groq.com/openai/v1',
      apiKey: Deno.env.get('GROQ_API_KEY') || '',
      model: Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile',
      timeout: 15000,
    },
    {
      name: 'ollama',
      baseUrl: Deno.env.get('OLLAMA_BASE_URL') || '',
      apiKey: Deno.env.get('OLLAMA_API_KEY') || '',
      model: Deno.env.get('OLLAMA_MODEL') || 'llama3.1:8b',
      timeout: 45000,
    },
  ];
}

export async function callAI(
  promptOrOptions: string | CallAIOptions,
  options?: { temperature?: number; maxTokens?: number; system?: string; skipSimplifiedLanguage?: boolean }
): Promise<string> {
  let messages: Array<{ role: string; content: string }>;
  let temperature: number;
  let maxTokens: number;
  let skipSimplified = false;

  if (typeof promptOrOptions === 'string') {
    skipSimplified = options?.skipSimplifiedLanguage ?? false;
    const baseSystem = options?.system || 'You are an expert UPSC CSE educator.';
    messages = [
      { role: 'system', content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}` },
      { role: 'user', content: promptOrOptions },
    ];
    temperature = options?.temperature ?? 0.7;
    maxTokens = options?.maxTokens ?? 2000;
  } else {
    skipSimplified = promptOrOptions.skipSimplifiedLanguage ?? false;
    const baseSystem = promptOrOptions.system || 'You are an expert UPSC CSE educator.';
    if (promptOrOptions.messages) {
      messages = [...promptOrOptions.messages];
      if (!skipSimplified) {
        const sysIdx = messages.findIndex(m => m.role === 'system');
        if (sysIdx >= 0) {
          messages[sysIdx] = { ...messages[sysIdx], content: `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${messages[sysIdx].content}` };
        } else {
          messages.unshift({ role: 'system', content: SIMPLIFIED_LANGUAGE_PROMPT });
        }
      }
    } else {
      messages = [
        { role: 'system', content: skipSimplified ? baseSystem : `${SIMPLIFIED_LANGUAGE_PROMPT}\n\n${baseSystem}` },
        { role: 'user', content: promptOrOptions.prompt || '' },
      ];
    }
    temperature = promptOrOptions.temperature ?? 0.7;
    maxTokens = promptOrOptions.maxTokens ?? 2000;
  }

  const providers = getProviders();

  for (const provider of providers) {
    if (!provider.apiKey) continue;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`${provider.name}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error(`callAI: ${provider.name} failed:`, error);
      continue;
    }
  }

  throw new Error('All AI providers failed');
}
