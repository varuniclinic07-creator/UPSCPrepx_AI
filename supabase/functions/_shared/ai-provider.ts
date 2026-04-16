/**
 * Shared AI Provider — callAI() with 6-provider fallback chain + multi-key rotation
 * Priority: Ollama → Groq → 9Router → NVIDIA → Kilo → OpenCode
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
  keys: string[];
  models: string[];
  timeout: number;
}

// Round-robin state (persists across calls within the same edge function invocation)
const keyIndexes: Record<string, number> = {};
const modelIndexes: Record<string, number> = {};

function getNextKey(provider: string, keys: string[]): string {
  if (keys.length === 0) return '';
  const idx = keyIndexes[provider] || 0;
  const key = keys[idx % keys.length];
  keyIndexes[provider] = (idx + 1) % keys.length;
  return key;
}

function getNextModel(provider: string, models: string[]): string {
  const idx = modelIndexes[provider] || 0;
  return models[idx % models.length];
}

function cycleModel(provider: string, models: string[]): void {
  const idx = modelIndexes[provider] || 0;
  modelIndexes[provider] = (idx + 1) % models.length;
}

/** Reject placeholder/dummy keys */
function isRealKey(key: string | undefined | null): boolean {
  if (!key || key.trim() === '') return false;
  const lower = key.toLowerCase();
  return !(
    lower === 'placeholder' ||
    lower.startsWith('replace_with') ||
    lower.startsWith('your_') ||
    lower.startsWith('placeholder') ||
    lower === 'test' ||
    lower === 'dummy'
  );
}

/** Collect all real keys for a provider from env vars */
function collectKeys(prefix: string, maxKeys: number): string[] {
  const keys: string[] = [];
  // Try numbered keys first: PREFIX_1, PREFIX_2, ...
  for (let i = 1; i <= maxKeys; i++) {
    const key = Deno.env.get(`${prefix}_${i}`);
    if (isRealKey(key)) keys.push(key!);
  }
  // If no numbered keys, try single key: PREFIX
  if (keys.length === 0) {
    const single = Deno.env.get(prefix);
    if (isRealKey(single)) keys.push(single!);
  }
  return keys;
}

function getProviders(): ProviderConfig[] {
  return [
    // Priority 1: Ollama Cloud
    {
      name: 'ollama',
      baseUrl: Deno.env.get('OLLAMA_BASE_URL') || 'https://ollama.com/v1',
      keys: collectKeys('OLLAMA_API_KEY', 4),
      models: [
        Deno.env.get('OLLAMA_MODEL') || 'qwen3.5:397b-cloud',
      ],
      timeout: 45000,
    },
    // Priority 2: Groq (6-key rotation)
    {
      name: 'groq',
      baseUrl: Deno.env.get('GROQ_BASE_URL') || 'https://api.groq.com/openai/v1',
      keys: collectKeys('GROQ_API_KEY', 7),
      models: [
        Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile',
      ],
      timeout: 15000,
    },
    // Priority 3: 9Router
    {
      name: '9router',
      baseUrl: Deno.env.get('NINE_ROUTER_BASE_URL') || 'https://9router.aimasteryedu.in/v1',
      keys: collectKeys('NINE_ROUTER_API_KEY', 4),
      models: [
        Deno.env.get('NINE_ROUTER_MODEL') || 'kr/claude-sonnet-4.5',
      ],
      timeout: 30000,
    },
    // Priority 4: NVIDIA NIM (multi-model fallback)
    {
      name: 'nvidia',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      keys: collectKeys('NVIDIA_API_KEY', 4),
      models: [
        'moonshotai/kimi-k2.5',
        'qwen/qwen3.5-397b-a17b',
        'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        'mistralai/mistral-large-3-675b-instruct-2512',
      ],
      timeout: 30000,
    },
    // Priority 5: Kilo AI (4-key rotation, 5-model fallback)
    {
      name: 'kilo',
      baseUrl: Deno.env.get('KILO_API_BASE_URL') || 'https://api.kilo.ai/api/gateway',
      keys: collectKeys('KILO_API_KEY', 4),
      models: [
        'bytedance-seed/dola-seed-2.0-pro:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'x-ai/grok-code-fast-1:optimized:free',
        'kilo-auto/free',
        'openrouter/free',
      ],
      timeout: 30000,
    },
    // Priority 6: OpenCode (self-hosted, multi-model fallback)
    {
      name: 'opencode',
      baseUrl: Deno.env.get('OPENCODE_API_BASE_URL') || 'http://localhost:3100',
      keys: collectKeys('OPENCODE_API_KEY', 4),
      models: [
        'opencode zen/Big Pickle',
        'go/MiniMax M2.7',
        'Nemotron 3 Super Free',
        'MiniMax M2.5 Free',
        'Nvidia/Kimi K2.5',
        'Nvidia/Qwen3.5-397B-A17B',
        'Nvidia/Llama 3.3 Nemotron Super 49b V1.5',
        'Nvidia/Mistral Large 3 675B Instruct 2512',
        'Nvidia/GLM-4.7',
        'Nvidia/GLM5',
        'Nvidia/DeepSeek V3.1 Terminus',
        'Nvidia/GPT-OSS-120B',
        'Nvidia/Step 3.5 Flash',
      ],
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
  const errors: string[] = [];

  for (const provider of providers) {
    if (provider.keys.length === 0) continue;

    // For providers with multiple models, try each model before moving to next provider
    const modelsToTry = provider.models.length > 1 ? provider.models.length : 1;

    for (let modelAttempt = 0; modelAttempt < modelsToTry; modelAttempt++) {
      const apiKey = getNextKey(provider.name, provider.keys);
      const model = getNextModel(provider.name, provider.models);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

        console.info(`[callAI] Trying ${provider.name} (model: ${model}, key: ${apiKey.slice(0, 8)}...)`);

        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errMsg = `${provider.name}/${model}: ${response.status} ${response.statusText}`;
          console.error(`[callAI] ${errMsg}`);
          errors.push(errMsg);
          // Cycle to next model for multi-model providers
          if (provider.models.length > 1) cycleModel(provider.name, provider.models);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        console.info(`[callAI] SUCCESS via ${provider.name}/${model} (${content.length} chars)`);
        return content;
      } catch (error) {
        const errMsg = `${provider.name}/${model}: ${error}`;
        console.error(`[callAI] ${errMsg}`);
        errors.push(errMsg);
        if (provider.models.length > 1) cycleModel(provider.name, provider.models);
        continue;
      }
    }
  }

  throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
}
