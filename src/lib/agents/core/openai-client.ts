// src/lib/agents/core/openai-client.ts
//
// v8 LLM client. Originally OpenAI-only; now provider-aware via
// LLM_PROVIDER env (default: ollama-cloud) so chat traffic routes to
// whatever OpenAI-compatible endpoint the deployment chose. Embeddings
// are routed separately via EMBED_PROVIDER because Ollama Cloud has no
// embeddings endpoint (confirmed against live /v1/models — zero embed
// models in catalog as of 2026-04-19).
//
// Provider matrix:
//   LLM_PROVIDER=ollama-cloud  → https://ollama.com/v1 (OLLAMA_API_KEY)
//   LLM_PROVIDER=openai        → https://api.openai.com/v1 (OPENAI_API_KEY)
//   EMBED_PROVIDER=openai      → https://api.openai.com/v1 (OPENAI_API_KEY, 1536d)
//   EMBED_PROVIDER=ollama-cloud→ unsupported, throws at embed() call
//
// Keeping the filename `openai-client.ts` for import-stability. The
// contents are the provider abstraction.

import OpenAI from 'openai';

// Pricing snapshot (2026-04; update in docs/changelog when rates change).
// Ollama Cloud is flat-subscription on most models — zero marginal token
// cost, so we record model/tokens but cost=0.
const PRICE_PER_1M_TOKENS: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini':            { in: 0.15, out: 0.60 },
  'gpt-4o':                 { in: 2.50, out: 10.00 },
  'text-embedding-3-small': { in: 0.02, out: 0 },
  // Ollama Cloud — subscription-priced, surface as 0 for per-call accounting.
  'gemma4:31b-cloud':       { in: 0,    out: 0 },
  'gemma4:31b':             { in: 0,    out: 0 },
  'gemma3:27b':             { in: 0,    out: 0 },
  'qwen3-coder:480b':       { in: 0,    out: 0 },
};

type ChatProvider = 'ollama-cloud' | 'openai';
type EmbedProvider = 'ollama-cloud' | 'openai' | '9router';

function resolveChatProvider(): ChatProvider {
  return (process.env.LLM_PROVIDER as ChatProvider) || 'ollama-cloud';
}
function resolveEmbedProvider(): EmbedProvider {
  return (process.env.EMBED_PROVIDER as EmbedProvider) || '9router';
}

// Default model names. Callers may still override by passing `model` to chat().
export const DEFAULT_CHAT_MODEL =
  process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
export const STRATEGY_MODEL =
  process.env.OLLAMA_STRATEGY_MODEL || process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
// Embedding model — defaults to 9Router gemini-embedding-2-preview (3072-dim).
// v8_knowledge_chunks.embedding is vector(3072) after migration 061.
// Override with EMBED_MODEL env var; if EMBED_PROVIDER=openai, set to
// text-embedding-3-small (1536-dim) — but note schema dim lock-in.
export const EMBED_MODEL =
  process.env.EMBED_MODEL ||
  (resolveEmbedProvider() === 'openai' ? 'text-embedding-3-small' : 'gemini/gemini-embedding-2-preview');

// One client per (kind, provider) so chat and embed can point at different hosts.
let chatClient: OpenAI | null = null;
let embedClient: OpenAI | null = null;

function getChatClient(): OpenAI {
  if (chatClient) return chatClient;
  const provider = resolveChatProvider();
  if (provider === 'ollama-cloud') {
    const key = process.env.OLLAMA_API_KEY;
    if (!key) throw new Error('OLLAMA_API_KEY missing (LLM_PROVIDER=ollama-cloud).');
    chatClient = new OpenAI({
      apiKey: key,
      baseURL: process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1',
      dangerouslyAllowBrowser: true, // contract tests run in node, but next.js SSR also loads this module
    });
    return chatClient;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing (LLM_PROVIDER=openai).');
  chatClient = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  return chatClient;
}

function getEmbedClient(): OpenAI {
  if (embedClient) return embedClient;
  const provider = resolveEmbedProvider();
  if (provider === 'ollama-cloud') {
    throw new Error(
      'Ollama Cloud does not provide embeddings. Set EMBED_PROVIDER=9router ' +
      '(or openai) in .env.coolify. See phase-1-scope-pull.md.',
    );
  }
  if (provider === '9router') {
    const key = process.env.NINEROUTER_EMBED_API_KEY;
    if (!key) throw new Error('NINEROUTER_EMBED_API_KEY missing (EMBED_PROVIDER=9router).');
    embedClient = new OpenAI({
      apiKey: key,
      baseURL: process.env.NINEROUTER_EMBED_BASE_URL || 'https://9router.aimasteryedu.in/v1',
      dangerouslyAllowBrowser: true,
    });
    return embedClient;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY missing — required for embeddings (EMBED_PROVIDER=openai). ' +
      'See phase-1-scope-pull.md for embedding-provider alternatives.',
    );
  }
  embedClient = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  return embedClient;
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
  const res = await getChatClient().chat.completions.create({
    model: call.model,
    max_tokens: call.maxTokens ?? 800,
    response_format: call.jsonMode ? { type: 'json_object' } : undefined,
    messages: [
      ...(call.system ? [{ role: 'system' as const, content: call.system }] : []),
      { role: 'user' as const, content: call.prompt },
    ],
  });
  let text = res.choices[0]?.message?.content ?? '';
  // Gemma-family models (via Ollama Cloud) honor response_format:json_object
  // loosely — they often wrap JSON in ```json ... ``` fences. Strip them so
  // callers can JSON.parse() without each re-implementing the unwrap.
  if (call.jsonMode && text) {
    // Try closed fence first; fall back to opening-fence-only (max_tokens
    // truncation often eats the trailing ```).
    const closed = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (closed) {
      text = closed[1].trim();
    } else {
      const openOnly = text.match(/```(?:json)?\s*([\s\S]*)$/);
      if (openOnly) text = openOnly[1].trim();
      else text = text.trim();
    }
    // Final defensive pass: if text doesn't start with { or [, clip to the
    // first such char. Some Gemma outputs prepend a brief natural-language
    // preamble even in JSON mode.
    const firstBrace = text.search(/[\{\[]/);
    if (firstBrace > 0) text = text.slice(firstBrace);
  }
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
  const provider = resolveEmbedProvider();
  // 9Router's gemini-embedding-2-preview only honors `dimensions` via raw
  // HTTP — the OpenAI SDK silently drops the param for models it doesn't
  // recognise. Ship a direct fetch path so we reliably get 3072-dim vectors
  // matching the v8_knowledge_chunks schema (migration 061).
  let res: any;
  if (provider === '9router') {
    const baseUrl = process.env.NINEROUTER_EMBED_BASE_URL || 'https://9router.aimasteryedu.in/v1';
    const apiKey = process.env.NINEROUTER_EMBED_API_KEY;
    if (!apiKey) throw new Error('NINEROUTER_EMBED_API_KEY missing (EMBED_PROVIDER=9router).');
    const httpRes = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts, dimensions: 3072 }),
    });
    if (!httpRes.ok) throw new Error(`9router embed failed: ${httpRes.status} ${await httpRes.text()}`);
    res = await httpRes.json();
  } else {
    res = await getEmbedClient().embeddings.create({
      model: EMBED_MODEL,
      input: texts,
    });
  }
  const vectors = res.data.map((d) => d.embedding);
  const tokensIn = res.usage?.prompt_tokens ?? 0;
  const p = PRICE_PER_1M_TOKENS[EMBED_MODEL] ?? { in: 0, out: 0 };
  const costUsd = (tokensIn * p.in) / 1_000_000;
  return { vectors, tokensIn, costUsd, model: EMBED_MODEL };
}

// Test-only: reset cached clients so env swaps between tests are honored.
export function __resetClientsForTest() { chatClient = null; embedClient = null; }
