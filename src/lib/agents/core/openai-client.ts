// src/lib/agents/core/openai-client.ts
// Shared OpenAI client with cost tracking per call.
import OpenAI from 'openai';

// Pricing snapshot (2026-04; update in docs/changelog when rates change).
const PRICE_PER_1M_TOKENS: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.60 },
  'gpt-4o':      { in: 2.50, out: 10.00 },
  'text-embedding-3-small': { in: 0.02, out: 0 },
};

export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';
export const STRATEGY_MODEL = 'gpt-4o';
export const EMBED_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export interface ChatCall {
  model: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  model: string;
}

export async function chat(call: ChatCall): Promise<ChatResult> {
  const res = await getClient().chat.completions.create({
    model: call.model,
    max_tokens: call.maxTokens ?? 800,
    response_format: call.jsonMode ? { type: 'json_object' } : undefined,
    messages: [
      ...(call.system ? [{ role: 'system' as const, content: call.system }] : []),
      { role: 'user' as const, content: call.prompt },
    ],
  });
  const text = res.choices[0]?.message?.content ?? '';
  const tokensIn = res.usage?.prompt_tokens ?? 0;
  const tokensOut = res.usage?.completion_tokens ?? 0;
  const p = PRICE_PER_1M_TOKENS[call.model] ?? { in: 0, out: 0 };
  const costUsd = (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
  return { text, tokensIn, tokensOut, costUsd, model: call.model };
}

export async function embed(texts: string[]): Promise<{
  vectors: number[][];
  tokensIn: number;
  costUsd: number;
  model: string;
}> {
  if (texts.length === 0) return { vectors: [], tokensIn: 0, costUsd: 0, model: EMBED_MODEL };
  const res = await getClient().embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  const vectors = res.data.map((d) => d.embedding);
  const tokensIn = res.usage?.prompt_tokens ?? 0;
  const p = PRICE_PER_1M_TOKENS[EMBED_MODEL] ?? { in: 0, out: 0 };
  const costUsd = (tokensIn * p.in) / 1_000_000;
  return { vectors, tokensIn, costUsd, model: EMBED_MODEL };
}
