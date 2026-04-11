/**
 * Structured Logging with Loki Integration
 * JSON-formatted logs with context, correlation IDs, and severity levels
 * OWASP-compliant logging for UPSC PrepX-AI
 */

import { createClient } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════
// LOG LEVELS
// ═══════════════════════════════════════════════════════════

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ═══════════════════════════════════════════════════════════
// LOG CONTEXT
// ═══════════════════════════════════════════════════════════

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;

  // Application context
  module?: string;
  component?: string;
  action?: string;

  // Error context
  error?: Error;
  errorCode?: string;
  stackTrace?: string;

  // Performance context
  durationMs?: number;
  latencyMs?: number;

  // Business context
  tenantId?: string;
  plan?: string;
  feature?: string;

  // Additional structured data
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════
// LOG ENTRY
// ═══════════════════════════════════════════════════════════

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  version: string;
  hostname: string;
  message: string;
  context: LogContext;
  labels: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════
// LOGGER CONFIGURATION
// ═══════════════════════════════════════════════════════════

interface LoggerConfig {
  service: string;
  environment: string;
  version: string;
  minLevel: LogLevel;
  enableLoki: boolean;
  lokiUrl?: string;
  enableConsole: boolean;
  enableDatabase: boolean;
  sampleRate?: number; // For high-volume logs (0.0-1.0)
}

const defaultConfig: LoggerConfig = {
  service: 'upsc-prepx-ai',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  minLevel: process.env.LOG_LEVEL as LogLevel || 'info',
  enableLoki: !!process.env.LOKI_URL,
  lokiUrl: process.env.LOKI_URL,
  enableConsole: true,
  enableDatabase: false, // Enable for audit logs
  sampleRate: 1.0,
};

// ═══════════════════════════════════════════════════════════
// LOGGER CLASS
// ═══════════════════════════════════════════════════════════

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({
      ...this.config,
    });
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Check if log should be sampled
   */
  private shouldSample(): boolean {
    if (this.config.sampleRate === 1.0) return true;
    return Math.random() < (this.config.sampleRate || 1.0);
  }

  /**
   * Format log entry
   */
  private formatEntry(
    level: LogLevel,
    message: string,
    context: LogContext
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.service,
      environment: this.config.environment,
      version: this.config.version,
      hostname: process.env.HOSTNAME || 'unknown',
      message,
      context,
      labels: {
        service: this.config.service,
        environment: this.config.environment,
        level,
        ...(context.module && { module: context.module }),
        ...(context.component && { component: context.component }),
      },
    };
  }

  /**
   * Send log to Loki
   */
  private async sendToLoki(entry: LogEntry): Promise<void> {
    if (!this.config.enableLoki || !this.config.lokiUrl) return;

    try {
      const labels = entry.labels;
      const stream = {
        stream: labels,
        values: [
          [
            Math.floor(Date.now() / 1e6).toString(),
            JSON.stringify({
              message: entry.message,
              ...entry.context,
            }),
          ],
        ],
      };

      await fetch(`${this.config.lokiUrl}/loki/api/v1/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streams: [stream] }),
      }).catch(() => {}); // Fire and forget
    } catch (error) {
      // Silently fail - logging shouldn't break app
    }
  }

  /**
   * Send log to database (for audit trails)
   */
  private async sendToDatabase(entry: LogEntry): Promise<void> {
    if (!this.config.enableDatabase) return;

    try {
      const supabase = createClient();
      await supabase.from('audit_logs').insert({
        timestamp: entry.timestamp,
        level: entry.level,
        service: entry.service,
        message: entry.message,
        context: entry.context,
        user_id: entry.context.userId,
        request_id: entry.context.requestId,
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Write log to console
   */
  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const consoleMethod = {
      debug: 'log',
      info: 'log',
      warn: 'warn',
      error: 'error',
      fatal: 'error',
    }[entry.level] as 'log' | 'warn' | 'error';

    const color = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    }[entry.level];

    const reset = '\x1b[0m';

    console[consoleMethod](
      `${color}[${entry.level.toUpperCase()}]${reset}`,
      `[${entry.service}]`,
      entry.message,
      Object.keys(entry.context).length > 0 ? entry.context : ''
    );
  }

  /**
   * Core log method
   */
  private log(
    level: LogLevel,
    message: string,
    context: LogContext = {}
  ): void {
    if (!this.shouldLog(level) || !this.shouldSample()) return;

    const entry = this.formatEntry(level, message, context);

    // Console (synchronous)
    this.writeToConsole(entry);

    // Loki (async)
    this.sendToLoki(entry).catch(() => {});

    // Database for audit (async)
    if (level === 'error' || level === 'fatal' || context.errorCode) {
      this.sendToDatabase(entry).catch(() => {});
    }
  }

  // ═══════════════════════════════════════════════════════
  // PUBLIC LOGGING METHODS
  // ═══════════════════════════════════════════════════════

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, {
      ...context,
      stackTrace: context?.error?.stack,
    });
  }

  fatal(message: string, context?: LogContext): void {
    this.log('fatal', message, {
      ...context,
      stackTrace: context?.error?.stack,
    });
  }

  /**
   * Log HTTP request
   */
  http(
    method: string,
    url: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${url}`, {
      method,
      url,
      statusCode,
      durationMs,
      ...context,
    });
  }

  /**
   * Log AI request
   */
  ai(
    provider: string,
    model: string,
    durationMs: number,
    tokens?: { prompt: number; completion: number },
    context?: LogContext
  ): void {
    this.log('info', `AI: ${provider}/${model}`, {
      provider,
      model,
      durationMs,
      ...(tokens && { tokens }),
      ...context,
    });
  }

  /**
   * Log database query
   */
  db(
    table: string,
    operation: string,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = durationMs > 1000 ? 'warn' : 'debug';
    this.log(level, `DB: ${operation} ${table}`, {
      table,
      operation,
      durationMs,
      ...context,
    });
  }

  /**
   * Log security event
   */
  security(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    this.log(level, `SECURITY: ${eventType}`, {
      eventType,
      severity,
      ...context,
    });
  }

  /**
   * Log payment event
   */
  payment(
    amount: number,
    status: 'success' | 'failed' | 'pending',
    provider: string,
    context?: LogContext
  ): void {
    const level = status === 'failed' ? 'error' : 'info';
    this.log(level, `PAYMENT: ${status} $${amount}`, {
      amount,
      status,
      provider,
      ...context,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// DEFAULT LOGGER INSTANCE
// ═══════════════════════════════════════════════════════════

export const logger = new Logger();

// ═══════════════════════════════════════════════════════════
// REQUEST LOGGER FACTORY
// ═══════════════════════════════════════════════════════════

export function createRequestLogger(context: LogContext): Logger {
  return logger.child(context);
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE INTEGRATION
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

/**
 * Wrap API handler with request logging
 */
export function withRequestLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    const requestLogger = createRequestLogger({
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip || 'unknown',
    });

    requestLogger.info('Request started');

    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;

      requestLogger.http(
        request.method,
        request.nextUrl.pathname,
        response.status,
        duration
      );

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.error('Request failed', {
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      });
      throw error;
    }
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export { Logger };
export default logger;
