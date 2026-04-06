# 🧪 AI PROVIDER ROUTER - TESTING & VALIDATION GUIDE

## Quick Test Commands

```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- provider-router.test.ts
```

---

## Test Suite Structure

```
__tests__/
├── unit/
│   ├── model-mapper.test.ts
│   ├── rate-limiter.test.ts
│   ├── circuit-breaker.test.ts
│   └── providers/
│       ├── a4f-client.test.ts
│       └── groq-client.test.ts
├── integration/
│   ├── provider-router.test.ts
│   ├── fallback.test.ts
│   └── rate-limiting.test.ts
└── load/
    ├── concurrent-users.test.ts
    └── rate-limit-stress.test.ts
```

---

## Unit Tests

### 1. Model Mapper Tests

```typescript
// __tests__/unit/model-mapper.test.ts
import { ModelMapper } from '@/lib/ai/model-mapper';

describe('ModelMapper', () => {
  test('maps Claude Opus to Llama 3.3 70B', () => {
    const result = ModelMapper.mapToGroq('provider-7/claude-opus-4-5-20251101');
    expect(result).toBe('llama-3.3-70b-versatile');
  });

  test('maps Claude Sonnet to Llama 3.3 70B', () => {
    const result = ModelMapper.mapToGroq('provider-8/claude-sonnet-4.5');
    expect(result).toBe('llama-3.3-70b-versatile');
  });

  test('maps reasoning models to DeepSeek', () => {
    const result = ModelMapper.mapToGroq('provider-2/kimi-k2-thinking-tee');
    expect(result).toBe('deepseek-r1-distill-llama-70b');
  });

  test('maps coding models to Llama 8B', () => {
    const result = ModelMapper.mapToGroq('provider-3/qwen-3-coder');
    expect(result).toBe('llama-3.1-8b-instant');
  });

  test('uses default for unknown models', () => {
    const result = ModelMapper.mapToGroq('unknown-model');
    expect(result).toBe('llama-3.3-70b-versatile');
  });

  test('identifies reasoning models correctly', () => {
    expect(ModelMapper.isReasoningModel('kimi-k2-thinking')).toBe(true);
    expect(ModelMapper.isReasoningModel('deepseek-r1')).toBe(true);
    expect(ModelMapper.isReasoningModel('claude-sonnet')).toBe(false);
  });

  test('identifies coding models correctly', () => {
    expect(ModelMapper.isCodingModel('qwen-3-coder')).toBe(true);
    expect(ModelMapper.isCodingModel('claude-opus')).toBe(false);
  });

  test('adapts temperature for Groq', () => {
    expect(ModelMapper.adaptTemperature(0.9, 'a4f', 'groq')).toBe(0.7);
    expect(ModelMapper.adaptTemperature(0.5, 'a4f', 'groq')).toBe(0.5);
  });
});
```

---

### 2. Rate Limiter Tests

```typescript
// __tests__/unit/rate-limiter.test.ts
import { DistributedRateLimiter } from '@/lib/ai/rate-limiter';
import Redis from 'ioredis-mock';

describe('DistributedRateLimiter', () => {
  let rateLimiter: DistributedRateLimiter;

  beforeEach(() => {
    // Use mock Redis for testing
    rateLimiter = new DistributedRateLimiter('redis://localhost:6379');
  });

  afterEach(async () => {
    await rateLimiter.close();
  });

  test('allows requests within limit', async () => {
    const result = await rateLimiter.checkLimit('a4f');
    expect(result.allowed).toBe(true);
    expect(result.remainingRequests).toBe(10);
  });

  test('consumes tokens correctly', async () => {
    await rateLimiter.consumeToken('a4f', 'req-1');
    await rateLimiter.consumeToken('a4f', 'req-2');
    
    const result = await rateLimiter.checkLimit('a4f');
    expect(result.remainingRequests).toBe(8);
  });

  test('blocks requests after limit', async () => {
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      await rateLimiter.consumeToken('a4f', `req-${i}`);
    }
    
    const result = await rateLimiter.checkLimit('a4f');
    expect(result.allowed).toBe(false);
    expect(result.remainingRequests).toBe(0);
  });

  test('tracks concurrent requests', async () => {
    await rateLimiter.trackConcurrent('a4f', 1);
    await rateLimiter.trackConcurrent('a4f', 1);
    
    const count = await rateLimiter.getConcurrentCount('a4f');
    expect(count).toBe(2);
    
    await rateLimiter.trackConcurrent('a4f', -1);
    const afterRelease = await rateLimiter.getConcurrentCount('a4f');
    expect(afterRelease).toBe(1);
  });

  test('different providers have separate limits', async () => {
    await rateLimiter.consumeToken('a4f', 'req-1');
    await rateLimiter.consumeToken('groq', 'req-2');
    
    const a4fResult = await rateLimiter.checkLimit('a4f');
    const groqResult = await rateLimiter.checkLimit('groq');
    
    expect(a4fResult.remainingRequests).toBe(9);
    expect(groqResult.remainingRequests).toBe(29);
  });
});
```

---

### 3. Circuit Breaker Tests

```typescript
// __tests__/unit/circuit-breaker.test.ts
import { CircuitBreaker } from '@/lib/ai/circuit-breaker';

describe('CircuitBreaker', () => {
  test('starts in CLOSED state', () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
    }, 'a4f');
    
    expect(breaker.getState()).toBe('CLOSED');
  });

  test('opens after threshold failures', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
    }, 'a4f');
    
    const failingFn = async () => {
      throw new Error('Test failure');
    };
    
    // Trigger failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch (e) {
        // Expected
      }
    }
    
    expect(breaker.getState()).toBe('OPEN');
  });

  test('transitions to HALF_OPEN after timeout', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 100, // Short timeout for testing
    }, 'a4f');
    
    const failingFn = async () => {
      throw new Error('Test failure');
    };
    
    // Open the circuit
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(failingFn);
      } catch (e) {}
    }
    
    expect(breaker.getState()).toBe('OPEN');
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should be HALF_OPEN on next attempt
    const successFn = async () => 'success';
    await breaker.execute(successFn);
    
    expect(breaker.getState()).toBe('HALF_OPEN');
  });

  test('closes after successful attempts in HALF_OPEN', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 100,
    }, 'a4f');
    
    // Open circuit
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => { throw new Error(); });
      } catch (e) {}
    }
    
    // Wait and transition to HALF_OPEN
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Execute successful requests
    const successFn = async () => 'success';
    await breaker.execute(successFn);
    await breaker.execute(successFn);
    
    expect(breaker.getState()).toBe('CLOSED');
  });
});
```

---

## Integration Tests

### 4. Provider Router Integration Tests

```typescript
// __tests__/integration/provider-router.test.ts
import { AIProviderRouter } from '@/lib/ai/provider-router';
import { ChatRequest } from '@/types/ai-providers';

describe('AIProviderRouter Integration', () => {
  let router: AIProviderRouter;

  beforeAll(() => {
    router = new AIProviderRouter();
  });

  afterAll(async () => {
    await router.close();
  });

  test('routes to A4F when available', async () => {
    const request: ChatRequest = {
      model: 'provider-8/claude-sonnet-4.5',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
    };

    const response = await router.chat(request);
    
    expect(response.provider).toBe('a4f');
    expect(response.fallbackUsed).toBe(false);
    expect(response.choices.length).toBeGreaterThan(0);
  });

  test('falls back to Groq when A4F rate limited', async () => {
    const request: ChatRequest = {
      model: 'provider-8/claude-sonnet-4.5',
      messages: [
        { role: 'user', content: 'Test message' }
      ],
    };

    // Make 11 requests to exceed A4F limit
    const responses = [];
    for (let i = 0; i < 11; i++) {
      responses.push(await router.chat(request));
    }

    // Check that at least one used Groq
    const groqUsed = responses.some(r => r.provider === 'groq');
    expect(groqUsed).toBe(true);
  });

  test('respects forced provider', async () => {
    const request: ChatRequest = {
      model: 'provider-8/claude-sonnet-4.5',
      messages: [
        { role: 'user', content: 'Test' }
      ],
      provider: 'groq',
    };

    const response = await router.chat(request);
    expect(response.provider).toBe('groq');
  });

  test('returns health status correctly', async () => {
    const health = await router.checkHealth();
    
    expect(health).toHaveProperty('a4f');
    expect(health).toHaveProperty('groq');
    expect(health.a4f).toHaveProperty('isHealthy');
    expect(health.a4f).toHaveProperty('remainingRequests');
    expect(health.a4f).toHaveProperty('circuitState');
  });
});
```

---

### 5. Fallback Behavior Tests

```typescript
// __tests__/integration/fallback.test.ts
import { AIProviderRouter } from '@/lib/ai/provider-router';

describe('Fallback Behavior', () => {
  let router: AIProviderRouter;

  beforeAll(() => {
    router = new AIProviderRouter();
  });

  afterAll(async () => {
    await router.close();
  });

  test('successfully uses Groq when A4F fails', async () => {
    // Simulate A4F failure by exhausting rate limit
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(
        router.chat({
          model: 'provider-8/claude-sonnet-4.5',
          messages: [{ role: 'user', content: `Test ${i}` }],
        })
      );
    }

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(r => r.status === 'fulfilled').length;
    
    // All requests should succeed (some via A4F, some via Groq)
    expect(successful).toBe(15);
  });

  test('maintains response quality with Groq fallback', async () => {
    const request = {
      model: 'provider-8/claude-sonnet-4.5',
      messages: [
        { role: 'user', content: 'Explain federalism in India' }
      ],
      provider: 'groq' as const,
    };

    const response = await router.chat(request);
    
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].message.content.length).toBeGreaterThan(50);
  });
});
```

---

## Load Tests

### 6. Concurrent Users Test

```typescript
// __tests__/load/concurrent-users.test.ts
import { AIProviderRouter } from '@/lib/ai/provider-router';

describe('Concurrent Users Load Test', () => {
  test('handles 100 concurrent requests', async () => {
    const router = new AIProviderRouter();
    const requests = [];

    for (let i = 0; i < 100; i++) {
      requests.push(
        router.chat({
          model: 'provider-8/claude-sonnet-4.5',
          messages: [
            { role: 'user', content: `Request ${i}` }
          ],
          userId: `user-${i}`,
        })
      );
    }

    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();

    const successful = responses.filter(r => r.status === 'fulfilled').length;
    const failed = responses.filter(r => r.status === 'rejected').length;

    console.log(`
      Total requests: 100
      Successful: ${successful}
      Failed: ${failed}
      Total time: ${endTime - startTime}ms
      Average time per request: ${(endTime - startTime) / 100}ms
    `);

    // At least 95% should succeed
    expect(successful).toBeGreaterThanOrEqual(95);
    
    await router.close();
  }, 60000); // 60 second timeout
});
```

---

### 7. Rate Limit Stress Test

```typescript
// __tests__/load/rate-limit-stress.test.ts
import { AIProviderRouter } from '@/lib/ai/provider-router';

describe('Rate Limit Stress Test', () => {
  test('correctly enforces rate limits under stress', async () => {
    const router = new AIProviderRouter();
    const results = {
      a4f: 0,
      groq: 0,
      failed: 0,
    };

    // Make 50 rapid requests
    for (let i = 0; i < 50; i++) {
      try {
        const response = await router.chat({
          model: 'provider-8/claude-sonnet-4.5',
          messages: [{ role: 'user', content: `Test ${i}` }],
        });
        
        results[response.provider]++;
      } catch (error) {
        results.failed++;
      }
    }

    console.log(`
      A4F requests: ${results.a4f}
      Groq requests: ${results.groq}
      Failed requests: ${results.failed}
    `);

    // A4F should be limited to ~10 requests
    expect(results.a4f).toBeLessThanOrEqual(12);
    
    // Most should go to Groq
    expect(results.groq).toBeGreaterThan(30);
    
    // Very few should fail
    expect(results.failed).toBeLessThan(5);
    
    await router.close();
  }, 60000);
});
```

---

## Manual Testing Checklist

### Basic Functionality
- [ ] Can make successful requests to A4F
- [ ] Can make successful requests to Groq
- [ ] Model mapping works correctly
- [ ] Temperature adaptation works
- [ ] Streaming responses work
- [ ] Error handling works

### Rate Limiting
- [ ] A4F requests are limited to 10/minute
- [ ] Groq requests are limited to 30/minute
- [ ] Rate limits reset after 1 minute
- [ ] Concurrent request tracking works
- [ ] User-specific quotas work (if implemented)

### Fallback Behavior
- [ ] Automatically falls back to Groq when A4F rate limited
- [ ] Fallback responses are valid and complete
- [ ] Fallback flag is set correctly
- [ ] Circuit breaker prevents cascading failures
- [ ] Manual provider selection works

### Performance
- [ ] Response time < 3 seconds (p95)
- [ ] Can handle 100+ concurrent requests
- [ ] No memory leaks after extended use
- [ ] Redis connections are cleaned up
- [ ] Circuit breaker recovers correctly

### Monitoring
- [ ] Metrics are tracked correctly
- [ ] Health checks return accurate data
- [ ] Errors are logged properly
- [ ] Alerts trigger on failures
- [ ] Dashboard shows real-time stats

---

## Test Data Generator

```typescript
// __tests__/helpers/test-data.ts
export const UPSC_TEST_PROMPTS = [
  'Explain the concept of federalism in India',
  'What are the fundamental rights?',
  'Discuss the role of the Prime Minister',
  'Explain judicial review',
  'What is the significance of the Preamble?',
  'Discuss the amendment procedure',
  'Explain the emergency provisions',
  'What is the Election Commission?',
  'Discuss the role of the President',
  'Explain the Union-State relations',
];

export function generateTestRequest(index: number) {
  return {
    model: 'provider-8/claude-sonnet-4.5',
    messages: [
      { role: 'user', content: UPSC_TEST_PROMPTS[index % UPSC_TEST_PROMPTS.length] }
    ],
    userId: `test-user-${index}`,
  };
}
```

---

## Performance Benchmarking

```typescript
// __tests__/benchmark/performance.test.ts
import { performance } from 'perf_hooks';
import { AIProviderRouter } from '@/lib/ai/provider-router';

describe('Performance Benchmarks', () => {
  test('measures average response time', async () => {
    const router = new AIProviderRouter();
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await router.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [{ role: 'user', content: 'Quick test' }],
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    console.log(`
      Average response time: ${avg.toFixed(2)}ms
      P95 response time: ${p95.toFixed(2)}ms
      Min: ${Math.min(...times).toFixed(2)}ms
      Max: ${Math.max(...times).toFixed(2)}ms
    `);

    expect(p95).toBeLessThan(3000); // P95 should be under 3 seconds
    
    await router.close();
  });
});
```

---

## CI/CD Integration

```yaml
# .github/workflows/ai-router-tests.yml
name: AI Router Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- __tests__/unit
      
      - name: Run integration tests
        run: npm test -- __tests__/integration
        env:
          A4F_API_KEY: ${{ secrets.A4F_API_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Monitoring Tests

```typescript
// __tests__/integration/monitoring.test.ts
import { AIProviderRouter } from '@/lib/ai/provider-router';

describe('Monitoring Integration', () => {
  test('tracks metrics correctly', async () => {
    const router = new AIProviderRouter();
    
    // Make some requests
    await router.chat({
      model: 'provider-8/claude-sonnet-4.5',
      messages: [{ role: 'user', content: 'Test' }],
    });

    const health = await router.checkHealth();
    
    expect(health.a4f.remainingRequests).toBeLessThan(10);
    expect(health.a4f.isHealthy).toBe(true);
    
    await router.close();
  });
});
```

---

## 🎯 Test Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All critical paths
- **Load Tests**: 100,000+ concurrent users
- **Performance Tests**: P95 < 3 seconds
- **Error Handling**: All error types covered

---

## 🚨 Common Test Failures & Solutions

### Issue: Rate limiter not working in tests
**Solution**: Ensure Redis is running and accessible
```bash
docker run -d -p 6379:6379 redis:7
```

### Issue: API keys not found
**Solution**: Set environment variables for tests
```bash
export A4F_API_KEY=your_key
export GROQ_API_KEY=your_key
export REDIS_URL=redis://localhost:6379
```

### Issue: Tests timeout
**Solution**: Increase Jest timeout
```javascript
jest.setTimeout(30000); // 30 seconds
```

### Issue: Concurrent test failures
**Solution**: Use separate Redis databases for tests
```typescript
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 15, // Use different DB for tests
});
```

---

## 📊 Expected Test Results

### Unit Tests
- **Model Mapper**: 100% pass
- **Rate Limiter**: 100% pass
- **Circuit Breaker**: 100% pass
- **Clients**: 100% pass

### Integration Tests
- **Provider Router**: 100% pass
- **Fallback**: 100% pass
- **Rate Limiting**: 100% pass

### Load Tests
- **100 concurrent users**: 95%+ success rate
- **Rate limit stress**: <5% failures
- **Performance**: P95 < 3 seconds

---

**Run all tests**: `npm test`
**Generate coverage**: `npm test -- --coverage`
**Watch mode**: `npm test -- --watch`
