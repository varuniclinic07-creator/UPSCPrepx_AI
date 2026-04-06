# 🚀 AI PROVIDER ROUTER - DEPLOYMENT & OPERATIONS GUIDE

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Monitoring & Observability](#monitoring--observability)
4. [Troubleshooting](#troubleshooting)
5. [Performance Optimization](#performance-optimization)
6. [Cost Management](#cost-management)
7. [Disaster Recovery](#disaster-recovery)

---

## Pre-Deployment Checklist

### Environment Setup
```bash
# ✅ 1. Verify all environment variables
cat > .env.production << EOF
# AI Providers
A4F_API_KEY=ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621
A4F_BASE_URL=https://api.a4f.co/v1/
A4F_RATE_LIMIT_RPM=10
A4F_RATE_LIMIT_CONCURRENT=5

GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_RATE_LIMIT_RPM=30
GROQ_RATE_LIMIT_CONCURRENT=10

# Infrastructure
REDIS_URL=redis://89.117.60.144:6379
DATABASE_URL=your_supabase_url

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
CIRCUIT_BREAKER_TIMEOUT=30000

# Monitoring
PLAUSIBLE_URL=http://89.117.60.144:8088
PLAUSIBLE_DOMAIN=aimasteryedu.in
UPTIME_KUMA_URL=http://89.117.60.144:3003

# Features
ENABLE_AI_ROUTING=true
ENABLE_GROQ_FALLBACK=true
ENABLE_REQUEST_CACHING=true
CACHE_TTL_SECONDS=300

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false
EOF
```

### Infrastructure Verification
```bash
# ✅ 2. Test Redis connection
redis-cli -h 89.117.60.144 -p 6379 ping
# Expected: PONG

# ✅ 3. Test A4F API
curl -X POST https://api.a4f.co/v1/chat/completions \
  -H "Authorization: Bearer ddc-a4f-58e04f695d7748c78c49d3ba1fdb9621" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-8/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }'

# ✅ 4. Test Groq API
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }'

# ✅ 5. Verify VPS services
curl http://89.117.60.144:8088/api/health  # Plausible
curl http://89.117.60.144:3003              # Uptime Kuma
```

### Application Readiness
```bash
# ✅ 6. Build application
npm run build

# ✅ 7. Run tests
npm test

# ✅ 8. Check TypeScript
npm run type-check

# ✅ 9. Run linter
npm run lint

# ✅ 10. Test locally
npm run dev
# Visit http://localhost:3000/api/ai/health
```

---

## Deployment Steps

### Step 1: Staging Deployment

```bash
# 1. Deploy to staging
git checkout develop
git pull origin develop
npm run build
# Deploy to staging environment

# 2. Run smoke tests
curl https://staging.aimasteryedu.in/api/ai/health

# 3. Test AI endpoints
curl -X POST https://staging.aimasteryedu.in/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "provider-8/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Test staging"}]
  }'

# 4. Monitor for 1 hour
# Check logs, metrics, error rates
```

### Step 2: Production Deployment

```bash
# 1. Create production release
git checkout main
git merge develop
git tag -a v1.0.0 -m "AI Router Release"
git push origin main --tags

# 2. Deploy to production
npm run build
# Deploy to production environment

# 3. Verify deployment
curl https://aimasteryedu.in/api/ai/health

# 4. Gradual rollout (if using feature flags)
# Enable for 10% of users
# Monitor for 15 minutes
# Enable for 50% of users
# Monitor for 30 minutes
# Enable for 100% of users

# 5. Monitor closely for 24 hours
```

### Step 3: Post-Deployment Verification

```bash
# Verify all components
curl https://aimasteryedu.in/api/ai/health | jq

# Expected response:
{
  "status": "operational",
  "providers": {
    "a4f": {
      "isHealthy": true,
      "remainingRequests": 10,
      "circuitState": "CLOSED"
    },
    "groq": {
      "isHealthy": true,
      "remainingRequests": 30,
      "circuitState": "CLOSED"
    }
  },
  "timestamp": "2025-01-15T..."
}
```

---

## Monitoring & Observability

### Key Metrics Dashboard

```typescript
// Create monitoring dashboard (src/lib/monitoring/dashboard.ts)
export interface AIRouterMetrics {
  // Request metrics
  totalRequests: number;
  requestsPerMinute: number;
  successRate: number;
  errorRate: number;
  
  // Provider metrics
  a4fRequestCount: number;
  groqRequestCount: number;
  fallbackRate: number;
  
  // Performance metrics
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  
  // Rate limiting metrics
  rateLimitHits: number;
  concurrentRequests: number;
  queuedRequests: number;
  
  // Circuit breaker metrics
  circuitBreakerTrips: number;
  circuitState: {
    a4f: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    groq: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  };
  
  // Cost metrics
  totalTokens: number;
  estimatedCost: number;
}

// Track metrics in real-time
class MetricsCollector {
  async collectMetrics(): Promise<AIRouterMetrics> {
    // Implement metrics collection
  }
  
  async pushToPlausible(event: string, props: any): Promise<void> {
    // Push to Plausible Analytics
  }
  
  async pushToUptimeKuma(status: 'up' | 'down'): Promise<void> {
    // Push heartbeat to Uptime Kuma
  }
}
```

### Real-Time Monitoring

```bash
# 1. Watch Redis keys
redis-cli -h 89.117.60.144 -p 6379
> KEYS ai:*
> GET ai:ratelimit:a4f:global
> ZCARD ai:ratelimit:a4f:global

# 2. Monitor application logs
tail -f /var/log/upsc-app/ai-router.log | grep -E "(ERROR|WARN|FALLBACK)"

# 3. Check health endpoint every minute
watch -n 60 'curl -s https://aimasteryedu.in/api/ai/health | jq'

# 4. Monitor Plausible dashboard
# Visit http://89.117.60.144:8088

# 5. Check Uptime Kuma
# Visit http://89.117.60.144:3003
```

### Alert Configuration

```typescript
// src/lib/monitoring/alerts.ts
interface AlertRule {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  duration: number; // seconds
  action: 'email' | 'webhook' | 'sms';
}

const ALERT_RULES: AlertRule[] = [
  {
    metric: 'error_rate',
    threshold: 5, // 5%
    operator: '>',
    duration: 300, // 5 minutes
    action: 'email',
  },
  {
    metric: 'fallback_rate',
    threshold: 30, // 30%
    operator: '>',
    duration: 600, // 10 minutes
    action: 'webhook',
  },
  {
    metric: 'circuit_breaker_open',
    threshold: 1,
    operator: '=',
    duration: 0, // immediate
    action: 'sms',
  },
  {
    metric: 'p95_latency',
    threshold: 5000, // 5 seconds
    operator: '>',
    duration: 300,
    action: 'email',
  },
];
```

### Logging Best Practices

```typescript
// src/lib/monitoring/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'ai-router-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'ai-router.log' 
    }),
  ],
});

// Structured logging
logger.info('AI request routed', {
  requestId: 'req-123',
  provider: 'a4f',
  model: 'claude-sonnet-4.5',
  userId: 'user-456',
  latency: 1234,
  tokens: 500,
});

logger.error('Provider failure', {
  requestId: 'req-123',
  provider: 'a4f',
  error: error.message,
  stack: error.stack,
  fallbackUsed: true,
});
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: High Error Rate

**Symptoms:**
- Error rate > 5%
- Many failed requests
- Circuit breaker opens frequently

**Diagnosis:**
```bash
# Check recent errors
tail -100 ai-router-error.log | jq '.error'

# Check circuit breaker state
curl https://aimasteryedu.in/api/ai/health | jq '.providers'

# Check Redis connection
redis-cli -h 89.117.60.144 ping
```

**Solutions:**
1. **If A4F is down:**
   ```typescript
   // Temporarily disable A4F
   process.env.ENABLE_A4F = 'false';
   ```

2. **If Groq is rate limited:**
   ```typescript
   // Increase Groq rate limit
   process.env.GROQ_RATE_LIMIT_RPM = '60';
   ```

3. **If Redis is down:**
   ```bash
   # Restart Redis
   docker restart redis
   # Or
   systemctl restart redis
   ```

---

#### Issue 2: Slow Response Times

**Symptoms:**
- P95 latency > 3 seconds
- User complaints about slowness
- Timeout errors

**Diagnosis:**
```bash
# Check average latency
curl https://aimasteryedu.in/api/ai/metrics | jq '.averageLatency'

# Check concurrent requests
redis-cli -h 89.117.60.144
> GET ai:concurrent:a4f
> GET ai:concurrent:groq

# Check if rate limited
redis-cli -h 89.117.60.144
> ZCARD ai:ratelimit:a4f:global
```

**Solutions:**
1. **Increase concurrent limits:**
   ```typescript
   // Update env
   A4F_RATE_LIMIT_CONCURRENT=10
   GROQ_RATE_LIMIT_CONCURRENT=20
   ```

2. **Enable caching:**
   ```typescript
   ENABLE_REQUEST_CACHING=true
   CACHE_TTL_SECONDS=600
   ```

3. **Use faster models:**
   ```typescript
   // Map to faster Groq models
   'provider-8/claude-sonnet-4.5': 'llama-3.1-8b-instant'
   ```

---

#### Issue 3: Rate Limit Issues

**Symptoms:**
- Too many requests to Groq
- A4F not being used enough
- Uneven load distribution

**Diagnosis:**
```bash
# Check rate limit usage
redis-cli -h 89.117.60.144
> ZCARD ai:ratelimit:a4f:global
> ZCARD ai:ratelimit:groq:global

# Check provider distribution
tail -1000 ai-router.log | grep "provider" | \
  awk '{print $NF}' | sort | uniq -c
```

**Solutions:**
1. **Adjust rate limits:**
   ```typescript
   A4F_RATE_LIMIT_RPM=15  // Increase A4F
   GROQ_RATE_LIMIT_RPM=20 // Decrease Groq
   ```

2. **Implement user quotas:**
   ```typescript
   // Add per-user limits
   await rateLimiter.checkUserQuota(userId);
   ```

3. **Use priority routing:**
   ```typescript
   // Premium users get A4F priority
   if (user.isPremium) {
     request.priority = 'high';
   }
   ```

---

#### Issue 4: Circuit Breaker Stuck Open

**Symptoms:**
- Circuit breaker remains OPEN
- Provider not recovering
- All requests fail

**Diagnosis:**
```bash
# Check circuit state
curl https://aimasteryedu.in/api/ai/health | \
  jq '.providers.a4f.circuitState'

# Check failure count
redis-cli -h 89.117.60.144
> GET ai:circuit:a4f:failures
```

**Solutions:**
1. **Manual reset:**
   ```typescript
   // Force circuit closed
   const router = getAIRouter();
   router.a4fCircuit.reset();
   ```

2. **Adjust thresholds:**
   ```typescript
   CIRCUIT_BREAKER_FAILURE_THRESHOLD=10  // More lenient
   CIRCUIT_BREAKER_TIMEOUT=60000        // Longer recovery
   ```

3. **Check provider health:**
   ```bash
   # Test A4F directly
   curl -X POST https://api.a4f.co/v1/chat/completions \
     -H "Authorization: Bearer $A4F_API_KEY" \
     -d '{"model":"provider-8/claude-sonnet-4.5","messages":[{"role":"user","content":"test"}]}'
   ```

---

#### Issue 5: Memory Leaks

**Symptoms:**
- Memory usage increasing over time
- Application crashes after hours
- Redis connections not closing

**Diagnosis:**
```bash
# Check memory usage
ps aux | grep node

# Check Redis connections
redis-cli -h 89.117.60.144
> CLIENT LIST | grep addr

# Profile memory
node --inspect app.js
# Open chrome://inspect
```

**Solutions:**
1. **Close connections properly:**
   ```typescript
   // Always close router on shutdown
   process.on('SIGTERM', async () => {
     await router.close();
     process.exit(0);
   });
   ```

2. **Implement connection pooling:**
   ```typescript
   const redis = new Redis({
     maxRetriesPerRequest: 3,
     lazyConnect: true,
   });
   ```

3. **Clear old rate limit keys:**
   ```bash
   # Cron job to clean old keys
   redis-cli -h 89.117.60.144 --scan --pattern 'ai:ratelimit:*' | \
     xargs redis-cli -h 89.117.60.144 DEL
   ```

---

## Performance Optimization

### 1. Response Caching

```typescript
// src/lib/ai/cache.ts
import { createClient } from 'redis';

class ResponseCache {
  private redis = createClient({
    url: process.env.REDIS_URL,
  });

  async get(key: string): Promise<ChatResponse | null> {
    const cached = await this.redis.get(`cache:${key}`);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, response: ChatResponse, ttl = 300): Promise<void> {
    await this.redis.setex(
      `cache:${key}`,
      ttl,
      JSON.stringify(response)
    );
  }

  generateKey(request: ChatRequest): string {
    return `${request.model}:${JSON.stringify(request.messages)}`;
  }
}

// Usage in router
const cache = new ResponseCache();
const cacheKey = cache.generateKey(request);
const cached = await cache.get(cacheKey);

if (cached && process.env.ENABLE_REQUEST_CACHING === 'true') {
  return cached;
}

const response = await this.routeToProvider(request);
await cache.set(cacheKey, response);
return response;
```

### 2. Request Queuing

```typescript
// src/lib/ai/queue.ts
import PQueue from 'p-queue';

class RequestQueue {
  private a4fQueue = new PQueue({ concurrency: 5 });
  private groqQueue = new PQueue({ concurrency: 10 });

  async enqueue(
    provider: AIProvider,
    fn: () => Promise<ChatResponse>
  ): Promise<ChatResponse> {
    const queue = provider === 'a4f' ? this.a4fQueue : this.groqQueue;
    return queue.add(fn);
  }

  getQueueSize(provider: AIProvider): number {
    const queue = provider === 'a4f' ? this.a4fQueue : this.groqQueue;
    return queue.size + queue.pending;
  }
}
```

### 3. Batch Processing

```typescript
// src/lib/ai/batch-processor.ts
class BatchProcessor {
  private batch: ChatRequest[] = [];
  private batchSize = 10;
  private flushInterval = 1000; // 1 second

  async add(request: ChatRequest): Promise<void> {
    this.batch.push(request);
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    const requests = [...this.batch];
    this.batch = [];

    // Process batch in parallel
    await Promise.all(
      requests.map(req => router.chat(req))
    );
  }
}
```

### 4. Connection Pooling

```typescript
// src/lib/ai/connection-pool.ts
class ConnectionPool {
  private a4fPool = new Map();
  private groqPool = new Map();
  private maxPoolSize = 50;

  getConnection(provider: AIProvider): OpenAI {
    const pool = provider === 'a4f' ? this.a4fPool : this.groqPool;
    
    if (pool.size < this.maxPoolSize) {
      const connection = this.createConnection(provider);
      pool.set(connection.id, connection);
      return connection;
    }

    // Reuse existing connection
    return Array.from(pool.values())[0];
  }

  private createConnection(provider: AIProvider): OpenAI {
    return new OpenAI({
      apiKey: provider === 'a4f' ? process.env.A4F_API_KEY : process.env.GROQ_API_KEY,
      baseURL: provider === 'a4f' ? process.env.A4F_BASE_URL : process.env.GROQ_BASE_URL,
    });
  }
}
```

---

## Cost Management

### Cost Tracking

```typescript
// src/lib/monitoring/cost-tracker.ts
interface CostMetrics {
  a4fCost: number;
  groqCost: number;
  totalCost: number;
  costPerRequest: number;
  costPerUser: Record<string, number>;
}

class CostTracker {
  // A4F pricing (example)
  private a4fPricing = {
    'provider-7/claude-opus-4-5': { input: 0.015, output: 0.075 },
    'provider-8/claude-sonnet-4.5': { input: 0.003, output: 0.015 },
  };

  // Groq pricing (free tier, but track for future)
  private groqPricing = {
    'llama-3.3-70b-versatile': { input: 0.0, output: 0.0 },
    'llama-3.1-8b-instant': { input: 0.0, output: 0.0 },
  };

  calculateCost(response: ChatResponse): number {
    const pricing = response.provider === 'a4f' 
      ? this.a4fPricing[response.model]
      : this.groqPricing[response.model];

    if (!pricing) return 0;

    const inputCost = (response.usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (response.usage.completion_tokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  async trackCost(userId: string, cost: number): Promise<void> {
    // Store in database or Redis
    await this.redis.hincrby('costs:daily', userId, Math.round(cost * 10000));
  }

  async getCostMetrics(): Promise<CostMetrics> {
    // Retrieve from database
    return {
      a4fCost: 0,
      groqCost: 0,
      totalCost: 0,
      costPerRequest: 0,
      costPerUser: {},
    };
  }
}
```

### Cost Optimization Strategies

1. **Use Groq for simple queries:**
   ```typescript
   const isSimpleQuery = request.messages[0].content.length < 100;
   if (isSimpleQuery) {
     request.provider = 'groq';
   }
   ```

2. **Implement caching aggressively:**
   ```typescript
   CACHE_TTL_SECONDS=3600  // 1 hour for common queries
   ```

3. **Batch similar requests:**
   ```typescript
   // Group similar requests and process together
   const batched = groupSimilarRequests(requests);
   ```

4. **Set per-user budgets:**
   ```typescript
   const userBudget = await getBudget(userId);
   if (userCost > userBudget) {
     throw new Error('Budget exceeded');
   }
   ```

---

## Disaster Recovery

### Backup Strategy

```bash
# 1. Backup Redis data
redis-cli -h 89.117.60.144 --rdb /backup/redis-dump.rdb

# 2. Backup environment variables
cp .env.production /backup/env-$(date +%Y%m%d).bak

# 3. Backup configuration
tar -czf /backup/config-$(date +%Y%m%d).tar.gz \
  src/lib/ai/*.ts \
  .env.production \
  package.json
```

### Rollback Plan

```bash
# 1. Identify issue
git log --oneline -10

# 2. Rollback to previous version
git checkout v0.9.0
npm run build
# Deploy

# 3. Verify rollback
curl https://aimasteryedu.in/api/ai/health

# 4. Notify users (if needed)
```

### Emergency Procedures

#### Scenario 1: Both Providers Down

```typescript
// Emergency fallback to cached responses
const EMERGENCY_FALLBACK = true;

if (EMERGENCY_FALLBACK) {
  // Return cached responses only
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Or return error with retry
  throw new Error('Service temporarily unavailable. Please retry.');
}
```

#### Scenario 2: Redis Down

```typescript
// Fallback to in-memory rate limiting
const inMemoryLimiter = new Map();

async function fallbackRateLimit(provider: string): Promise<boolean> {
  const key = `${provider}:${Date.now()}`;
  inMemoryLimiter.set(key, true);
  
  // Clean old entries
  for (const [k, v] of inMemoryLimiter.entries()) {
    if (Date.now() - parseInt(k.split(':')[1]) > 60000) {
      inMemoryLimiter.delete(k);
    }
  }
  
  const count = Array.from(inMemoryLimiter.keys())
    .filter(k => k.startsWith(provider))
    .length;
    
  return count < 10;
}
```

---

## Maintenance Schedule

### Daily Tasks
- [ ] Check error logs
- [ ] Verify metrics dashboard
- [ ] Review cost reports
- [ ] Check circuit breaker states

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Analyze fallback frequency
- [ ] Check Redis memory usage
- [ ] Update documentation

### Monthly Tasks
- [ ] Review and optimize model mappings
- [ ] Analyze cost trends
- [ ] Update rate limits based on usage
- [ ] Security audit

### Quarterly Tasks
- [ ] Major version updates
- [ ] Infrastructure review
- [ ] Performance optimization
- [ ] Disaster recovery drill

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Availability | 99.9% | < 99.5% |
| P95 Latency | < 2s | > 3s |
| Error Rate | < 1% | > 2% |
| Fallback Rate | < 20% | > 40% |
| Cache Hit Rate | > 30% | < 10% |
| Cost per Request | < $0.002 | > $0.005 |

---

## Support Contacts

- **Infrastructure Issues**: DevOps team
- **API Issues**: Backend team  
- **Cost Issues**: Finance team
- **Emergency**: On-call engineer

---

## Success Metrics

### Technical Metrics
✅ System uptime: 99.9%+
✅ Response time: P95 < 2s
✅ Error rate: < 1%
✅ Fallback success: 98%+
✅ Cache hit rate: 30%+

### Business Metrics
✅ User satisfaction: 4.5+ stars
✅ Cost per request: < $0.002
✅ API cost reduction: 40%+
✅ User retention: 85%+

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready 🚀
