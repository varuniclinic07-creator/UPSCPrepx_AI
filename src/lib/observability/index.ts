/**
 * Observability Module Exports
 * Centralized export for all observability functionality
 */

// Metrics
export {
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
  httpRequestsTotal,
  httpRequestDuration,
  aiRequestsTotal,
  aiRequestDuration,
  aiTokensTotal,
  aiCostTotal,
  aiErrorsTotal,
  aiFallbackTotal,
  dbQueriesTotal,
  dbQueryDuration,
  cacheHitsTotal,
  cacheMissesTotal,
  authAttemptsTotal,
  authErrorsTotal,
  paymentAttemptsTotal,
  paymentRevenueTotal,
  queueJobsTotal,
  queueJobDuration,
  securityEventsTotal,
  rateLimitHitsTotal,
  memoryUsage,
  cpuUsage,
} from './metrics';

// RateLimitConfig is exported from '@/lib/security/enhanced-rate-limiter', not metrics

// Logging
export { logger, createRequestLogger, withRequestLogging, Logger } from './logger';

export type { LogLevel, LogContext, LogEntry } from './logger';

// Tracing
export {
  tracer,
  withTrace,
  withTracing,
  withAITrace,
  withDBTrace,
  getCurrentSpan,
  setCurrentSpan,
  exportTracesToTempo,
  generateTraceId,
  generateSpanId,
  Tracer,
} from './tracing';

export type { Span, SpanContext, SpanAttributes, SpanEvent } from './tracing';

// Instrumentation
export {
  instrument,
  instrumentAI,
  instrumentDB,
  instrumentAuth,
  instrumentSecurity,
  instrumentRateLimit,
  instrumentation,
} from './instrumentation';

export type { InstrumentationOptions } from './instrumentation';
