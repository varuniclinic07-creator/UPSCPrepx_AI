// ═══════════════════════════════════════════════════════════════
// STRUCTURED LOGGER
// Production logging with Pino (or console fallback)
// ═══════════════════════════════════════════════════════════════

// Try to import pino, fall back to console if not available
let pino: unknown = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pino = require('pino');
} catch {
    // Pino not installed, use console fallback
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
    requestId?: string;
    userId?: string;
    route?: string;
    method?: string;
    duration?: number;
    [key: string]: unknown;
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    service: string;
    environment: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    [key: string]: unknown;
}

// Logger configuration
const config = {
    service: process.env.NEXT_PUBLIC_APP_URL ? 'upsc-cse-master' : 'upsc-dev',
    environment: process.env.NODE_ENV || 'development',
    minLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
};

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};

/**
 * Create pino logger if available
 */
function createPinoLogger() {
    if (!pino) return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return (pino as any)({
            level: config.minLevel,
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            formatters: {
                level: (label: string) => ({ level: label.toUpperCase() }),
            },
        });
    } catch {
        return null;
    }
}

const pinoLogger = createPinoLogger();

/**
 * Format log entry
 */
function formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
): LogEntry {
    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        service: config.service,
        environment: config.environment,
    };

    if (context) {
        entry.context = context;
    }

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
        entry.stack = error.stack; // For better log aggregation
    }

    return entry;
}

/**
 * Log to pino or console
 */
function log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
): void {
    // Check level priority
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[config.minLevel]) {
        return;
    }

    const entry = formatEntry(level, message, context, error);

    if (pinoLogger) {
        // Use pino
        const pinoLevel = level === 'fatal' ? 'error' : level;
        (pinoLogger as any)[pinoLevel](entry, message);
    } else {
        // Fallback to structured console logging
        const consoleMethod = level === 'error' || level === 'fatal' ? 'error' :
            level === 'warn' ? 'warn' : 'info';

        const logString = JSON.stringify(entry);

        if (consoleMethod === 'info') {
            console.info(logString);
        } else {
            console[consoleMethod as 'warn' | 'error'](logString);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// LOGGER INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface Logger {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext, error?: Error): void;
    fatal(message: string, context?: LogContext, error?: Error): void;

    // Child logger with pre-populated context
    child(context: LogContext): Logger;
}

/**
 * Create a logger instance
 */
export function createLogger(defaultContext?: LogContext): Logger {
    return {
        debug(message: string, context?: LogContext) {
            log('debug', message, { ...defaultContext, ...context });
        },

        info(message: string, context?: LogContext) {
            log('info', message, { ...defaultContext, ...context });
        },

        warn(message: string, context?: LogContext) {
            log('warn', message, { ...defaultContext, ...context });
        },

        error(message: string, context?: LogContext, error?: Error) {
            log('error', message, { ...defaultContext, ...context }, error);
        },

        fatal(message: string, context?: LogContext, error?: Error) {
            log('fatal', message, { ...defaultContext, ...context }, error);
        },

        child(context: LogContext) {
            return createLogger({ ...defaultContext, ...context });
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT LOGGER
// ═══════════════════════════════════════════════════════════════

export const logger = createLogger();

// ═══════════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE FOR NEXT.JS
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

/**
 * Log API request
 */
export function logRequest(request: NextRequest, requestId?: string): void {
    logger.info('API Request', {
        requestId,
        method: request.method,
        route: request.nextUrl.pathname,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
    });
}

/**
 * Log API response
 */
export function logResponse(
    request: NextRequest,
    response: NextResponse,
    duration: number,
    requestId?: string
): void {
    const level = response.status >= 500 ? 'error' :
        response.status >= 400 ? 'warn' : 'info';

    logger[level]('API Response', {
        requestId,
        method: request.method,
        route: request.nextUrl.pathname,
        status: response.status,
        duration,
        durationUnit: 'ms',
    });
}

/**
 * Log error
 */
export function logError(
    error: Error,
    context: {
        route?: string;
        method?: string;
        userId?: string;
        requestId?: string;
    }
): void {
    logger.error('Request Error', {
        ...context,
        errorName: error.name,
        errorMessage: error.message,
    }, error);
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE LOGGING
// ═══════════════════════════════════════════════════════════════

/**
 * Measure execution time
 */
export async function measure<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
): Promise<T> {
    const start = Date.now();
    const requestId = context?.requestId;

    logger.debug(`Starting ${operation}`, { requestId, operation });

    try {
        const result = await fn();
        const duration = Date.now() - start;

        logger.info(`Completed ${operation}`, {
            ...context,
            operation,
            duration,
            durationUnit: 'ms',
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        logger.error(`Failed ${operation}`, {
            ...context,
            operation,
            duration,
            durationUnit: 'ms',
        }, error as Error);

        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════

export interface AuditEvent {
    action: string;
    userId: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log audit event (for security/compliance)
 */
export function logAudit(event: AuditEvent): void {
    logger.info('Audit Event', {
        audit: true,
        action: event.action,
        userId: event.userId,
        resource: event.resource,
        resourceId: event.resourceId,
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
    });
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { logger as default };
