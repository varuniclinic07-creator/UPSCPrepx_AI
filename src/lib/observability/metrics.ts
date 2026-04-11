/**
 * Prometheus Metrics Collection
 * Custom metrics for API performance, AI usage, database operations, and system health
 * OWASP-compliant observability for UPSC PrepX-AI
 */

import { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';

// ═══════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════

export const register = new Registry();

// Set default labels
register.setDefaultLabels({
  app: 'upsc-prepx-ai',
  environment: process.env.NODE_ENV || 'development',
});

// ═══════════════════════════════════════════════════════════
// HTTP METRICS
// ═══════════════════════════════════════════════════════════

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
  registers: [register],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// AI METRICS
// ═══════════════════════════════════════════════════════════

export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['provider', 'model', 'endpoint'],
  registers: [register],
});

export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'AI request duration in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
  registers: [register],
});

export const aiTokensTotal = new Counter({
  name: 'ai_tokens_total',
  help: 'Total tokens used',
  labelNames: ['provider', 'model', 'type'], // type: prompt or completion
  registers: [register],
});

export const aiCostTotal = new Counter({
  name: 'ai_cost_total',
  help: 'Total AI cost in USD',
  labelNames: ['provider', 'model'],
  registers: [register],
});

export const aiErrorsTotal = new Counter({
  name: 'ai_errors_total',
  help: 'Total AI provider errors',
  labelNames: ['provider', 'error_type'],
  registers: [register],
});

export const aiFallbackTotal = new Counter({
  name: 'ai_fallback_total',
  help: 'Total provider fallbacks',
  labelNames: ['from_provider', 'to_provider'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// DATABASE METRICS
// ═══════════════════════════════════════════════════════════

export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total database queries',
  labelNames: ['table', 'operation'],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['table', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  registers: [register],
});

export const dbConnectionsIdle = new Gauge({
  name: 'db_connections_idle',
  help: 'Idle database connections',
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// CACHE METRICS
// ═══════════════════════════════════════════════════════════

export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Cache size in bytes',
  labelNames: ['cache_type'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// AUTH METRICS
// ═══════════════════════════════════════════════════════════

export const authAttemptsTotal = new Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['method', 'success'],
  registers: [register],
});

export const authErrorsTotal = new Counter({
  name: 'auth_errors_total',
  help: 'Total authentication errors',
  labelNames: ['error_type'],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Currently active users',
  labelNames: ['plan'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// PAYMENT METRICS
// ═══════════════════════════════════════════════════════════

export const paymentAttemptsTotal = new Counter({
  name: 'payment_attempts_total',
  help: 'Total payment attempts',
  labelNames: ['provider', 'status'],
  registers: [register],
});

export const paymentRevenueTotal = new Counter({
  name: 'payment_revenue_total',
  help: 'Total revenue in USD',
  labelNames: ['plan', 'provider'],
  registers: [register],
});

export const paymentRefundsTotal = new Counter({
  name: 'payment_refunds_total',
  help: 'Total refunds in USD',
  labelNames: ['reason'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// QUEUE METRICS
// ═══════════════════════════════════════════════════════════

export const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue_name', 'status'],
  registers: [register],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job duration in seconds',
  labelNames: ['queue_name'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
  registers: [register],
});

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
  registers: [register],
});

export const queueActiveWorkers = new Gauge({
  name: 'queue_active_workers',
  help: 'Active queue workers',
  labelNames: ['queue_name'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// SYSTEM METRICS
// ═══════════════════════════════════════════════════════════

export const memoryUsage = new Gauge({
  name: 'process_memory_bytes',
  help: 'Process memory usage',
  labelNames: ['type'], // heapUsed, heapTotal, rss, external
  registers: [register],
});

export const cpuUsage = new Gauge({
  name: 'process_cpu_percent',
  help: 'CPU usage percentage',
  registers: [register],
});

export const eventLoopLag = new Histogram({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Node.js event loop lag',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
  registers: [register],
});

export const gcDuration = new Histogram({
  name: 'nodejs_gc_duration_seconds',
  help: 'Garbage collection duration',
  labelNames: ['kind'],
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// SECURITY METRICS
// ═══════════════════════════════════════════════════════════

export const securityEventsTotal = new Counter({
  name: 'security_events_total',
  help: 'Total security events',
  labelNames: ['event_type', 'severity'],
  registers: [register],
});

export const rateLimitHitsTotal = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['endpoint', 'identifier_type'],
  registers: [register],
});

export const csrfFailuresTotal = new Counter({
  name: 'csrf_failures_total',
  help: 'Total CSRF validation failures',
  registers: [register],
});

// ═══════════════════════════════════════════════════════════
// METRICS HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
  requestSize?: number,
  responseSize?: number
): void {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route }, durationMs / 1000);

  if (requestSize) {
    httpRequestSize.observe({ method, route }, requestSize);
  }
  if (responseSize) {
    httpResponseSize.observe({ method, route }, responseSize);
  }
}

/**
 * Record AI request metrics
 */
export function recordAIRequest(
  provider: string,
  model: string,
  endpoint: string,
  durationMs: number,
  promptTokens?: number,
  completionTokens?: number,
  cost?: number
): void {
  aiRequestsTotal.inc({ provider, model, endpoint });
  aiRequestDuration.observe({ provider, model }, durationMs / 1000);

  if (promptTokens) {
    aiTokensTotal.inc({ provider, model, type: 'prompt' }, promptTokens);
  }
  if (completionTokens) {
    aiTokensTotal.inc({ provider, model, type: 'completion' }, completionTokens);
  }
  if (cost) {
    aiCostTotal.inc({ provider, model }, cost);
  }
}

/**
 * Record AI error
 */
export function recordAIError(
  provider: string,
  errorType: string
): void {
  aiErrorsTotal.inc({ provider, error_type: errorType });
}

/**
 * Record AI fallback
 */
export function recordAIFallback(
  fromProvider: string,
  toProvider: string
): void {
  aiFallbackTotal.inc({ from_provider: fromProvider, to_provider: toProvider });
}

/**
 * Record database query metrics
 */
export function recordDatabaseQuery(
  table: string,
  operation: string,
  durationMs: number
): void {
  dbQueriesTotal.inc({ table, operation });
  dbQueryDuration.observe({ table, operation }, durationMs / 1000);
}

/**
 * Record cache metrics
 */
export function recordCacheHit(cacheType: string): void {
  cacheHitsTotal.inc({ cache_type: cacheType });
}

export function recordCacheMiss(cacheType: string): void {
  cacheMissesTotal.inc({ cache_type: cacheType });
}

/**
 * Record authentication metrics
 */
export function recordAuthAttempt(
  method: string,
  success: boolean
): void {
  authAttemptsTotal.inc({ method, success: success.toString() });
}

export function recordAuthError(errorType: string): void {
  authErrorsTotal.inc({ error_type: errorType });
}

/**
 * Record payment metrics
 */
export function recordPaymentAttempt(
  provider: string,
  status: 'success' | 'failed' | 'pending'
): void {
  paymentAttemptsTotal.inc({ provider, status });
}

export function recordRevenue(
  plan: string,
  provider: string,
  amount: number
): void {
  paymentRevenueTotal.inc({ plan, provider }, amount);
}

/**
 * Record queue metrics
 */
export function recordQueueJob(
  queueName: string,
  status: 'completed' | 'failed' | 'delayed',
  durationMs: number
): void {
  queueJobsTotal.inc({ queue_name: queueName, status });
  queueJobDuration.observe({ queue_name: queueName }, durationMs / 1000);
}

/**
 * Record security event
 */
export function recordSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  securityEventsTotal.inc({ event_type: eventType, severity });
}

/**
 * Record rate limit hit
 */
export function recordRateLimitHit(
  endpoint: string,
  identifierType: 'user' | 'ip'
): void {
  rateLimitHitsTotal.inc({ endpoint, identifier_type: identifierType });
}

/**
 * Update system metrics
 */
export function updateSystemMetrics(): void {
  const memUsage = process.memoryUsage();
  memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
  memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
  memoryUsage.set({ type: 'rss' }, memUsage.rss);
  memoryUsage.set({ type: 'external' }, memUsage.external);
}

/**
 * Get all metrics as Prometheus format
 */
export async function getMetrics(): Promise<string> {
  updateSystemMetrics();
  return await register.metrics();
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  register.clear();
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const metrics = {
  register,
  getMetrics,
  resetMetrics,
  recordHttpRequest,
  recordAIRequest,
  recordAIError,
  recordAIFallback,
  recordDatabaseQuery,
  recordCacheHit,
  recordCacheMiss,
  recordAuthAttempt,
  recordAuthError,
  recordPaymentAttempt,
  recordRevenue,
  recordQueueJob,
  recordSecurityEvent,
  recordRateLimitHit,
  updateSystemMetrics,
};
