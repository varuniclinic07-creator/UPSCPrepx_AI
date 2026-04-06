// 🚀 QUICK START: AI Provider Router Implementation
// Copy this into Google Antigravity IDE and follow the steps

// ============================================================================
// STEP 1: Update .env.local with these variables
// ============================================================================

/*
# AI Provider Configuration
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1/
A4F_RATE_LIMIT_RPM=10

GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_RATE_LIMIT_RPM=30

# Redis (already configured)
REDIS_URL=redis://89.117.60.144:6379

# Features
ENABLE_AI_ROUTING=true
ENABLE_GROQ_FALLBACK=true
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000
*/

// ============================================================================
// STEP 2: Install dependencies
// ============================================================================

/*
npm install openai
npm install ioredis
npm install p-retry
npm install p-queue
*/

// ============================================================================
// STEP 3: Create Type Definitions (src/types/ai-providers.ts)
// ============================================================================

export type AIProvider = 'a4f' | 'groq';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
  provider?: AIProvider; // Force specific provider
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider: AIProvider;
  fallbackUsed: boolean;
  latencyMs: number;
}

export interface ProviderHealth {
  isHealthy: boolean;
  remainingRequests: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastError?: string;
}

export interface RouteDecision {
  provider: AIProvider;
  model: string;
  reason: string;
  fallbackChain?: AIProvider[];
}

// ============================================================================
// STEP 4: Model Mapper (src/lib/ai/model-mapper.ts)
// ============================================================================

export class ModelMapper {
  private static readonly MODEL_MAP: Record<string, string> = {
    // A4F Models → Groq Equivalents
    'provider-7/claude-opus-4-5-20251101': 'llama-3.3-70b-versatile',
    'provider-8/claude-sonnet-4.5': 'llama-3.3-70b-versatile',
    'provider-2/kimi-k2-thinking-tee': 'deepseek-r1-distill-llama-70b',
    'provider-8/glm-4.6v-thinking': 'deepseek-r1-distill-llama-70b',
    'provider-8/glm-4.7-thinking': 'deepseek-r1-distill-llama-70b',
    'provider-2/glm-4.7-tee': 'deepseek-r1-distill-llama-70b',
    'provider-3/qwen-3-max': 'llama-3.3-70b-versatile',
    'provider-3/qwen-3-coder': 'llama-3.1-8b-instant',
    'provider-3/qwen-3-coder-plus': 'llama-3.1-8b-instant',
    'provider-3/llama-4-scout': 'llama-4-scout-17b-16e-instruct',
    'provider-8/nano-banana-pro': 'llama-3.1-8b-instant',
    
    // Default fallback
    'default': 'llama-3.3-70b-versatile',
  };

  static mapToGroq(a4fModel: string): string {
    return this.MODEL_MAP[a4fModel] || this.MODEL_MAP['default'];
  }

  static isReasoningModel(model: string): boolean {
    const reasoningKeywords = ['thinking', 'kimi', 'reasoning', 'deepseek'];
    return reasoningKeywords.some(keyword => model.toLowerCase().includes(keyword));
  }

  static isCodingModel(model: string): boolean {
    return model.toLowerCase().includes('coder');
  }

  static adaptTemperature(temp: number, _fromProvider: AIProvider, toProvider: AIProvider): number {
    // Groq DeepSeek works best with 0.5-0.7 temperature
    if (toProvider === 'groq' && temp > 0.7) {
      return 0.7;
    }
    return temp;
  }
}

// ============================================================================
// STEP 5: Rate Limiter with Redis (src/lib/ai/rate-limiter.ts)
// ============================================================================

import Redis from 'ioredis';

export class DistributedRateLimiter {
  private redis: Redis;
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async checkLimit(provider: AIProvider, _userId?: string): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const windowStart = now - windowMs;
    
    const key = `ai:ratelimit:${provider}:global`;
    const limit = provider === 'a4f' ? 10 : 30;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const current = await this.redis.zcard(key);
    
    const allowed = current < limit;
    const resetAt = new Date(now + windowMs);
    
    return {
      allowed,
      remainingRequests: Math.max(0, limit - current),
      resetAt,
    };
  }

  async consumeToken(provider: AIProvider, requestId: string): Promise<void> {
    const now = Date.now();
    const key = `ai:ratelimit:${provider}:global`;
    
    // Add request to sorted set with timestamp
    await this.redis.zadd(key, now, requestId);
    
    // Set expiry to prevent memory bloat
    await this.redis.expire(key, 120); // 2 minutes
  }

  async trackConcurrent(provider: AIProvider, delta: number): Promise<number> {
    const key = `ai:concurrent:${provider}`;
    const result = await this.redis.incrby(key, delta);
    await this.redis.expire(key, 300); // 5 minutes
    return result;
  }

  async getConcurrentCount(provider: AIProvider): Promise<number> {
    const key = `ai:concurrent:${provider}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// ============================================================================
// STEP 6: Circuit Breaker (src/lib/ai/circuit-breaker.ts)
// ============================================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = 0;
  
  constructor(private config: CircuitBreakerConfig, private provider: AIProvider) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.provider}`);
      }
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        console.log(`Circuit breaker CLOSED for ${this.provider}`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.timeout;
      console.error(`Circuit breaker OPEN for ${this.provider}, retry at ${new Date(this.nextAttempt)}`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = 0;
  }
}

// ============================================================================
// STEP 7: Provider Clients (src/lib/ai/providers/a4f-client.ts)
// ============================================================================

import OpenAI from 'openai';

export class A4FClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.A4F_API_KEY!,
      baseURL: process.env.A4F_BASE_URL!,
    });
  }

  async chatCompletion(request: ChatRequest): Promise<any> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2000,
        stream: false,
      });

      return {
        ...response,
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('A4F API Error:', error.message);
      throw error;
    }
  }

  async *streamChatCompletion(request: ChatRequest): AsyncGenerator<any> {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

// ============================================================================
// STEP 8: Groq Client (src/lib/ai/providers/groq-client.ts)
// ============================================================================

export class GroqClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: process.env.GROQ_BASE_URL!,
    });
  }

  async chatCompletion(request: ChatRequest, mappedModel: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Adapt temperature for Groq
      const temperature = ModelMapper.adaptTemperature(
        request.temperature ?? 0.7,
        'a4f',
        'groq'
      );

      const response = await this.client.chat.completions.create({
        model: mappedModel,
        messages: request.messages,
        temperature,
        max_tokens: request.max_tokens ?? 2000,
        stream: false,
      });

      return {
        ...response,
        latencyMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('Groq API Error:', error.message);
      throw error;
    }
  }

  async *streamChatCompletion(request: ChatRequest, mappedModel: string): AsyncGenerator<any> {
    const temperature = ModelMapper.adaptTemperature(
      request.temperature ?? 0.7,
      'a4f',
      'groq'
    );

    const stream = await this.client.chat.completions.create({
      model: mappedModel,
      messages: request.messages,
      temperature,
      max_tokens: request.max_tokens ?? 2000,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

// ============================================================================
// STEP 9: Main Provider Router (src/lib/ai/provider-router.ts)
// ============================================================================

import { v4 as uuidv4 } from 'uuid';

export class AIProviderRouter {
  private rateLimiter: DistributedRateLimiter;
  private a4fCircuit: CircuitBreaker;
  private groqCircuit: CircuitBreaker;
  private a4fClient: A4FClient;
  private groqClient: GroqClient;

  constructor() {
    this.rateLimiter = new DistributedRateLimiter(process.env.REDIS_URL!);
    
    const circuitConfig = {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD ?? '5'),
      successThreshold: 2,
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT ?? '30000'),
    };
    
    this.a4fCircuit = new CircuitBreaker(circuitConfig, 'a4f');
    this.groqCircuit = new CircuitBreaker(circuitConfig, 'groq');
    
    this.a4fClient = new A4FClient();
    this.groqClient = new GroqClient();
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const requestId = uuidv4();
    const decision = await this.decideProvider(request);
    
    console.log(`[Router] Using ${decision.provider} for request ${requestId}: ${decision.reason}`);

    try {
      if (decision.provider === 'a4f') {
        return await this.routeToA4F(request, requestId);
      } else {
        return await this.routeToGroq(request, requestId, decision.model);
      }
    } catch (error: any) {
      // If primary fails and we haven't tried fallback, try fallback
      if (decision.provider === 'a4f' && process.env.ENABLE_GROQ_FALLBACK === 'true') {
        console.log(`[Router] A4F failed, falling back to Groq`);
        const groqModel = ModelMapper.mapToGroq(request.model);
        return await this.routeToGroq(request, requestId, groqModel, true);
      }
      throw error;
    }
  }

  private async decideProvider(request: ChatRequest): Promise<RouteDecision> {
    // If provider forced, use it
    if (request.provider) {
      return {
        provider: request.provider,
        model: request.provider === 'groq' 
          ? ModelMapper.mapToGroq(request.model)
          : request.model,
        reason: 'Provider forced by request',
      };
    }

    // Check A4F rate limit
    const a4fLimit = await this.rateLimiter.checkLimit('a4f', request.userId);
    
    if (a4fLimit.allowed && this.a4fCircuit.getState() !== 'OPEN') {
      return {
        provider: 'a4f',
        model: request.model,
        reason: 'A4F available within rate limits',
        fallbackChain: ['groq'],
      };
    }

    // Fall back to Groq
    const groqModel = ModelMapper.mapToGroq(request.model);
    return {
      provider: 'groq',
      model: groqModel,
      reason: a4fLimit.allowed 
        ? 'A4F circuit breaker open'
        : `A4F rate limited (resets at ${a4fLimit.resetAt.toISOString()})`,
      fallbackChain: [],
    };
  }

  private async routeToA4F(request: ChatRequest, requestId: string): Promise<ChatResponse> {
    // Track concurrent request
    await this.rateLimiter.trackConcurrent('a4f', 1);
    
    try {
      const response = await this.a4fCircuit.execute(async () => {
        // Consume rate limit token
        await this.rateLimiter.consumeToken('a4f', requestId);
        
        // Make API call
        return await this.a4fClient.chatCompletion(request);
      });

      return {
        ...response,
        provider: 'a4f',
        fallbackUsed: false,
      };
    } finally {
      await this.rateLimiter.trackConcurrent('a4f', -1);
    }
  }

  private async routeToGroq(
    request: ChatRequest, 
    requestId: string, 
    groqModel: string,
    isFallback = false
  ): Promise<ChatResponse> {
    await this.rateLimiter.trackConcurrent('groq', 1);
    
    try {
      const response = await this.groqCircuit.execute(async () => {
        await this.rateLimiter.consumeToken('groq', requestId);
        return await this.groqClient.chatCompletion(request, groqModel);
      });

      return {
        ...response,
        provider: 'groq',
        fallbackUsed: isFallback,
      };
    } finally {
      await this.rateLimiter.trackConcurrent('groq', -1);
    }
  }

  async checkHealth(): Promise<Record<AIProvider, ProviderHealth>> {
    const a4fLimit = await this.rateLimiter.checkLimit('a4f');
    const groqLimit = await this.rateLimiter.checkLimit('groq');

    return {
      a4f: {
        isHealthy: this.a4fCircuit.getState() !== 'OPEN',
        remainingRequests: a4fLimit.remainingRequests,
        circuitState: this.a4fCircuit.getState(),
      },
      groq: {
        isHealthy: this.groqCircuit.getState() !== 'OPEN',
        remainingRequests: groqLimit.remainingRequests,
        circuitState: this.groqCircuit.getState(),
      },
    };
  }

  async close(): Promise<void> {
    await this.rateLimiter.close();
  }
}

// ============================================================================
// STEP 10: Singleton Instance (src/lib/ai/index.ts)
// ============================================================================

let routerInstance: AIProviderRouter | null = null;

export function getAIRouter(): AIProviderRouter {
  if (!routerInstance) {
    routerInstance = new AIProviderRouter();
  }
  return routerInstance;
}

// ============================================================================
// STEP 11: API Route Example (src/app/api/ai/chat/route.ts)
// ============================================================================

/*
import { NextRequest, NextResponse } from 'next/server';
import { getAIRouter } from '@/lib/ai';
import { ChatRequest } from '@/types/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    // Basic validation
    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const router = getAIRouter();
    const response = await router.chat(body);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
*/

// ============================================================================
// STEP 12: Health Check API (src/app/api/ai/health/route.ts)
// ============================================================================

/*
import { NextResponse } from 'next/server';
import { getAIRouter } from '@/lib/ai';

export async function GET() {
  try {
    const router = getAIRouter();
    const health = await router.checkHealth();

    return NextResponse.json({
      status: 'operational',
      providers: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
*/

// ============================================================================
// STEP 13: Usage Example in Your App
// ============================================================================

/*
import { getAIRouter } from '@/lib/ai';

async function generateNotes(topic: string) {
  const router = getAIRouter();
  
  const response = await router.chat({
    model: 'provider-8/claude-sonnet-4.5',
    messages: [
      {
        role: 'system',
        content: 'You are a UPSC CSE preparation expert. Generate comprehensive notes.',
      },
      {
        role: 'user',
        content: `Generate detailed notes on: ${topic}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    userId: 'user123',
  });

  return response.choices[0].message.content;
}

// Check health before making requests
async function checkAIHealth() {
  const router = getAIRouter();
  const health = await router.checkHealth();
  
  console.log('A4F Status:', health.a4f.isHealthy ? '✅' : '❌');
  console.log('A4F Remaining:', health.a4f.remainingRequests);
  console.log('Groq Status:', health.groq.isHealthy ? '✅' : '❌');
  console.log('Groq Remaining:', health.groq.remainingRequests);
}
*/

// ============================================================================
// 🎯 TESTING THE IMPLEMENTATION
// ============================================================================

/*
// Test 1: Basic chat request
async function test1() {
  const router = getAIRouter();
  const response = await router.chat({
    model: 'provider-8/claude-sonnet-4.5',
    messages: [{ role: 'user', content: 'What is federalism?' }],
  });
  console.log('Response:', response.choices[0].message.content);
  console.log('Provider used:', response.provider);
  console.log('Fallback used:', response.fallbackUsed);
}

// Test 2: Force Groq provider
async function test2() {
  const router = getAIRouter();
  const response = await router.chat({
    model: 'provider-8/claude-sonnet-4.5',
    messages: [{ role: 'user', content: 'Explain separation of powers' }],
    provider: 'groq', // Force Groq
  });
  console.log('Provider used:', response.provider);
}

// Test 3: Rate limit test (make 15 requests quickly)
async function test3() {
  const router = getAIRouter();
  
  for (let i = 0; i < 15; i++) {
    try {
      const response = await router.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [{ role: 'user', content: `Test ${i}` }],
      });
      console.log(`Request ${i}: ${response.provider}`);
    } catch (error) {
      console.error(`Request ${i} failed:`, error.message);
    }
  }
}

// Test 4: Health check
async function test4() {
  const router = getAIRouter();
  const health = await router.checkHealth();
  console.log('Health:', JSON.stringify(health, null, 2));
}
*/

// ============================================================================
// 📊 MONITORING INTEGRATION
// ============================================================================

/*
// Track usage in Plausible
import { trackEvent } from '@/lib/monitoring/analytics';

async function trackAIUsage(response: ChatResponse) {
  await trackEvent('ai_request', {
    provider: response.provider,
    model: response.model,
    fallback_used: response.fallbackUsed,
    latency: response.latencyMs,
    tokens: response.usage.total_tokens,
  });
}
*/

// ============================================================================
// 🚀 DEPLOYMENT CHECKLIST
// ============================================================================

/*
PRE-DEPLOYMENT:
✅ 1. Add environment variables to .env.local
✅ 2. Install all dependencies (npm install)
✅ 3. Test Redis connection
✅ 4. Validate API keys
✅ 5. Run unit tests
✅ 6. Test rate limiting locally
✅ 7. Test fallback mechanism

DEPLOYMENT:
✅ 1. Deploy to staging
✅ 2. Run load tests
✅ 3. Monitor for 1 hour
✅ 4. Check error logs
✅ 5. Verify metrics
✅ 6. Deploy to production
✅ 7. Monitor for 24 hours

POST-DEPLOYMENT:
✅ 1. Set up alerts
✅ 2. Create dashboards
✅ 3. Document for team
✅ 4. Train support staff
✅ 5. Gather user feedback
*/

export {};