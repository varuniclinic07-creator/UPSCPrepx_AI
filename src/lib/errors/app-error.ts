// ═══════════════════════════════════════════════════════════════
// APPLICATION ERRORS
// Centralized error handling system
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════

export enum ErrorCode {
    // General errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    TIMEOUT = 'TIMEOUT',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

    // Auth errors
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    TOKEN_INVALID = 'TOKEN_INVALID',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // Payment errors
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
    SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
    SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',

    // Usage errors
    USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
    FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

    // Resource errors
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

    // External service errors
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
}

// ═══════════════════════════════════════════════════════════════
// ERROR STATUS CODES
// ═══════════════════════════════════════════════════════════════

export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.TIMEOUT]: 408,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    [ErrorCode.SESSION_EXPIRED]: 401,
    [ErrorCode.PAYMENT_FAILED]: 400,
    [ErrorCode.PAYMENT_VERIFICATION_FAILED]: 400,
    [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 404,
    [ErrorCode.SUBSCRIPTION_EXPIRED]: 403,
    [ErrorCode.USAGE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.FEATURE_NOT_AVAILABLE]: 403,
    [ErrorCode.RESOURCE_NOT_FOUND]: 404,
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCode.AI_SERVICE_ERROR]: 502,
    [ErrorCode.DATABASE_ERROR]: 500,
};

// ═══════════════════════════════════════════════════════════════
// BASE APPLICATION ERROR
// ═══════════════════════════════════════════════════════════════

export interface AppErrorOptions {
    code: ErrorCode;
    message: string;
    statusCode?: number;
    cause?: Error;
    metadata?: Record<string, unknown>;
    isOperational?: boolean;
}

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly cause?: Error;
    public readonly metadata?: Record<string, unknown>;
    public readonly isOperational: boolean;
    public readonly timestamp: string;

    constructor(options: AppErrorOptions) {
        super(options.message);
        this.name = 'AppError';
        this.code = options.code;
        this.statusCode = options.statusCode || ERROR_STATUS_CODES[options.code] || 500;
        this.cause = options.cause;
        this.metadata = options.metadata;
        this.isOperational = options.isOperational ?? true;
        this.timestamp = new Date().toISOString();

        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }

    /**
     * Convert error to JSON for API response
     */
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                statusCode: this.statusCode,
                timestamp: this.timestamp,
                ...(this.metadata && { metadata: this.metadata }),
            },
        };
    }

    /**
     * Add additional metadata to error
     */
    withMetadata(metadata: Record<string, unknown>): AppError {
        return new AppError({
            ...this,
            code: this.code,
            message: this.message,
            metadata: { ...this.metadata, ...metadata },
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// SPECIFIC ERROR CLASSES
// ═══════════════════════════════════════════════════════════════

export class ValidationError extends AppError {
    public readonly errors: Array<{ field: string; message: string }>;

    constructor(message: string, errors?: Array<{ field: string; message: string }>) {
        super({
            code: ErrorCode.VALIDATION_ERROR,
            message,
            metadata: errors ? { errors } : undefined,
        });
        this.name = 'ValidationError';
        this.errors = errors || [];
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, id?: string) {
        super({
            code: ErrorCode.NOT_FOUND,
            message: `${resource}${id ? ` with id ${id}` : ''} not found`,
            metadata: { resource, id },
        });
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super({
            code: ErrorCode.UNAUTHORIZED,
            message,
        });
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super({
            code: ErrorCode.FORBIDDEN,
            message,
        });
        this.name = 'ForbiddenError';
    }
}

export class RateLimitError extends AppError {
    public readonly retryAfter: number;

    constructor(retryAfter: number, message?: string) {
        super({
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            message: message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            metadata: { retryAfter },
        });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export class PaymentError extends AppError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super({
            code: ErrorCode.PAYMENT_FAILED,
            message,
            metadata,
        });
        this.name = 'PaymentError';
    }
}

export class SubscriptionError extends AppError {
    constructor(message: string, metadata?: Record<string, unknown>) {
        super({
            code: ErrorCode.SUBSCRIPTION_NOT_FOUND,
            message,
            metadata,
        });
        this.name = 'SubscriptionError';
    }
}

export class UsageLimitError extends AppError {
    constructor(limit: number, current: number, feature: string) {
        super({
            code: ErrorCode.USAGE_LIMIT_EXCEEDED,
            message: `Usage limit exceeded for ${feature}. Limit: ${limit}, Current: ${current}`,
            metadata: { limit, current, feature },
        });
        this.name = 'UsageLimitError';
    }
}

export class TimeoutError extends AppError {
    constructor(operation: string, timeoutMs: number) {
        super({
            code: ErrorCode.TIMEOUT,
            message: `${operation} timed out after ${timeoutMs}ms`,
            metadata: { operation, timeoutMs },
        });
        this.name = 'TimeoutError';
    }
}

export class ExternalServiceError extends AppError {
    constructor(service: string, message?: string) {
        super({
            code: ErrorCode.EXTERNAL_SERVICE_ERROR,
            message: message || `${service} service unavailable`,
            metadata: { service },
        });
        this.name = 'ExternalServiceError';
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, cause?: Error) {
        super({
            code: ErrorCode.DATABASE_ERROR,
            message,
            cause,
            isOperational: false,
        });
        this.name = 'DatabaseError';
    }
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════════════════════════

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        statusCode: number;
        timestamp: string;
        metadata?: Record<string, unknown>;
    };
}

/**
 * Handle errors in API routes
 */
export function handleError(error: unknown): ErrorResponse {
    console.error('[ErrorHandler] Caught error:', error);

    if (error instanceof AppError) {
        return error.toJSON();
    }

    if (error instanceof Error) {
        // Check if it's a known error type from other libraries
        if (error.name === 'ZodError') {
            return new ValidationError('Validation failed').toJSON();
        }

        // Unknown error - convert to internal error
        return new AppError({
            code: ErrorCode.INTERNAL_ERROR,
            message: error.message || 'An unexpected error occurred',
            cause: error,
            isOperational: false,
        }).toJSON();
    }

    // Non-error thrown
    return new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        isOperational: false,
    }).toJSON();
}

/**
 * Wrap async handler with error handling
 */
export function asyncHandler<T>(
    handler: () => Promise<T>
): Promise<{ data?: T; error?: ErrorResponse }> {
    return handler()
        .then((data) => ({ data }))
        .catch((error) => ({ error: handleError(error) }));
}

// ═══════════════════════════════════════════════════════════════
// ERROR FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function createError(code: ErrorCode, message: string, metadata?: Record<string, unknown>): AppError {
    return new AppError({ code, message, metadata });
}

export function createValidationError(message: string, errors?: Array<{ field: string; message: string }>): ValidationError {
    return new ValidationError(message, errors);
}

export function createNotFoundError(resource: string, id?: string): NotFoundError {
    return new NotFoundError(resource, id);
}

export function createUnauthorizedError(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
}

export function createForbiddenError(message?: string): ForbiddenError {
    return new ForbiddenError(message);
}

export function createRateLimitError(retryAfter: number, message?: string): RateLimitError {
    return new RateLimitError(retryAfter, message);
}

export function createPaymentError(message: string, metadata?: Record<string, unknown>): PaymentError {
    return new PaymentError(message, metadata);
}

export function createSubscriptionError(message: string, metadata?: Record<string, unknown>): SubscriptionError {
    return new SubscriptionError(message, metadata);
}

export function createUsageLimitError(limit: number, current: number, feature: string): UsageLimitError {
    return new UsageLimitError(limit, current, feature);
}

export function createTimeoutError(operation: string, timeoutMs: number): TimeoutError {
    return new TimeoutError(operation, timeoutMs);
}

export function createExternalServiceError(service: string, message?: string): ExternalServiceError {
    return new ExternalServiceError(service, message);
}

export function createDatabaseError(message: string, cause?: Error): DatabaseError {
    return new DatabaseError(message, cause);
}
