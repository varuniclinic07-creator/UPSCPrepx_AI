# Phase 4: Enterprise Architecture - Implementation Report

**Date**: 2026-04-11  
**Status**: ✅ Completed  
**Phase**: Enterprise Architecture Layer

---

## Executive Summary

Phase 4 establishes a clean, layered enterprise architecture that separates concerns across API, Service, Worker, Cache, and Database layers. This architecture enables:

- **Testability**: Business logic isolated from HTTP handlers
- **Scalability**: Async job processing via BullMQ queues
- **Performance**: Redis caching with cache-aside pattern
- **Reliability**: Connection pooling with circuit breaker protection
- **Consistency**: Standardized API responses across all endpoints

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  (Next.js App Router - src/app/api/**/route.ts)                 │
│  - Request validation (Zod schemas)                              │
│  - Response formatting (standardized)                            │
│  - Rate limiting (Redis-based)                                   │
│  - Security headers (OWASP)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  (src/lib/services/*.service.ts)                                │
│  - PaymentService: Payment lifecycle, webhooks                   │
│  - SubscriptionService: Subscription management                  │
│  - BaseService: Timeout, retry, circuit breaker                  │
└─────────────────────────────────────────────────────────────────┘
                    ↓                       ↓
┌──────────────────────┐     ┌─────────────────────────────────┐
│    Worker Layer      │     │        Cache Layer              │
│  (BullMQ + Redis)    │     │   (Redis cache-aside)           │
│  - Email jobs        │     │   - Plan details (1hr)          │
│  - AI processing     │     │   - User subscription (1min)    │
│  - Invoice gen       │     │   - API responses (5min)        │
│  - Analytics         │     │   - Distributed locks           │
└──────────────────────┘     └─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                                │
│  (Supabase + Connection Pool)                                   │
│  - Connection pooling (2-20 connections)                         │
│  - Query optimization (pagination, sorting, filtering)           │
│  - Transaction management                                        │
│  - Row-Level Security (RLS)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### 1. Service Layer

#### `src/lib/services/base.service.ts`
Abstract base class providing:
- **Timeout protection**: Configurable per-service timeouts
- **Retry logic**: Exponential backoff with jitter
- **Circuit breaker**: Prevents cascading failures
- **Standardized error handling**: `ServiceResult<T>` pattern
- **Validation**: Zod schema integration

```typescript
abstract class BaseService {
    protected async execute<T>(operation: string, fn: () => Promise<T>);
    protected async safeExecute<T>(operation: string, fn: () => Promise<T>): Promise<ServiceResult<T>>;
    protected validate<T>(schema, data: unknown): T;
}
```

#### `src/lib/services/payment.service.ts`
Complete payment business logic:
- `initiatePayment()` - Creates payment record + Razorpay order
- `verifyPayment()` - Verifies signature, creates subscription, generates invoice
- `handleWebhook()` - Handles payment.captured, payment.failed, refund.created
- Idempotency protection for webhook events

#### `src/lib/services/subscription.service.ts`
Subscription management:
- `getSubscriptionStatus()` - RPC with direct query fallback
- `getPlans()` / `getPlanBySlug()` - Plan retrieval
- `upgradeSubscription()` - Extend or create subscription
- `cancelSubscription()` - Cancel at period end
- `hasFeatureAccess()` - Tier-based feature checks

### 2. Cache Layer

#### `src/lib/cache/redis-cache.ts`
Redis caching with cache-aside pattern:

**Core Functions**:
- `getFromCache<T>()` / `setInCache<T>()` - Basic operations
- `getOrSetCache<T>()` - Cache-aside pattern
- `acquireLock()` / `releaseLock()` / `extendLock()` - Distributed locking
- `increment()` / `decrement()` / `getCounter()` - Atomic counters

**Cache Presets**:
| Preset | TTL | Use Case |
|--------|-----|----------|
| apiResponse | 5min | API response caching |
| userSubscription | 1min | User subscription status |
| planDetails | 1hr | Subscription plan details |
| userProfile | 10min | User profile data |
| usageStats | 5min | Usage statistics |
| staticContent | 24hr | Static/immutable content |
| config | 1hr | Application configuration |
| rateLimit | 1min | Rate limit counters |
| dailyUsage | 24hr | Daily usage counters |

**Stats Tracking**:
```typescript
{
    hits: number;
    misses: number;
    errors: number;
}
```

### 3. Worker Layer

#### `src/lib/queue/worker-queue.ts`
BullMQ-based async job processing:

**Job Types** (20+ defined):
```typescript
enum JobType {
    // Email
    SEND_WELCOME_EMAIL, SEND_RENEWAL_REMINDER, 
    SEND_PAYMENT_CONFIRMATION, SEND_PASSWORD_RESET,
    
    // Subscription
    SUBSCRIPTION_EXPIRY_CHECK, SUBSCRIPTION_RENEWAL,
    TRIAL_EXPIRY_CHECK,
    
    // AI Processing
    GENERATE_NOTES, GENERATE_MIND_MAP, 
    EVALUATE_ANSWER, GENERATE_QUIZ,
    
    // Video
    GENERATE_VIDEO_SHORT, PROCESS_VIDEO,
    
    // Data
    GENERATE_INVOICE, EXPORT_USER_DATA, CLEANUP_TEMP_DATA,
    
    // Analytics
    TRACK_EVENT, UPDATE_METRICS,
}
```

**Default Job Options by Type**:
| Job Type | Priority | Retries | Backoff |
|----------|----------|---------|---------|
| Email (welcome/payment) | 10 | 3 | Exponential 1s |
| Subscription renewal | 8 | 3 | Exponential 2s |
| Invoice generation | 6 | 3 | Exponential 2s |
| AI jobs | 3 | 2 | Exponential 5s |
| Video jobs | 1 | 2 | Exponential 10s |
| Analytics tracking | 1 | 0 | None (fire-and-forget) |

**Queue Helpers**:
```typescript
QueueHelpers.sendWelcomeEmail(to, name);
QueueHelpers.generateNotes(userId, prompt, options);
QueueHelpers.generateInvoice(paymentId, userId);
QueueHelpers.trackEvent(event, userId, properties);
```

### 4. Database Layer

#### `src/lib/database/connection-pool.ts`
Connection pooling and query optimization:

**ConnectionPool Class**:
- Configurable pool size (min: 2, max: 20)
- Idle connection cleanup (30s timeout)
- Circuit breaker integration
- Pool statistics: `getStats()`

**Query Utilities**:
- `executeQuery<T>()` - Query with timeout/retry
- `executePaginatedQuery<T>()` - Paginated queries
- `executeTransaction<T>()` - Logical transaction grouping
- `executeBatch<T>()` - Batch query execution
- `executeDebouncedQuery<T>()` - Debounce duplicate queries
- `executeCachedQuery<T>()` - Query result caching

**Pagination Support**:
```typescript
interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
```

### 5. API Response Layer

#### `src/lib/api/response-formatter.ts`
Standardized API responses:

**Response Factories**:
```typescript
successResponse<T>(data, meta)      // 200 OK
createdResponse<T>(data, meta)      // 201 Created
noContentResponse()                  // 204 No Content
errorResponse(error, requestId)      // 500/4xx
validationErrorResponse(errors)      // 400 Bad Request
unauthorizedResponse(message)        // 401 Unauthorized
forbiddenResponse(message)           // 403 Forbidden
notFoundResponse(resource, id)       // 404 Not Found
conflictResponse(message)            // 409 Conflict
rateLimitResponse(retryAfter)        // 429 Too Many Requests
```

**Standard Response Format**:
```json
{
    "success": true,
    "data": { ... },
    "meta": {
        "requestId": "req_abc123",
        "timestamp": "2026-04-11T10:30:00Z",
        "duration": 145,
        "version": "1.0"
    }
}
```

**Error Response Format**:
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "details": {
            "errors": [
                { "field": "planSlug", "message": "Invalid format" }
            ]
        }
    },
    "meta": { ... }
}
```

**Pagination Helpers**:
- `paginatedResponse<T>()` - Paginated response factory
- `parsePaginationParams()` - Parse page/limit/offset
- `parseCursorPaginationParams()` - Cursor-based pagination
- `parseSortParams()` - Sort field/order parsing
- `parseFilterParams()` - Filter condition parsing
- `buildQuery<T>()` - Combined query builder

**Security Integration**:
- All responses include OWASP security headers
- Request ID generation for distributed tracing
- Response timing headers (X-Response-Time)

---

## Architecture Benefits Achieved

### 1. Separation of Concerns
| Layer | Responsibility |
|-------|----------------|
| API | HTTP handling, validation, response formatting |
| Service | Business logic, transactions, error handling |
| Worker | Async job processing, background tasks |
| Cache | Data caching, distributed locks |
| Database | Data persistence, connection management |

### 2. Resilience Patterns
- **Circuit Breaker**: Prevents cascading failures
- **Retry with Backoff**: Handles transient failures
- **Timeout Protection**: Prevents resource exhaustion
- **Fail-Open Caching**: Graceful degradation

### 3. Observability
- Request ID tracing across layers
- Structured logging with timing
- Cache hit/miss statistics
- Pool utilization metrics
- Queue job statistics

### 4. Performance Optimizations
- Connection pooling (2-20 connections)
- Multi-tier caching (API, subscription, plans)
- Async job processing (non-blocking)
- Query debouncing and batching

---

## Integration Guide

### Using Service Layer in API Routes

```typescript
// src/app/api/payments/initiate/route.ts
import { getPaymentService } from '@/lib/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api/response-formatter';

export async function POST(request: Request) {
    const paymentService = getPaymentService();
    const result = await paymentService.initiatePayment({
        userId,
        planSlug: 'standard',
        billingCycle: 'monthly',
    });
    
    if (result.success) {
        return successResponse(result.data);
    }
    return errorResponse(result.error);
}
```

### Using Cache Layer

```typescript
import { cache, CachePresets } from '@/lib/cache/redis-cache';

// Cache-aside pattern
const plan = await cache.getOrSet(
    `plan:${slug}`,
    async () => fetchPlanFromDb(slug),
    CachePresets.planDetails
);

// Distributed lock
const lock = await cache.acquireLock(`subscription:${userId}`, 30);
if (lock) {
    try {
        // Critical section
    } finally {
        await cache.releaseLock(`subscription:${userId}`, lock);
    }
}
```

### Using Worker Queue

```typescript
import { QueueHelpers } from '@/lib/queue/worker-queue';

// After payment success
await QueueHelpers.sendWelcomeEmail(user.email, user.name);
await QueueHelpers.generateInvoice(paymentId, userId);

// AI processing
await QueueHelpers.generateNotes(userId, prompt, options);
```

### Using Connection Pool

```typescript
import { withClient, executePaginatedQuery } from '@/lib/database/connection-pool';

// Automatic connection management
const users = await withClient(async (client) => {
    const { data } = await client.from('users').select('*').limit(10);
    return data;
});

// Paginated query
const result = await executePaginatedQuery(
    'listUsers',
    async (client, { offset, limit }) => {
        return client.from('users').select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);
    },
    { page: 1, limit: 20 }
);
```

---

## Testing Recommendations

### Unit Tests
```typescript
// Service layer tests
describe('PaymentService', () => {
    it('should initiate payment with valid request');
    it('should verify payment signature correctly');
    it('should handle webhook events idempotently');
});

// Cache layer tests
describe('RedisCache', () => {
    it('should return cached value on hit');
    it('should fetch and cache on miss');
    it('should acquire and release distributed locks');
});
```

### Integration Tests
```typescript
// Full flow tests
describe('Payment Flow', () => {
    it('should complete payment and create subscription');
    it('should handle payment failure gracefully');
    it('should process webhook events correctly');
});
```

---

## Next Steps: Phase 5

Phase 5 will focus on **Repo Structure + Docker**:

1. **Monorepo Structure**
   - Separate apps (web, api, worker)
   - Shared packages (utils, types)
   - Service isolation

2. **Docker Configuration**
   - Dockerfile for web (Next.js)
   - Dockerfile for API
   - Dockerfile for worker
   - Multi-stage builds

3. **Docker Compose**
   - Local development setup
   - Service dependencies (Redis, Supabase)
   - Network isolation

4. **Environment Separation**
   - .env.development
   - .env.production
   - .env.docker template

---

## Files Modified/Created Summary

| File | Type | Purpose |
|------|------|---------|
| `src/lib/services/base.service.ts` | Created | Abstract base service |
| `src/lib/services/payment.service.ts` | Created | Payment business logic |
| `src/lib/services/subscription.service.ts` | Created | Subscription business logic |
| `src/lib/cache/redis-cache.ts` | Created | Redis caching layer |
| `src/lib/queue/worker-queue.ts` | Created | BullMQ worker queue |
| `src/lib/database/connection-pool.ts` | Created | Connection pooling |
| `src/lib/api/response-formatter.ts` | Created | Standardized responses |

---

**Phase 4 Status**: ✅ Complete

The enterprise architecture is now in place with clean separation of concerns, resilience patterns, and standardized interfaces across all layers.
