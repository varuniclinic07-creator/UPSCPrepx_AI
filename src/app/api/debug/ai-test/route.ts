/**
 * AI Provider Debug Endpoint — /api/debug/ai-test
 *
 * Tests each AI provider individually and returns detailed status.
 * Protected by CRON_SECRET in production.
 *
 * GET  /api/debug/ai-test           — test all providers
 * GET  /api/debug/ai-test?provider=groq — test specific provider
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ProviderTestResult {
  provider: string;
  status: 'ok' | 'error' | 'skipped';
  responseTime?: number;
  model?: string;
  response?: string;
  error?: string;
  keyInfo?: string;
}

async function testProvider(
  name: string,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<ProviderTestResult> {
  if (!apiKey) {
    return { provider: name, status: 'skipped', error: 'No API key configured' };
  }
  const start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a test assistant. Be very brief.' },
          { role: 'user', content: 'Respond with exactly: UPSC_AI_PROVIDER_OK' },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      const body = await response.text();
      return {
        provider: name,
        status: 'error',
        responseTime: elapsed,
        model,
        error: `HTTP ${response.status}: ${body.slice(0, 300)}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '(empty)';

    return {
      provider: name,
      status: 'ok',
      responseTime: elapsed,
      model,
      response: content.slice(0, 200),
      keyInfo: `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`,
    };
  } catch (err: any) {
    return {
      provider: name,
      status: 'error',
      responseTime: Date.now() - start,
      model,
      error: err?.message || 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  // Optional auth: if CRON_SECRET is set, require it; otherwise open for debugging
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized. Pass header: Authorization: Bearer <CRON_SECRET>' }, { status: 401 });
    }
  }

  const url = new URL(request.url);
  const targetProvider = url.searchParams.get('provider'); // Optional: test single provider

  const results: ProviderTestResult[] = [];

  // Groq — round-robin keys
  const groqKeys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7,
  ].filter(k => k && !k.startsWith('REPLACE'));
  const groqKey = groqKeys[0] || process.env.GROQ_API_KEY || '';

  const providers = [
    {
      name: 'groq',
      baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    },
    {
      name: 'kilo',
      baseUrl: (process.env.KILO_API_BASE_URL || 'https://api.kilo.ai/api/gateway'),
      apiKey: process.env.KILO_API_KEY_1 || '',
      model: process.env.KILO_MODEL || 'bytedance-seed/dola-seed-2.0-pro:free',
    },
    {
      name: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1',
      apiKey: process.env.OLLAMA_API_KEY || '',
      model: process.env.OLLAMA_MODEL || 'qwen3.5:397b-cloud',
    },
    {
      name: 'opencode',
      baseUrl: process.env.OPENCODE_API_BASE_URL || 'http://localhost:3100',
      apiKey: process.env.OPENCODE_API_KEY || '',
      model: process.env.OPENCODE_MODEL || 'opencode zen/Big Pickle',
    },
    {
      name: 'nvidia',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY || '',
      model: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct',
    },
    {
      name: 'gemini',
      baseUrl: '', // Uses adapter, not direct
      apiKey: process.env.GEMINI_API_KEY_1 || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
  ];

  for (const p of providers) {
    if (targetProvider && p.name !== targetProvider) continue;

    // Skip gemini (uses adapter, not standard endpoint)
    if (p.name === 'gemini') {
      if (!p.apiKey || p.apiKey.startsWith('REPLACE')) {
        results.push({ provider: 'gemini', status: 'skipped', error: 'No real API key' });
      } else {
        // Test via Google's generative API
        results.push({ provider: 'gemini', status: 'skipped', error: 'Uses GeminiAdapter — test via /api/ai/health' });
      }
      continue;
    }

    results.push(await testProvider(p.name, p.baseUrl, p.apiKey, p.model));
  }

  const working = results.filter(r => r.status === 'ok').length;
  const total = results.filter(r => r.status !== 'skipped').length;

  // Environment debug info
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    GROQ_KEYS_CONFIGURED: groqKeys.length,
    KILO_KEYS_CONFIGURED: [
      process.env.KILO_API_KEY_1,
      process.env.KILO_API_KEY_2,
      process.env.KILO_API_KEY_3,
      process.env.KILO_API_KEY_4,
    ].filter(k => k && !k.startsWith('REPLACE')).length,
    OLLAMA_KEY_SET: Boolean(process.env.OLLAMA_API_KEY && process.env.OLLAMA_API_KEY !== 'placeholder'),
    NVIDIA_KEY_SET: Boolean(process.env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY?.startsWith('REPLACE')),
    GEMINI_KEYS_SET: [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
    ].filter(k => k && !k.startsWith('REPLACE')).length,
    OPENCODE_URL: process.env.OPENCODE_API_BASE_URL || 'not set',
  };

  return NextResponse.json({
    summary: `${working}/${total} providers working`,
    timestamp: new Date().toISOString(),
    environment: envInfo,
    results,
  });
}
