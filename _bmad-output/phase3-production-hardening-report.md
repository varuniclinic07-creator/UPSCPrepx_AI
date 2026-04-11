# Phase 3: Production Hardening Implementation Report

**Date:** 2026-04-11  
**Status:** ✅ COMPLETE

---

## Executive Summary

Phase 3 has been successfully completed, implementing production-grade hardening for the UPSC CSE Master platform. The system now includes:

- Redis-based rate limiting with configurable presets
- Comprehensive input validation using Zod schemas
- Centralized error handling with typed error classes
- Structured logging with Pino (console fallback)
- Timeout, retry, and circuit breaker patterns
- Security headers, CORS, CSRF, and input sanitization

---

## 1. Rate Limiting System

### `src/lib/rate-limit/redis-rate-limiter.ts`

**Features:**
- Redis-backed rate limiting using `ioredis` (already installed)
- Atomic operations with Redis pipelines
- Exponential backoff with jitter
- Fail-open behavior (allows requests if Redis is unavailable)
- Configurable presets for different route types

**Rate Limit Presets:**

| Preset | Max Requests | Window | Block Duration | Use Case |
|--------|--------------|--------|----------------|----------|
| `api` | 100 | 60s | 60s | General API routes |
| `auth` | 5 | 60s | 300s | Login/register endpoints |
| `payment` | 10 | 60s | 600s | Payment APIs |
| `ai` | 20 | 60s | 120s | AI generation endpoints |
| `webhook` | 50 | 60s | 60s | Webhook handlers |
| `free` | 30 | 60s | 60s | Free tier users |
| `premium` | 200 | 60s | 60s | Premium users |
| `admin` | 50 | 60s | 60s | Admin endpoints |

**Usage:**
```typescript
import { checkRateLimit, RateLimitPresets, enforceRateLimit } from '@/lib/rate-limit/redis-rate-limiter';

// Simple check
const result = await checkRateLimit(`user:${userId}`, RateLimitPresets.api);
if (!result.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { 
        status: 429,
        headers: getRateLimitHeaders(result)
    });
}

// Or throw on failure
await enforceRateLimit(`user:${userId}`, RateLimitPresets.auth);
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712851200
Retry-After: 45  (when rate limited)
```

---

## 2. Input Validation (Zod)

### `src/lib/validation/schemas.ts`

**Schema Categories:**

### Common Schemas
- `uuidSchema` - UUID format validation
- `emailSchema` - Email validation
- `passwordSchema` - Strong password requirements
- `phoneSchema` - Indian phone format
- `paginationSchema` - Page/limit validation
- `sortingSchema` - Sort field/direction

### Payment Schemas
- `paymentInitiateSchema` - Plan slug, billing cycle
- `paymentVerifySchema` - Payment IDs, signatures
- `razorpayWebhookSchema` - Webhook payload structure
- `billingCycleSchema` - monthly/quarterly/yearly

### User Schemas
- `userUpdateSchema` - Profile updates
- `userPreferencesSchema` - Theme, language, notifications

### AI/Feature Schemas
- `featureKeySchema` - Allowed feature names
- `usageRecordSchema` - Usage tracking data
- `aiChatSchema` - Chat message validation
- `notesGenerateSchema` - Notes generation params
- `mcqPracticeSchema` - Quiz parameters
- `mainsEvalSchema` - Answer evaluation

### Auth Schemas
- `loginSchema` - Email/password login
- `registerSchema` - Registration with strong password
- `passwordResetSchema` - Token-based reset

### Helper Functions
```typescript
import { validateBody, validateQuery, ValidationError, sanitizeString } from '@/lib/validation/schemas';

// Validate request body
const data = validateBody(paymentInitiateSchema, requestBody);

// Validate query params
const filters = validateQuery(currentAffairsFilterSchema, request.query);

// Sanitize user input
const cleanInput = sanitizeString(userInput);
const cleanObject = sanitizeObject(userObject);
```

---

## 3. Centralized Error Handling

### `src/lib/errors/app-error.ts`

**Error Code Enum:**
```typescript
enum ErrorCode {
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
    USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
    // ... and more
}
```

**Error Classes:**
| Class | HTTP Code | Use Case |
|-------|-----------|----------|
| `AppError` | Variable | Base error class |
| `ValidationError` | 400 | Input validation failures |
| `NotFoundError` | 404 | Resource not found |
| `UnauthorizedError` | 401 | Authentication required |
| `ForbiddenError` | 403 | Access denied |
| `RateLimitError` | 429 | Rate limit exceeded |
| `PaymentError` | 400 | Payment failures |
| `SubscriptionError` | 404 | Subscription issues |
| `UsageLimitError` | 429 | Free tier limits |
| `TimeoutError` | 408 | Operation timeout |
| `ExternalServiceError` | 502 | Third-party failures |
| `DatabaseError` | 500 | Database errors |

**Usage:**
```typescript
import { 
    createValidationError, 
    createNotFoundError, 
    createPaymentError,
    handleError 
} from '@/lib/errors/app-error';

// Throw typed errors
throw createValidationError('Invalid input', [
    { field: 'email', message: 'Invalid email format' }
]);

throw createNotFoundError('User', userId);

throw createPaymentError('Payment failed', { razorpayError: error });

// Handle errors in API routes
try {
    // ... operation
} catch (error) {
    const response = handleError(error);
    return NextResponse.json(response, { status: 400 });
}
```

**Standard Error Response:**
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validation failed",
        "statusCode": 400,
        "timestamp": "2026-04-11T10:30:00Z",
        "metadata": {
            "errors": [
                { "field": "email", "message": "Invalid email format" }
            ]
        }
    }
}
```

---

## 4. Structured Logging

### `src/lib/logging/logger.ts`

**Features:**
- Pino integration (auto-falls back to console if not installed)
- Structured JSON logging for log aggregation
- Request/response logging with duration
- Error logging with stack traces
- Child loggers with pre-populated context
- Performance measurement utility
- Audit logging for security events

**Log Levels:**
- `debug` - Detailed debugging info
- `info` - General operational info
- `warn` - Warning conditions
- `error` - Error conditions with stack trace
- `fatal` - Critical failures

**Usage:**
```typescript
import { logger, measure, logAudit } from '@/lib/logging/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.warn('High memory usage', { memory: 85 });
logger.error('Database connection failed', { database: 'users' }, error);

// Child logger
const paymentLogger = logger.child({ service: 'payments' });
paymentLogger.info('Payment initiated');

// Measure execution time
const result = await measure(
    'generate-notes',
    async () => generateNotes(topic),
    { userId }
);

// Audit logging
logAudit({
    action: 'USER_LOGIN',
    userId: '123',
    resource: 'auth',
    ipAddress: req.ip,
    userAgent: req.headers.get('user-agent'),
});
```

**Log Output Format:**
```json
{
    "level": "INFO",
    "message": "API Response",
    "timestamp": "2026-04-11T10:30:00Z",
    "service": "upsc-cse-master",
    "environment": "production",
    "context": {
        "requestId": "abc123",
        "method": "POST",
        "route": "/api/payments/initiate",
        "status": 200,
        "duration": 245,
        "durationUnit": "ms"
    }
}
```

---

## 5. Timeout and Retry System

### `src/lib/async/timeout-retry.ts`

**Features:**
- Promise timeout with configurable duration
- Retry with exponential backoff and jitter
- Circuit breaker pattern for failing services
- Combined resilient execution

**Timeout:**
```typescript
import { withTimeout, executeWithTimeout, TimeoutError } from '@/lib/async/timeout-retry';

// Wrap a promise with timeout
const result = await withTimeout(
    fetchExternalAPI(),
    { timeoutMs: 5000, operationName: 'External API Call' }
);

// Execute function with timeout
const data = await executeWithTimeout(
    async () => generateAIResponse(prompt),
    { timeoutMs: 30000, operationName: 'AI Generation' }
);
```

**Retry with Exponential Backoff:**
```typescript
import { withRetry } from '@/lib/async/timeout-retry';

const { result, attempts, totalDurationMs } = await withRetry(
    async () => fetchUserData(userId),
    {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        factor: 2,
        operationName: 'Fetch User Data',
        onRetry: (attempt, error) => {
            logger.warn(`Retry attempt ${attempt}`, { error: error.message });
        }
    }
);
```

**Circuit Breaker:**
```typescript
import { CircuitBreaker, CircuitState } from '@/lib/async/timeout-retry';

const breaker = new CircuitBreaker({
    failureThreshold: 5,     // Open after 5 failures
    successThreshold: 2,     // Close after 2 successes
    timeoutMs: 60000,        // Try again after 60s
    operationName: 'AI Service',
});

try {
    const result = await breaker.execute(() => callAIService(prompt));
} catch (error) {
    if (error instanceof CircuitBreakerError) {
        // Service is circuit broken - fail fast
        logger.warn('AI service circuit open');
    }
}
```

**Default Timeouts:**
```typescript
defaultTimeouts = {
    api: 10000,           // 10 seconds
    database: 5000,       // 5 seconds
    ai: 30000,            // 30 seconds
    file: 60000,          // 60 seconds
    webhook: 5000,        // 5 seconds
};
```

---

## 6. Security Headers and Protection

### `src/lib/security/headers.ts`

**Security Headers Applied:**

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict CSP with Razorpay allowance | Prevent XSS, injection |
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | Legacy XSS protection |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control referrer info |
| `Permissions-Policy` | Disable all sensitive features | Limit browser capabilities |

**CORS Protection:**
```typescript
import { isAllowedOrigin, handleCorsPreflight } from '@/lib/security/headers';

// Validate origin
const allowed = isAllowedOrigin(origin, [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
]);

// Handle preflight
if (request.method === 'OPTIONS') {
    return handleCorsPreflight(request);
}
```

**CSRF Protection:**
```typescript
import { generateCsrfToken, validateCsrfToken, setCsrfTokenCookie } from '@/lib/security/headers';

// Generate and set token
const token = generateCsrfToken();
setCsrfTokenCookie(response, token);

// Validate on form submissions
const isValid = validateCsrfToken(request.headers.get('x-csrf-token'), expectedToken);
```

**Input Sanitization:**
```typescript
import { sanitizeHtml, sanitizeInput, validateFileUpload } from '@/lib/security/headers';

// Sanitize strings
const clean = sanitizeHtml(userInput);

// Sanitize objects recursively
const cleanObj = sanitizeInput({ name: userInput, data: nestedInput });

// Validate file uploads
const validation = validateFileUpload(filename, 10 * 1024 * 1024, ['pdf', 'png', 'jpg']);
```

---

## 7. Updated Middleware

### `src/middleware.ts`

**Middleware Pipeline:**

1. **Skip List** - Static assets, health checks
2. **CORS Handling** - Validate origins, handle preflight
3. **Security Headers** - Apply OWASP headers
4. **Rate Limiting** - Check limits per IP
5. **Request Validation** - Validate Content-Type
6. **Authentication** - Session checks for protected routes
7. **Authorization** - Admin role verification
8. **Logging** - Request/response logging with duration

**Request ID Generation:**
- Each request gets a unique ID for tracing
- Added to `x-request-id` header
- Included in all log entries

**Rate Limit Response:**
```json
{
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many requests. Please try again later.",
        "retryAfter": 45
    }
}
```

---

## 8. Files Created/Modified

### New Files
```
src/lib/rate-limit/redis-rate-limiter.ts
src/lib/validation/schemas.ts (comprehensive rewrite)
src/lib/errors/app-error.ts
src/lib/logging/logger.ts
src/lib/async/timeout-retry.ts
src/lib/security/headers.ts
_bmad-output/phase3-production-hardening-report.md
```

### Modified Files
```
src/middleware.ts (complete rewrite with security pipeline)
src/app/api/payments/initiate/route.ts (with validation and error handling)
```

---

## 9. Dependencies

### Required (Already Installed)
- `ioredis` - Redis client for rate limiting
- `zod` - Schema validation

### Optional (Recommended)
```bash
npm install pino pino-pretty
```

If Pino is not installed, the logger automatically falls back to structured console logging.

---

## 10. Environment Variables

```bash
# Redis (Required for rate limiting)
REDIS_URL=redis://:password@host:6379

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Cron (for scheduled jobs)
CRON_SECRET=your-secret-here
```

---

## 11. Testing

### Rate Limiting Test
```bash
# Rapid requests to test rate limiting
for i in {1..15}; do
    curl -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}'
done
```

### Validation Test
```bash
# Invalid plan slug
curl -X POST http://localhost:3000/api/payments/initiate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"planSlug": "INVALID_PLAN"}'
```

---

## 12. Security Checklist

- [x] Content Security Policy headers
- [x] HSTS enabled
- [x] X-Frame-Options (clickjacking protection)
- [x] X-Content-Type-Options (MIME sniffing)
- [x] CORS origin validation
- [x] CSRF token generation/validation
- [x] Input sanitization (XSS prevention)
- [x] Rate limiting on all API routes
- [x] Authentication on protected routes
- [x] Authorization checks for admin routes
- [x] Request logging with request IDs
- [x] Error handling without information leakage

---

## 13. Next Steps (Phase 4)

Phase 4 (Enterprise Architecture) will add:
- Service layer abstraction
- Worker queue for async jobs
- Redis caching layer
- API response caching
- Database connection pooling optimization

---

**Phase 3 Complete ✅**

The system is now production-hardened with:
- Rate limiting to prevent abuse
- Input validation to prevent injection attacks
- Centralized error handling for consistent responses
- Structured logging for observability
- Timeout/retry/circuit breaker for resilience
- Security headers and CORS/CSRF protection

Ready to proceed to Phase 4: Enterprise Architecture.
