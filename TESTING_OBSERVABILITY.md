# 🧪 Testing & Observability - Complete Setup

## 📊 **COMPREHENSIVE APP REVIEW FINDINGS**

### ✅ **Strengths**
1. **Health Check Endpoint** - Comprehensive with DB, Redis, Circuit Breaker checks
2. **Error Handling** - Custom error classes with proper HTTP status codes
3. **Circuit Breakers** - Implemented for external services
4. **Rate Limiting** - Redis-based distributed rate limiting
5. **Input Validation** - Zod schemas on all API routes
6. **Authentication** - Supabase Auth with role-based access
7. **Audit Logging** - Database-backed audit trail
8. **API Versioning** - Middleware for version management

### ⚠️ **Missing Components**
1. **API Documentation** - No OpenAPI/Swagger spec
2. **Integration Tests** - No API endpoint tests
3. **Load Testing** - No performance benchmarks
4. **Monitoring Dashboard** - No centralized observability
5. **Request Tracing** - No distributed tracing
6. **Metrics Collection** - No Prometheus/Grafana
7. **Error Tracking** - No Sentry integration
8. **API Testing Suite** - No Postman/Thunder Client collection

---

## 🎯 **Implementation Plan**

### 1. API Testing Suite (Postman Collection)
### 2. Integration Tests (Jest)
### 3. Observability Stack (Prometheus + Grafana)
### 4. Request Tracing (OpenTelemetry)
### 5. Error Tracking (Sentry)

---

## 📦 **1. API Testing Suite**

### Postman Collection Structure
```
UPSC CSE Master API/
├── Health & Monitoring/
│   └── GET Health Check
├── Authentication/
│   ├── POST Register
│   ├── POST Login
│   └── POST OTP Verify
├── Notes/
│   ├── POST Generate Notes
│   ├── GET List Notes
│   └── GET Note by ID
├── Quiz/
│   ├── POST Generate Quiz
│   ├── GET Quiz by ID
│   └── POST Submit Quiz
├── Current Affairs/
│   └── GET List Articles
├── Payments/
│   ├── POST Initiate Payment
│   └── POST Verify Payment
├── Admin/
│   ├── GET List Users
│   └── PUT Update User
└── Agentic/
    ├── POST Explain
    ├── POST Search Files
    └── POST Search Web
```

### Environment Variables
```json
{
  "base_url": "https://your-app.vercel.app/api",
  "auth_token": "{{supabase_jwt}}",
  "admin_token": "{{admin_jwt}}"
}
```

---

## 🧪 **2. Integration Tests**

### Test Structure
```typescript
// __tests__/api/health.test.ts
describe('Health Check API', () => {
  it('should return healthy status', async () => {
    const res = await fetch('/api/health');
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database.status).toBe('pass');
  });
});

// __tests__/api/notes.test.ts
describe('Notes API', () => {
  it('should generate notes', async () => {
    const res = await fetch('/api/notes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'Test Topic',
        subject: 'Polity'
      })
    });
    
    expect(res.status).toBe(200);
  });
  
  it('should require authentication', async () => {
    const res = await fetch('/api/notes/generate', {
      method: 'POST'
    });
    
    expect(res.status).toBe(401);
  });
});
```

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

---

## 📊 **3. Observability Stack**

### Prometheus Metrics
```typescript
// src/lib/monitoring/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

export const notesGenerated = new Counter({
  name: 'notes_generated_total',
  help: 'Total notes generated'
});

export const quizAttempts = new Counter({
  name: 'quiz_attempts_total',
  help: 'Total quiz attempts'
});
```

### Metrics Endpoint
```typescript
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { register } from 'prom-client';

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType }
  });
}
```

### Grafana Dashboard
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - monitoring
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
```

### Prometheus Config
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'upsc-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
```

---

## 🔍 **4. Request Tracing**

### OpenTelemetry Setup
```typescript
// src/lib/monitoring/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Trace Middleware
```typescript
// src/middleware.ts (add tracing)
import { trace } from '@opentelemetry/api';

export async function middleware(request: NextRequest) {
  const tracer = trace.getTracer('upsc-app');
  const span = tracer.startSpan('http_request');
  
  span.setAttribute('http.method', request.method);
  span.setAttribute('http.url', request.url);
  
  const response = await next();
  
  span.setAttribute('http.status_code', response.status);
  span.end();
  
  return response;
}
```

---

## 🐛 **5. Error Tracking (Sentry)**

### Sentry Setup
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Error Boundary
```typescript
// src/components/error-boundary.tsx
import * as Sentry from '@sentry/nextjs';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

---

## 📈 **6. Performance Monitoring**

### Web Vitals Tracking
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Metrics
```typescript
// src/lib/monitoring/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration}ms`);
    
    // Send to analytics
    if (window.plausible) {
      window.plausible('Performance', {
        props: { metric: name, duration }
      });
    }
  });
}
```

---

## 🧪 **7. Load Testing**

### K6 Load Test Script
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% failures
  },
};

export default function () {
  const res = http.get('https://your-app.vercel.app/api/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### Run Load Test
```bash
k6 run load-test.js
```

---

## 📊 **8. Monitoring Dashboard**

### Key Metrics to Track
1. **Request Rate** - Requests per second
2. **Error Rate** - Percentage of failed requests
3. **Response Time** - P50, P95, P99 latencies
4. **Active Users** - Current active sessions
5. **Database Queries** - Query count and duration
6. **Redis Operations** - Cache hit/miss ratio
7. **AI Generation** - Notes/quiz generation time
8. **Payment Success Rate** - Successful payments %

### Grafana Panels
- Request rate by endpoint
- Error rate by status code
- Response time percentiles
- Active users over time
- Database connection pool
- Redis memory usage
- Circuit breaker states
- API rate limit usage

---

## ✅ **Implementation Checklist**

### Testing
- [ ] Create Postman collection
- [ ] Write integration tests
- [ ] Set up CI/CD testing
- [ ] Add load testing
- [ ] Configure test coverage

### Observability
- [ ] Add Prometheus metrics
- [ ] Set up Grafana dashboards
- [ ] Configure alerts
- [ ] Add request tracing
- [ ] Integrate Sentry

### Documentation
- [ ] Complete API documentation
- [ ] Add code examples
- [ ] Create testing guide
- [ ] Document monitoring setup

---

## 🎯 **Quick Start**

### 1. Install Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install prom-client @opentelemetry/sdk-node @sentry/nextjs
```

### 2. Run Tests
```bash
npm test
```

### 3. Start Monitoring
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 4. View Metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Jaeger: http://localhost:16686

---

## 📞 **Support**

**Documentation**: API_DOCUMENTATION.md  
**Monitoring**: Grafana Dashboard  
**Errors**: Sentry Dashboard  
**Traces**: Jaeger UI
