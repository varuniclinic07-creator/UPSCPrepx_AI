/**
 * Observability Instrumentation Middleware
 * Integrates metrics, logging, and tracing into API routes
 * OWASP-compliant observability for UPSC PrepX-AI
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  recordHttpRequest,
  recordAIRequest,
  recordAIError,
  recordDatabaseQuery,
  recordAuthAttempt,
  recordSecurityEvent,
  recordRateLimitHit,
} from './metrics';
import { logger, createRequestLogger } from './logger';
import { tracer, withTracing, Span } from './tracing';

// ═══════════════════════════════════════════════════════════
// INSTRUMENTATION OPTIONS
// ═══════════════════════════════════════════════════════════

export interface InstrumentationOptions {
  // Metrics
  enableMetrics: boolean;
  metricLabels?: Record<string, string>;

  // Logging
  enableLogging: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  // Tracing
  enableTracing: boolean;
  traceSamplingRate?: number; // 0.0-1.0

  // Security
  logSecurityEvents: boolean;
  logSlowRequests: boolean;
  slowRequestThresholdMs?: number;
}

const DEFAULT_OPTIONS: InstrumentationOptions = {
  enableMetrics: true,
  enableLogging: true,
  logLevel: 'info',
  enableTracing: true,
  traceSamplingRate: 1.0,
  logSecurityEvents: true,
  logSlowRequests: true,
  slowRequestThresholdMs: 1000,
};

// ═══════════════════════════════════════════════════════════
// INSTRUMENTATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

/**
 * Wrap API handler with full observability instrumentation
 */
export function instrument(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: Partial<InstrumentationOptions> = {}
): (request: NextRequest) => Promise<NextResponse> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return withTracing(async (request: NextRequest) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Create request-specific logger
    const requestLogger = createRequestLogger({
      requestId,
      method: request.method,
      url: request.url,
      ip: (request as any).ip || 'unknown',
    });

    // Log request start
    if (config.enableLogging) {
      requestLogger.info('Request started', {
        method: request.method,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    }

    let span: Span | undefined;
    if (config.enableTracing) {
      span = tracer.startSpan(`${request.method} ${request.nextUrl.pathname}`, {
        kind: 'server',
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.target': request.nextUrl.pathname,
          'http.client_ip': (request as any).ip || 'unknown',
        },
      });
    }

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Record metrics
      if (config.enableMetrics) {
        recordHttpRequest(request.method, request.nextUrl.pathname, response.status, duration);
      }

      // Log completion
      if (config.enableLogging) {
        requestLogger.http(request.method, request.nextUrl.pathname, response.status, duration);

        // Log slow requests
        if (config.logSlowRequests && duration > (config.slowRequestThresholdMs || 1000)) {
          requestLogger.warn('Slow request detected', {
            durationMs: duration,
            thresholdMs: config.slowRequestThresholdMs,
          });
        }
      }

      // Record trace
      if (config.enableTracing && span) {
        tracer.setAttribute(span, 'http.status_code', response.status);
        tracer.endSpan(span, { status: response.status >= 400 ? 'error' : 'ok' });
      }

      // Add observability headers
      response.headers.set('X-Request-ID', requestId);
      if (span) {
        response.headers.set('X-Trace-ID', span.traceId);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error metrics
      if (config.enableMetrics) {
        recordHttpRequest(request.method, request.nextUrl.pathname, 500, duration);
      }

      // Log error
      if (config.enableLogging) {
        requestLogger.error('Request failed', {
          error: error instanceof Error ? error : new Error(String(error)),
          stack: error instanceof Error ? error.stack : undefined,
          durationMs: duration,
        });
      }

      // Record trace error
      if (config.enableTracing && span) {
        tracer.endSpan(span, {
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      throw error;
    }
  });
}

// ═══════════════════════════════════════════════════════════
// AI INSTRUMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Wrap AI operation with observability
 */
export async function instrumentAI<T>(
  operation: () => Promise<T>,
  options: {
    provider: string;
    model: string;
    endpoint: string;
    parentSpan?: Span;
  }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Record metrics
    recordAIRequest(options.provider, options.model, options.endpoint, duration);

    // Log
    logger.info(`AI: ${options.provider}/${options.model}`, {
      durationMs: duration,
      endpoint: options.endpoint,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Record error metrics
    recordAIError(options.provider, error instanceof Error ? error.message : 'unknown');

    // Log error
    logger.error(`AI error: ${options.provider}/${options.model}`, {
      error: error instanceof Error ? error : new Error(String(error)),
      durationMs: duration,
    });

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// DATABASE INSTRUMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Wrap database operation with observability
 */
export async function instrumentDB<T>(
  operation: () => Promise<T>,
  options: {
    table: string;
    operation: string;
    parentSpan?: Span;
  }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    // Record metrics
    recordDatabaseQuery(options.table, options.operation, duration);

    // Log (only slow queries)
    if (duration > 100) {
      logger.debug(`DB: ${options.operation} ${options.table}`, {
        durationMs: duration,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    logger.error(`DB error: ${options.operation} ${options.table}`, {
      error: error instanceof Error ? error : new Error(String(error)),
      durationMs: duration,
    });

    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// AUTH INSTRUMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Record authentication attempt
 */
export function instrumentAuth(
  success: boolean,
  options: {
    method: string;
    userId?: string;
    error?: Error;
  }
): void {
  // Record metrics
  recordAuthAttempt(options.method, success);

  // Log
  if (success) {
    logger.info('Authentication successful', {
      method: options.method,
      userId: options.userId,
    });
  } else {
    logger.warn('Authentication failed', {
      method: options.method,
      error: options.error,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// SECURITY INSTRUMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Record security event
 */
export function instrumentSecurity(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: {
    userId?: string;
    ip?: string;
    endpoint?: string;
    details?: Record<string, unknown>;
  }
): void {
  // Record metrics
  recordSecurityEvent(eventType, severity);

  // Log
  logger.security(eventType, severity, {
    userId: context.userId,
    ip: context.ip,
    endpoint: context.endpoint,
    ...context.details,
  });
}

// ═══════════════════════════════════════════════════════════
// RATE LIMIT INSTRUMENTATION
// ═══════════════════════════════════════════════════════════

/**
 * Record rate limit hit
 */
export function instrumentRateLimit(
  endpoint: string,
  identifierType: 'user' | 'ip',
  context: {
    identifier: string;
    limit: number;
  }
): void {
  // Record metrics
  recordRateLimitHit(endpoint, identifierType);

  // Log
  logger.debug('Rate limit hit', {
    endpoint,
    identifierType,
    identifier: context.identifier,
    limit: context.limit,
  });
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export const instrumentation = {
  instrument,
  instrumentAI,
  instrumentDB,
  instrumentAuth,
  instrumentSecurity,
  instrumentRateLimit,
};
