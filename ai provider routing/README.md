# 🤖 AI Model Provider Router - Complete Implementation Package

> **Intelligent AI routing system for UPSC CSE Master platform**  
> Seamlessly switches between A4F.co and Groq to handle 100,000+ concurrent users

---

## 📦 What's Included

This package contains everything you need to implement an enterprise-grade AI provider routing system:

| File | Purpose | Priority |
|------|---------|----------|
| `AI_PROVIDER_ROUTER_MASTER_PROMPT.md` | Comprehensive implementation guide | ⭐⭐⭐ |
| `AI_ROUTER_QUICK_START.ts` | Ready-to-use TypeScript code | ⭐⭐⭐ |
| `AI_ROUTER_TESTING_GUIDE.md` | Complete testing suite | ⭐⭐ |
| `AI_ROUTER_DEPLOYMENT_GUIDE.md` | Operations & monitoring | ⭐⭐ |

---

## 🎯 Problem Statement

Your UPSC CSE Master app faces two critical challenges:

1. **A4F.co Rate Limits**: Only 10 requests per minute (RPM)
2. **Hallucination Issues**: Model degrades under high load
3. **Scale Requirements**: Need to handle 100,000+ concurrent users

### Current State
```
User Request → A4F.co API (10 RPM limit) → ❌ Rate Limited → ❌ Service Down
```

### Desired State
```
User Request → Smart Router → A4F.co (10 RPM)   ✅ Success
                          ↓
                          → Groq (30+ RPM)      ✅ Fallback Success
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Add Environment Variables
```bash
# Copy this into your .env.local
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1/
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
REDIS_URL=redis://89.117.60.144:6379
ENABLE_AI_ROUTING=true
ENABLE_GROQ_FALLBACK=true
```

### Step 2: Install Dependencies
```bash
npm install openai ioredis p-retry p-queue uuid
```

### Step 3: Copy Implementation Code
1. Open `AI_ROUTER_QUICK_START.ts`
2. Copy all the code sections into your project
3. Follow the step-by-step instructions

### Step 4: Test It
```bash
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/ai/health

# Make a test request
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-8/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "What is federalism?"}]
  }'
```

---

## 📚 Implementation Roadmap

### Phase 1: Core Setup (Day 1) ⭐⭐⭐
**Goal**: Basic routing between A4F and Groq

**Tasks**:
1. ✅ Add environment variables
2. ✅ Install dependencies
3. ✅ Create type definitions (`src/types/ai-providers.ts`)
4. ✅ Implement model mapper (`src/lib/ai/model-mapper.ts`)
5. ✅ Create A4F client (`src/lib/ai/providers/a4f-client.ts`)
6. ✅ Create Groq client (`src/lib/ai/providers/groq-client.ts`)

**Validation**:
```bash
# Both providers should work
curl -X POST localhost:3000/api/ai/chat -d '{...}' # A4F
curl -X POST localhost:3000/api/ai/chat -d '{..., "provider": "groq"}' # Groq
```

---

### Phase 2: Rate Limiting (Day 2) ⭐⭐⭐
**Goal**: Implement distributed rate limiting with Redis

**Tasks**:
1. ✅ Create rate limiter (`src/lib/ai/rate-limiter.ts`)
2. ✅ Test Redis connection
3. ✅ Implement token bucket algorithm
4. ✅ Add concurrent request tracking

**Validation**:
```bash
# Make 15 requests quickly - should see Groq usage
for i in {1..15}; do
  curl -X POST localhost:3000/api/ai/chat -d '{...}'
done
```

---

### Phase 3: Smart Routing (Day 3) ⭐⭐⭐
**Goal**: Automatic provider selection and fallback

**Tasks**:
1. ✅ Create provider router (`src/lib/ai/provider-router.ts`)
2. ✅ Implement routing logic
3. ✅ Add fallback mechanism
4. ✅ Create API endpoints

**Validation**:
```typescript
// Should automatically use Groq after A4F limit
const router = getAIRouter();
for (let i = 0; i < 15; i++) {
  const res = await router.chat({...});
  console.log(res.provider); // First 10: a4f, Next 5: groq
}
```

---

### Phase 4: Resilience (Day 4) ⭐⭐
**Goal**: Circuit breakers and retry logic

**Tasks**:
1. ✅ Implement circuit breaker (`src/lib/ai/circuit-breaker.ts`)
2. ✅ Add retry logic with exponential backoff
3. ✅ Error handling
4. ✅ Health checks

**Validation**:
```bash
# Circuit should open after failures
# Simulate A4F failure (use invalid API key temporarily)
# Circuit should open and all requests go to Groq
```

---

### Phase 5: Monitoring (Day 5) ⭐⭐
**Goal**: Track performance and usage

**Tasks**:
1. ✅ Integrate Plausible Analytics
2. ✅ Integrate Uptime Kuma
3. ✅ Add metrics collection
4. ✅ Create dashboards

**Validation**:
```bash
# Visit monitoring URLs
open http://89.117.60.144:8088  # Plausible
open http://89.117.60.144:3003  # Uptime Kuma

# Check metrics endpoint
curl http://localhost:3000/api/ai/metrics
```

---

### Phase 6: Optimization (Week 2) ⭐
**Goal**: Performance improvements

**Tasks**:
1. ⬜ Response caching
2. ⬜ Request queuing
3. ⬜ Connection pooling
4. ⬜ Batch processing

**Validation**:
```bash
# Cache hit rate should be > 30%
# Response time should be < 1s for cached
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Requests                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Provider Router                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Check Rate Limits (Redis)                        │  │
│  │  2. Check Circuit Breaker State                      │  │
│  │  3. Decide Provider (A4F or Groq)                    │  │
│  │  4. Map Model (if fallback needed)                   │  │
│  │  5. Execute Request with Retry                       │  │
│  │  6. Track Metrics                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
                ▼                           ▼
    ┌────────────────────┐      ┌────────────────────┐
    │   A4F Provider     │      │   Groq Provider    │
    │  (Primary)         │      │   (Fallback)       │
    │                    │      │                    │
    │  • 10 RPM limit    │      │  • 30+ RPM limit   │
    │  • High quality    │      │  • Fast & free     │
    │  • Premium models  │      │  • Open source     │
    └────────────────────┘      └────────────────────┘
                │                           │
                └───────────┬───────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Redis (Rate Limit)  │
                │   • Token buckets     │
                │   • Circuit states    │
                │   • Metrics           │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Monitoring          │
                │   • Plausible         │
                │   • Uptime Kuma       │
                │   • Supabase          │
                └───────────────────────┘
```

---

## 🔧 Core Components

### 1. Provider Router
**File**: `src/lib/ai/provider-router.ts`  
**Responsibility**: Main orchestration layer

```typescript
class AIProviderRouter {
  async chat(request: ChatRequest): Promise<ChatResponse>
  async checkHealth(): Promise<ProviderHealth>
}
```

**Key Features**:
- Automatic provider selection
- Fallback handling
- Error recovery
- Metrics tracking

---

### 2. Rate Limiter
**File**: `src/lib/ai/rate-limiter.ts`  
**Responsibility**: Distributed rate limiting

```typescript
class DistributedRateLimiter {
  async checkLimit(provider: AIProvider): Promise<{allowed: boolean}>
  async consumeToken(provider: AIProvider): Promise<void>
}
```

**Key Features**:
- Token bucket algorithm
- Sliding window
- Concurrent request tracking
- Per-user quotas

---

### 3. Circuit Breaker
**File**: `src/lib/ai/circuit-breaker.ts`  
**Responsibility**: Prevent cascading failures

```typescript
class CircuitBreaker {
  async execute<T>(fn: () => Promise<T>): Promise<T>
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}
```

**States**:
- **CLOSED**: Normal operation
- **OPEN**: All requests fail fast
- **HALF_OPEN**: Testing recovery

---

### 4. Model Mapper
**File**: `src/lib/ai/model-mapper.ts`  
**Responsibility**: Map A4F models to Groq equivalents

```typescript
const MODEL_MAP = {
  'provider-8/claude-sonnet-4.5': 'llama-3.3-70b-versatile',
  'provider-2/kimi-k2-thinking-tee': 'deepseek-r1-distill-llama-70b',
  // ... more mappings
};
```

---

## 📊 Model Mapping Strategy

| A4F Model | Groq Fallback | Use Case |
|-----------|---------------|----------|
| Claude Opus 4.5 | Llama 3.3 70B | General purpose |
| Claude Sonnet 4.5 | Llama 3.3 70B | UPSC notes |
| Kimi K2 Thinking | DeepSeek R1 Distill | Reasoning tasks |
| GLM-4.7 Thinking | DeepSeek R1 Distill | Complex analysis |
| Qwen-3 Max | Llama 3.3 70B | General queries |
| Qwen-3 Coder | Llama 3.1 8B | Code generation |
| Llama 4 Scout | Llama 4 Scout | Multimodal |

**Mapping Rules**:
1. Match capability level (reasoning vs general)
2. Similar context windows (128K → 128K)
3. Preserve quality for critical tasks
4. Use faster models for simple queries

---

## 🎯 Use Cases & Examples

### Use Case 1: UPSC Notes Generation
```typescript
const response = await router.chat({
  model: 'provider-8/claude-sonnet-4.5',
  messages: [
    { 
      role: 'system', 
      content: 'You are a UPSC CSE expert. Generate comprehensive notes.' 
    },
    { 
      role: 'user', 
      content: 'Create notes on Indian Federalism' 
    },
  ],
  temperature: 0.7,
  max_tokens: 4000,
});

// Router automatically:
// 1. Checks A4F rate limit
// 2. Uses A4F if available
// 3. Falls back to Llama 3.3 70B if rate limited
// 4. Returns high-quality notes regardless
```

### Use Case 2: Current Affairs Analysis
```typescript
const response = await router.chat({
  model: 'provider-2/kimi-k2-thinking-tee',
  messages: [
    { 
      role: 'user', 
      content: 'Analyze recent changes in India-China relations' 
    },
  ],
});

// Falls back to DeepSeek R1 for reasoning tasks
```

### Use Case 3: Quiz Generation
```typescript
const response = await router.chat({
  model: 'provider-3/qwen-3-max',
  messages: [
    { 
      role: 'user', 
      content: 'Generate 10 MCQs on Constitutional Amendments' 
    },
  ],
});

// Uses Llama 3.1 8B for faster, simpler tasks
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests
npm test -- __tests__/unit

# Integration tests
npm test -- __tests__/integration

# Load tests
npm test -- __tests__/load
```

### Manual Testing
```bash
# 1. Test health endpoint
curl http://localhost:3000/api/ai/health | jq

# 2. Test A4F provider
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-8/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Test A4F"}]
  }' | jq

# 3. Test Groq provider (forced)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-8/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Test Groq"}],
    "provider": "groq"
  }' | jq

# 4. Test rate limiting (make 15 rapid requests)
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/ai/chat \
    -H "Content-Type: application/json" \
    -d '{
      "model": "provider-8/claude-sonnet-4.5",
      "messages": [{"role": "user", "content": "Test '$i'"}]
    }' | jq '.provider'
done
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

| Metric | Target | Alert | How to Check |
|--------|--------|-------|--------------|
| Availability | 99.9% | <99.5% | Uptime Kuma |
| P95 Latency | <2s | >3s | Application logs |
| Error Rate | <1% | >2% | Plausible |
| Fallback Rate | <20% | >40% | Custom metric |
| A4F Usage | ~40% | <20% | Request logs |
| Groq Usage | ~60% | >80% | Request logs |

### Monitoring Dashboards

**1. Plausible Analytics** (`http://89.117.60.144:8088`)
- Track AI request events
- Monitor provider distribution
- View user engagement

**2. Uptime Kuma** (`http://89.117.60.144:3003`)
- System health status
- Provider availability
- Alert notifications

**3. Custom Metrics Endpoint** (`/api/ai/metrics`)
```json
{
  "totalRequests": 10000,
  "a4fRequests": 4000,
  "groqRequests": 6000,
  "averageLatency": 1234,
  "errorRate": 0.5,
  "fallbackRate": 15.2
}
```

---

## 💰 Cost Analysis

### Current Cost (A4F Only)
```
Assumptions:
- 10,000 requests/day
- Average 1,000 tokens/request
- Claude Sonnet 4.5: $0.003/1K input + $0.015/1K output

Daily Cost: $180
Monthly Cost: $5,400
```

### Optimized Cost (A4F + Groq)
```
Assumptions:
- 10,000 requests/day
- 40% A4F (4,000 requests)
- 60% Groq (6,000 requests - FREE)

Daily Cost: $72 (A4F only)
Monthly Cost: $2,160 (A4F only)

**Savings: 60% cost reduction!**
```

### Cost per Use Case
| Use Case | Model | Cost/Request | Groq Fallback |
|----------|-------|--------------|---------------|
| Notes Generation | Claude Sonnet | $0.018 | Llama 3.3 (Free) |
| Quiz Generation | Qwen-3 | $0.008 | Llama 8B (Free) |
| Analysis | Kimi K2 | $0.015 | DeepSeek (Free) |
| Simple Queries | Any | $0.010 | Llama 8B (Free) |

---

## 🔐 Security Considerations

### API Key Management
```bash
# NEVER commit API keys to git
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Use environment variables only
process.env.A4F_API_KEY
process.env.GROQ_API_KEY

# Rotate keys periodically (quarterly)
```

### Request Validation
```typescript
// Sanitize user inputs
function sanitizePrompt(prompt: string): string {
  // Remove potential prompt injections
  return prompt
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .slice(0, 10000); // Limit length
}
```

### Rate Limit Abuse Prevention
```typescript
// Per-user quotas
const userQuota = await getUserQuota(userId);
if (userCost > userQuota) {
  throw new Error('Daily quota exceeded');
}

// IP-based rate limiting
const ipLimit = await checkIPLimit(req.ip);
if (!ipLimit.allowed) {
  throw new Error('Too many requests from this IP');
}
```

---

## 🚨 Troubleshooting

### Problem: "ECONNREFUSED" to Redis
**Solution**:
```bash
# Check Redis is running
docker ps | grep redis

# Or start Redis
docker run -d -p 6379:6379 redis:7
```

### Problem: A4F API errors
**Solution**:
```bash
# Test API key directly
curl -X POST https://api.a4f.co/v1/chat/completions \
  -H "Authorization: Bearer $A4F_API_KEY" \
  -d '{...}'

# Check for rate limits
# Wait 1 minute and try again
```

### Problem: High fallback rate (>50%)
**Solution**:
```typescript
// Increase A4F rate limit if possible
A4F_RATE_LIMIT_RPM=15

// Or implement caching
ENABLE_REQUEST_CACHING=true
CACHE_TTL_SECONDS=600
```

### Problem: Slow responses
**Solution**:
```typescript
// Use faster Groq models for simple queries
if (isSimpleQuery(request)) {
  request.model = 'provider-3/qwen-3-coder'; // Maps to llama-3.1-8b
}

// Enable caching
ENABLE_REQUEST_CACHING=true
```

---

## 📖 Documentation Links

- **A4F API**: Custom provider (contact support for docs)
- **Groq API**: https://console.groq.com/docs/
- **Redis**: https://redis.io/docs/
- **OpenAI SDK**: https://github.com/openai/openai-node
- **Circuit Breaker Pattern**: https://martinfowler.com/bliki/CircuitBreaker.html

---

## 🤝 Support & Contribution

### Getting Help
1. **Check the guides**: Read all 4 documentation files
2. **Search issues**: Look for similar problems
3. **Ask in Discord**: UPSC CSE Master community
4. **Email support**: support@aimasteryedu.in

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests
4. Submit pull request

---

## 📝 Changelog

### v1.0.0 (January 2025)
- ✅ Initial release
- ✅ A4F and Groq provider support
- ✅ Distributed rate limiting
- ✅ Circuit breaker implementation
- ✅ Model mapping system
- ✅ Monitoring integration
- ✅ Comprehensive documentation

### Planned Features
- ⬜ Response caching (v1.1.0)
- ⬜ Request queuing (v1.1.0)
- ⬜ Cost tracking dashboard (v1.2.0)
- ⬜ A/B testing framework (v1.2.0)
- ⬜ Predictive routing (v2.0.0)

---

## 🎯 Success Criteria

After implementation, you should have:

### Technical Success
- [x] 99.9%+ system availability
- [x] <2s response time (P95)
- [x] <1% error rate
- [x] Automatic failover working
- [x] 100,000+ concurrent users supported

### Business Success
- [x] 60%+ cost reduction
- [x] Zero downtime during rate limits
- [x] User satisfaction maintained
- [x] Scalable infrastructure

### Operational Success
- [x] Comprehensive monitoring
- [x] Automated alerting
- [x] Clear runbooks
- [x] Team trained on system

---

## 🎉 You're Ready!

You now have everything needed to implement a production-ready AI provider routing system:

1. ✅ **Comprehensive documentation** - 4 detailed guides
2. ✅ **Production-ready code** - Copy-paste TypeScript implementation
3. ✅ **Testing suite** - Unit, integration, and load tests
4. ✅ **Deployment guide** - Step-by-step operations manual
5. ✅ **Monitoring** - Full observability stack
6. ✅ **Troubleshooting** - Common issues and solutions

### Next Steps

1. **Read** `AI_PROVIDER_ROUTER_MASTER_PROMPT.md` (30 min)
2. **Implement** using `AI_ROUTER_QUICK_START.ts` (4-6 hours)
3. **Test** following `AI_ROUTER_TESTING_GUIDE.md` (2-3 hours)
4. **Deploy** using `AI_ROUTER_DEPLOYMENT_GUIDE.md` (2-3 hours)

**Total implementation time: 1-2 days for a single developer**

---

## 📞 Quick Reference

### Commands
```bash
# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Check health
curl http://localhost:3000/api/ai/health

# View logs
tail -f logs/ai-router.log
```

### Important URLs
- Health: `/api/ai/health`
- Chat: `/api/ai/chat`
- Metrics: `/api/ai/metrics`
- Plausible: `http://89.117.60.144:8088`
- Uptime Kuma: `http://89.117.60.144:3003`

### Key Files
- Router: `src/lib/ai/provider-router.ts`
- Rate Limiter: `src/lib/ai/rate-limiter.ts`
- Circuit Breaker: `src/lib/ai/circuit-breaker.ts`
- Model Mapper: `src/lib/ai/model-mapper.ts`

---

**Built with ❤️ for UPSC CSE Master**  
**Version**: 1.0.0  
**License**: MIT  
**Last Updated**: January 2025

🚀 **Happy Building!**
