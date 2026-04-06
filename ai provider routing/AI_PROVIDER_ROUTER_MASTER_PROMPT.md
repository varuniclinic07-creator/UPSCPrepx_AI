# 🤖 AI MODEL PROVIDER ROUTER - MASTER IMPLEMENTATION PROMPT
## For Google Antigravity IDE

---

## 📋 PROJECT OVERVIEW

**Mission**: Implement an intelligent AI model provider routing system that seamlessly switches between A4F.co (primary) and Groq (fallback) to handle 100,000+ concurrent users without service degradation.

**Current Challenge**: A4F.co provider has 10 RPM limit and hallucination issues under load.

**Solution**: Distributed rate-limited routing with automatic failover to Groq's open-source models.

---

## 🎯 SYSTEM REQUIREMENTS

### Primary Provider: A4F.co
- **API Key**: `ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621`
- **Base URL**: `https://api.a4f.co/v1/`
- **Rate Limit**: 10 RPM (requests per minute)
- **Models**: Claude Opus 4.5, Sonnet 4.5, Kimi K2, GLM-4.7, Qwen-3, etc.
- **Use Case**: Primary provider for all requests when available

### Fallback Provider: Groq
- **API Key**: `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`
- **Base URL**: `https://api.groq.com/openai/v1`
- **Rate Limit**: Free tier - varies by model
- **Models**: 
  - `llama-3.3-70b-versatile` (Primary fallback - 128K context)
  - `llama-3.1-8b-instant` (Fast fallback for simple tasks)
  - `deepseek-r1-distill-llama-70b` (Reasoning tasks - 128K context)
  - `llama-4-scout-17b-16e-instruct` (Multimodal - 10M context)
  - `mixtral-8x7b-32768` (Alternative fallback)
- **Use Case**: Automatic fallback when A4F exceeds rate limits

### Infrastructure
- **Redis**: Already integrated for distributed rate limiting
- **VPS**: 89.117.60.144 with all services
- **Database**: Supabase PostgreSQL
- **Monitoring**: Plausible Analytics, Uptime Kuma

---

## 📁 FILE STRUCTURE TO CREATE

```
src/
├── lib/
│   ├── ai/
│   │   ├── provider-router.ts          # ✅ CRITICAL - Main routing logic
│   │   ├── rate-limiter.ts            # ✅ CRITICAL - Distributed rate limiting
│   │   ├── model-mapper.ts            # ✅ CRITICAL - Model equivalence mapping
│   │   ├── circuit-breaker.ts         # ✅ HIGH - Failure protection
│   │   ├── providers/
│   │   │   ├── a4f-client.ts          # ✅ CRITICAL - A4F provider client
│   │   │   ├── groq-client.ts         # ✅ CRITICAL - Groq provider client
│   │   │   └── provider-types.ts      # ✅ HIGH - Shared types
│   │   └── monitoring/
│   │       ├── provider-metrics.ts    # ✅ HIGH - Track provider performance
│   │       └── alert-manager.ts       # ✅ MEDIUM - Alert on failures
│   └── utils/
│       ├── retry.ts                   # ✅ HIGH - Exponential backoff
│       └── cache.ts                   # ✅ MEDIUM - Response caching
├── middleware/
│   └── ai-router.ts                   # ✅ HIGH - API middleware
├── app/
│   └── api/
│       └── ai/
│           ├── chat/route.ts          # ✅ CRITICAL - Chat endpoint
│           ├── generate/route.ts      # ✅ CRITICAL - Generation endpoint
│           └── health/route.ts        # ✅ HIGH - Health check
└── types/
    └── ai-providers.ts                # ✅ HIGH - Type definitions
```

---

## 🔧 IMPLEMENTATION SPECIFICATIONS

### 1. PROVIDER ROUTER CORE (`src/lib/ai/provider-router.ts`)

**Functionality**:
```typescript
/**
 * Intelligent AI Provider Router
 * 
 * Features:
 * - Automatic provider selection based on availability
 * - Rate limit tracking per provider
 * - Circuit breaker integration
 * - Model mapping between providers
 * - Fallback chain: A4F → Groq → Error
 * - Request queuing for rate-limited providers
 * - Priority routing for premium users
 */

interface RouterConfig {
  primaryProvider: 'a4f';
  fallbackProviders: ['groq'];
  rateLimits: {
    a4f: { rpm: 10, concurrent: 5 };
    groq: { rpm: 30, concurrent: 10 };
  };
  circuitBreaker: {
    failureThreshold: 5;
    resetTimeout: 30000; // 30 seconds
  };
  retryStrategy: {
    maxRetries: 3;
    backoffMultiplier: 2;
    initialDelay: 1000;
  };
}

class AIProviderRouter {
  // Core routing logic
  async route(request: AIRequest): Promise<AIResponse>
  
  // Provider health check
  async checkProviderHealth(provider: string): Promise<boolean>
  
  // Rate limit check
  async canUseProvider(provider: string): Promise<boolean>
  
  // Fallback logic
  async routeWithFallback(request: AIRequest): Promise<AIResponse>
  
  // Priority routing for premium users
  async routePremium(request: AIRequest, userId: string): Promise<AIResponse>
}
```

**Key Logic**:
1. Check A4F rate limit via Redis
2. If A4F available → Use A4F
3. If A4F rate limited → Map model → Use Groq
4. If Groq fails → Retry with exponential backoff
5. Track metrics for all requests
6. Alert on repeated failures

---

### 2. DISTRIBUTED RATE LIMITER (`src/lib/ai/rate-limiter.ts`)

**Features**:
- Redis-based token bucket algorithm
- Per-provider rate limiting
- Sliding window implementation
- Burst handling
- User-level quotas

**Redis Keys**:
```
ai:ratelimit:a4f:global:rpm         # Global A4F requests per minute
ai:ratelimit:a4f:concurrent         # Current concurrent A4F requests
ai:ratelimit:groq:global:rpm        # Global Groq requests per minute
ai:ratelimit:user:{userId}:quota    # Per-user daily quota
ai:circuit:{provider}:failures      # Circuit breaker failure count
ai:circuit:{provider}:state         # Circuit state: CLOSED|OPEN|HALF_OPEN
```

**Implementation**:
```typescript
class DistributedRateLimiter {
  // Check if provider can accept request
  async checkLimit(provider: string, userId?: string): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetAt: Date;
  }>
  
  // Consume rate limit token
  async consumeToken(provider: string, userId?: string): Promise<void>
  
  // Release concurrent request slot
  async releaseSlot(provider: string): Promise<void>
  
  // Get current usage stats
  async getUsageStats(provider: string): Promise<UsageStats>
}
```

---

### 3. MODEL MAPPER (`src/lib/ai/model-mapper.ts`)

**Purpose**: Map A4F models to equivalent Groq models

**Mapping Strategy**:
```typescript
const MODEL_EQUIVALENCE_MAP = {
  // A4F Model → Groq Fallback
  'provider-7/claude-opus-4-5-20251101': 'llama-3.3-70b-versatile',
  'provider-8/claude-sonnet-4.5': 'llama-3.3-70b-versatile',
  'provider-2/kimi-k2-thinking-tee': 'deepseek-r1-distill-llama-70b',
  'provider-8/glm-4.7-thinking': 'deepseek-r1-distill-llama-70b',
  'provider-3/qwen-3-max': 'llama-3.3-70b-versatile',
  'provider-3/qwen-3-coder-plus': 'llama-3.1-8b-instant',
  
  // Default fallback for unknown models
  'default': 'llama-3.3-70b-versatile',
  
  // Task-specific routing
  'reasoning': 'deepseek-r1-distill-llama-70b',
  'coding': 'llama-3.1-8b-instant',
  'multimodal': 'llama-4-scout-17b-16e-instruct',
  'general': 'llama-3.3-70b-versatile',
};

class ModelMapper {
  // Map A4F model to Groq equivalent
  mapToGroq(a4fModel: string, taskType?: TaskType): string
  
  // Adjust parameters for Groq (temperature, max_tokens, etc.)
  adaptParameters(params: A4FParams, groqModel: string): GroqParams
  
  // Post-process responses to match A4F format
  normalizeResponse(groqResponse: any): A4FCompatibleResponse
}
```

**Parameter Adaptation Rules**:
- A4F temperature → Groq temperature (same)
- A4F max_tokens → Groq max_tokens (same)
- Preserve streaming mode
- Maintain function calling compatibility
- Adapt system prompts if needed

---

### 4. CIRCUIT BREAKER (`src/lib/ai/circuit-breaker.ts`)

**States**: CLOSED → OPEN → HALF_OPEN → CLOSED

**Implementation**:
```typescript
class CircuitBreaker {
  constructor(config: {
    failureThreshold: number;      // Failures before opening
    successThreshold: number;      // Successes to close
    timeout: number;               // Time before half-open
    monitorWindow: number;         // Rolling window for failures
  })
  
  // Execute request with circuit breaker protection
  async execute<T>(fn: () => Promise<T>): Promise<T>
  
  // Record success
  recordSuccess(): void
  
  // Record failure
  recordFailure(error: Error): void
  
  // Get current state
  getState(): CircuitState
  
  // Force open/close
  forceState(state: CircuitState): void
}
```

---

### 5. PROVIDER CLIENTS

#### A4F Client (`src/lib/ai/providers/a4f-client.ts`)
```typescript
class A4FClient {
  private baseURL = 'https://api.a4f.co/v1/';
  private apiKey = 'ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621';
  
  async chatCompletion(params: ChatParams): Promise<ChatResponse>
  async streamChatCompletion(params: ChatParams): AsyncGenerator<ChatChunk>
  async generateImage(params: ImageParams): Promise<ImageResponse>
  async generateEmbedding(params: EmbedParams): Promise<EmbedResponse>
  async transcribeAudio(params: AudioParams): Promise<TranscriptResponse>
  async generateSpeech(params: TTSParams): Promise<AudioResponse>
}
```

#### Groq Client (`src/lib/ai/providers/groq-client.ts`)
```typescript
class GroqClient {
  private baseURL = 'https://api.groq.com/openai/v1';
  private apiKey = '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';
  
  async chatCompletion(params: ChatParams): Promise<ChatResponse>
  async streamChatCompletion(params: ChatParams): AsyncGenerator<ChatChunk>
  async transcribeAudio(params: AudioParams): Promise<TranscriptResponse>
  
  // Note: Groq doesn't support image generation or TTS
  // These will need separate fallback handling
}
```

---

## 🔄 ROUTING DECISION FLOWCHART

```
User Request
     │
     ▼
[Check A4F Rate Limit]
     │
     ├─ Available ────► [Use A4F Provider]
     │                        │
     │                        ▼
     │                  [Return Response]
     │
     └─ Rate Limited ──► [Map Model to Groq]
                              │
                              ▼
                        [Check Groq Availability]
                              │
                              ├─ Available ────► [Use Groq Provider]
                              │                        │
                              │                        ▼
                              │                  [Normalize Response]
                              │                        │
                              │                        ▼
                              │                  [Return Response]
                              │
                              └─ Not Available ─► [Queue Request]
                                                        │
                                                        ▼
                                                  [Retry with Backoff]
                                                        │
                                                        ▼
                                                  [Return Error if max retries]
```

---

## 📊 MONITORING & METRICS

### Key Metrics to Track
```typescript
interface ProviderMetrics {
  requestCount: number;           // Total requests
  successCount: number;           // Successful responses
  failureCount: number;           // Failed requests
  averageLatency: number;         // Response time (ms)
  rateLimitHits: number;          // Times rate limited
  circuitBreakerTrips: number;    // Circuit breaker activations
  fallbackUsage: number;          // Fallback provider usage
  costPerRequest: number;         // Cost tracking
  tokensConsumed: number;         // Token usage
}
```

### Integration Points
1. **Plausible Analytics**: Track provider usage events
2. **Uptime Kuma**: Monitor provider health
3. **Supabase**: Store historical metrics
4. **Redis**: Real-time metrics

---

## 🚨 ERROR HANDLING

### Error Types & Responses
```typescript
enum AIProviderError {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class AIProviderErrorHandler {
  // Map provider errors to user-friendly messages
  handleError(error: any, context: RequestContext): {
    userMessage: string;
    shouldRetry: boolean;
    fallbackAvailable: boolean;
    retryAfter?: number;
  }
}
```

### Retry Strategy
- Rate limit errors: Wait until reset time
- Network errors: Exponential backoff (1s, 2s, 4s)
- Provider errors: Immediate fallback
- Validation errors: No retry, return error

---

## 🔐 SECURITY CONSIDERATIONS

### API Key Management
```typescript
// Store in environment variables
const AI_CONFIG = {
  a4f: {
    apiKey: process.env.A4F_API_KEY!,
    baseURL: process.env.A4F_BASE_URL!,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: process.env.GROQ_BASE_URL!,
  },
};

// Never expose keys in client-side code
// Never log full API keys
// Rotate keys periodically
```

### Request Validation
```typescript
class RequestValidator {
  // Validate and sanitize user inputs
  validateChatRequest(req: ChatRequest): ValidationResult
  
  // Prevent prompt injection
  sanitizePrompt(prompt: string): string
  
  // Check user permissions
  checkUserQuota(userId: string): boolean
}
```

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests
- Rate limiter accuracy
- Model mapping correctness
- Circuit breaker state transitions
- Error handling coverage

### Integration Tests
- End-to-end provider routing
- Fallback behavior
- Rate limit enforcement
- Concurrent request handling

### Load Tests
- 100,000 concurrent users simulation
- Rate limit stress testing
- Failover performance
- Response time under load

---

## 📝 ENVIRONMENT VARIABLES

```bash
# .env.local

# A4F Provider
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1/
A4F_RATE_LIMIT_RPM=10
A4F_RATE_LIMIT_CONCURRENT=5

# Groq Provider
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_RATE_LIMIT_RPM=30
GROQ_RATE_LIMIT_CONCURRENT=10

# Redis (already configured)
REDIS_URL=redis://89.117.60.144:6379

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT=30000

# Monitoring
ENABLE_PROVIDER_METRICS=true
METRICS_FLUSH_INTERVAL=60000
ALERT_WEBHOOK_URL=your_webhook_url

# Feature Flags
USE_AI_ROUTING=true
ENABLE_GROQ_FALLBACK=true
ENABLE_REQUEST_CACHING=true
CACHE_TTL_SECONDS=300
```

---

## 🎯 USAGE EXAMPLES

### Example 1: Simple Chat Request
```typescript
import { aiRouter } from '@/lib/ai/provider-router';

// Automatic routing
const response = await aiRouter.chat({
  model: 'provider-8/claude-sonnet-4.5',
  messages: [
    { role: 'user', content: 'Explain Indian polity in simple terms' }
  ],
  userId: 'user123',
});

// Response automatically uses A4F if available, Groq if rate limited
```

### Example 2: Streaming Response
```typescript
const stream = await aiRouter.streamChat({
  model: 'provider-7/claude-opus-4-5-20251101',
  messages: [
    { role: 'user', content: 'Generate comprehensive notes on federalism' }
  ],
  userId: 'user123',
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Example 3: Priority Routing for Premium Users
```typescript
const response = await aiRouter.chatPremium({
  model: 'provider-2/kimi-k2-thinking-tee',
  messages: [
    { role: 'user', content: 'Solve this complex reasoning problem' }
  ],
  userId: 'premium_user_456',
  priority: 'high', // Premium users get priority even during rate limits
});
```

### Example 4: Manual Provider Selection
```typescript
// Force specific provider (for testing or admin users)
const response = await aiRouter.chat({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'user', content: 'Test message' }
  ],
  provider: 'groq', // Force Groq
  userId: 'admin_user',
});
```

### Example 5: Health Check
```typescript
const health = await aiRouter.checkHealth();

console.log({
  a4f: {
    available: health.a4f.isHealthy,
    rateLimit: health.a4f.remainingRequests,
    circuitState: health.a4f.circuitState,
  },
  groq: {
    available: health.groq.isHealthy,
    rateLimit: health.groq.remainingRequests,
    circuitState: health.groq.circuitState,
  },
});
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Redis connection tested
- [ ] API keys validated
- [ ] Rate limits configured correctly
- [ ] Circuit breaker thresholds set
- [ ] Model mapping table complete
- [ ] Error messages localized
- [ ] Monitoring dashboards created

### Deployment Steps
1. Deploy to staging environment
2. Run load tests
3. Verify fallback behavior
4. Test rate limiting
5. Check monitoring integration
6. Verify error handling
7. Deploy to production
8. Monitor for 24 hours

### Post-Deployment
- [ ] Monitor provider usage distribution
- [ ] Track fallback frequency
- [ ] Analyze response times
- [ ] Review error logs
- [ ] Check cost efficiency
- [ ] Optimize based on metrics

---

## 📈 OPTIMIZATION STRATEGIES

### Short-Term (Week 1)
1. Implement basic routing logic
2. Add rate limiting
3. Set up Groq fallback
4. Basic monitoring

### Medium-Term (Week 2-3)
1. Add circuit breaker
2. Implement caching
3. Optimize model mapping
4. Enhanced metrics

### Long-Term (Month 1+)
1. Predictive rate limit management
2. ML-based model selection
3. Cost optimization algorithms
4. Advanced analytics

---

## 🎓 UPSC-SPECIFIC CONSIDERATIONS

### Content Generation Tasks
```typescript
const UPSC_TASK_ROUTING = {
  'notes_generation': {
    primary: 'provider-8/claude-sonnet-4.5',
    fallback: 'llama-3.3-70b-versatile',
    priority: 'high',
  },
  'quiz_generation': {
    primary: 'provider-3/qwen-3-max',
    fallback: 'llama-3.1-8b-instant',
    priority: 'medium',
  },
  'current_affairs_analysis': {
    primary: 'provider-2/kimi-k2-thinking-tee',
    fallback: 'deepseek-r1-distill-llama-70b',
    priority: 'high',
  },
  'answer_evaluation': {
    primary: 'provider-7/claude-opus-4-5-20251101',
    fallback: 'llama-3.3-70b-versatile',
    priority: 'high',
  },
  'topic_explanation': {
    primary: 'provider-8/claude-sonnet-4.5',
    fallback: 'llama-3.3-70b-versatile',
    priority: 'medium',
  },
};
```

### Quality Preservation
- Always use highest quality models for critical tasks
- Fallback only when necessary
- Track quality metrics per provider
- A/B test responses between providers
- User feedback integration

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### Common Issues

**Issue 1: Rate Limit Not Working**
```typescript
// Check Redis connection
const redis = await getRedisClient();
const ping = await redis.ping();
console.log('Redis status:', ping);

// Check rate limit keys
const keys = await redis.keys('ai:ratelimit:*');
console.log('Active rate limits:', keys);
```

**Issue 2: Fallback Not Triggering**
```typescript
// Enable debug logging
process.env.AI_ROUTER_DEBUG = 'true';

// Check circuit breaker state
const state = await circuitBreaker.getState('a4f');
console.log('Circuit breaker state:', state);
```

**Issue 3: Model Mapping Errors**
```typescript
// Test model mapper
const mapper = new ModelMapper();
const groqModel = mapper.mapToGroq('provider-8/claude-sonnet-4.5');
console.log('Mapped model:', groqModel);
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation Links
- A4F API Docs: Custom provider documentation
- Groq API Docs: https://console.groq.com/docs/
- Redis Rate Limiting: https://redis.io/docs/manual/patterns/rate-limiter/
- Circuit Breaker Pattern: https://martinfowler.com/bliki/CircuitBreaker.html

### Support Channels
- GitHub Issues: For bug reports
- Discord: For community support
- Email: For critical issues

---

## ⚡ PERFORMANCE TARGETS

### Response Time
- A4F Primary: < 2 seconds (p95)
- Groq Fallback: < 1 second (p95)
- Total Request Time: < 3 seconds (p95)

### Availability
- System Uptime: 99.9%
- Provider Routing Success: 99.5%
- Fallback Success Rate: 98%

### Scalability
- Concurrent Users: 100,000+
- Requests per Second: 1,000+
- Daily Active Users: 50,000+

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- [ ] Rate limiting accuracy: 100%
- [ ] Fallback trigger rate: < 15%
- [ ] Error rate: < 1%
- [ ] Average latency: < 2s
- [ ] Circuit breaker effectiveness: 95%+

### Business Metrics
- [ ] User satisfaction: 4.5+ stars
- [ ] Cost per request: < $0.002
- [ ] API cost reduction: 40%+
- [ ] System reliability: 99.9%+
- [ ] User retention: 85%+

---

## 🔒 SECURITY & COMPLIANCE

### Data Privacy
- No user data sent to third parties
- Request/response logging (no PII)
- API key encryption at rest
- Secure key rotation process

### Audit Trail
- Log all provider routing decisions
- Track rate limit violations
- Monitor suspicious patterns
- Alert on anomalies

---

## 🎨 IMPLEMENTATION PRIORITY

### CRITICAL (Do First)
1. ✅ Provider router core logic
2. ✅ Rate limiter with Redis
3. ✅ A4F & Groq client implementations
4. ✅ Model mapper
5. ✅ Basic error handling

### HIGH (Do Next)
6. ✅ Circuit breaker
7. ✅ API endpoints integration
8. ✅ Monitoring & metrics
9. ✅ Retry logic
10. ✅ Health check endpoints

### MEDIUM (After Core)
11. Response caching
12. Advanced metrics
13. Alert manager
14. Cost tracking
15. A/B testing framework

### LOW (Nice to Have)
16. Predictive routing
17. ML-based optimization
18. Advanced analytics
19. Custom dashboards
20. Auto-scaling logic

---

## 📞 IMPLEMENTATION SUPPORT

If you encounter issues during implementation:

1. **Check the uploaded files** for existing patterns
2. **Review VPS integration docs** for service configurations
3. **Test each component** independently before integration
4. **Use logging extensively** during development
5. **Monitor metrics** from day one

**Remember**: The goal is to handle 100,000 users smoothly with zero downtime and optimal cost efficiency!

---

## 🎯 FINAL NOTES

This master prompt is designed to be:
- **Comprehensive**: Covers all aspects of implementation
- **Actionable**: Clear steps and code examples
- **Flexible**: Adaptable to changing requirements
- **Maintainable**: Easy to understand and modify
- **Production-Ready**: Built for scale from day one

**Execute this implementation in Google Antigravity IDE with confidence!**

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Estimated Implementation Time**: 16-24 hours  
**Team Size**: 1-2 developers  

🚀 **Let's build a robust, scalable AI routing system!**
