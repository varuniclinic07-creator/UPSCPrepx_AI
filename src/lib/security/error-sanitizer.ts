// ═══════════════════════════════════════════════════════════════
// ERROR SANITIZER
// Prevents leaking internal error details to clients
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

// Error codes for generic error messages
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMITED: 'RATE_LIMITED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    BAD_REQUEST: 'BAD_REQUEST',
} as const;

// Generic user-facing error messages
const ERROR_MESSAGES: Record<string, string> = {
    VALIDATION_ERROR: 'The provided data is invalid. Please check your input.',
    AUTHENTICATION_REQUIRED: 'Please sign in to continue.',
    AUTHORIZATION_DENIED: 'You do not have permission to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    PAYMENT_FAILED: 'Payment processing failed. Please try again.',
    INTERNAL_ERROR: 'Something went wrong. Please try again later.',
    SERVICE_UNAVAILABLE: 'This service is temporarily unavailable.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
};

export interface ApiError {
    code: string;
    message: string;
    validationErrors?: Array<{ field: string; message: string }>;
}

/**
 * Create a sanitized error response
 * Never exposes internal error details to the client
 */
export function createErrorResponse(
    code: keyof typeof ERROR_CODES,
    status: number,
    details?: {
        validationErrors?: Array<{ field: string; message: string }>;
        // Internal error for logging only - never sent to client
        internalError?: Error | unknown;
    }
): NextResponse<ApiError> {
    // Log internal error for debugging (server-side only)
    if (details?.internalError) {
        console.error(`[API Error] ${code}:`, details.internalError);
    }

    const response: ApiError = {
        code: ERROR_CODES[code],
        message: ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL_ERROR,
    };

    // Include validation errors if provided (these are safe to expose)
    if (details?.validationErrors && code === 'VALIDATION_ERROR') {
        response.validationErrors = details.validationErrors;
    }

    return NextResponse.json(response, { status });
}

/**
 * Shorthand error response creators
 */
export const errors = {
    badRequest: (validationErrors?: Array<{ field: string; message: string }>) =>
        createErrorResponse('BAD_REQUEST', 400, { validationErrors }),

    validation: (validationErrors: Array<{ field: string; message: string }>) =>
        createErrorResponse('VALIDATION_ERROR', 400, { validationErrors }),

    unauthorized: () =>
        createErrorResponse('AUTHENTICATION_REQUIRED', 401),

    forbidden: () =>
        createErrorResponse('AUTHORIZATION_DENIED', 403),

    notFound: () =>
        createErrorResponse('NOT_FOUND', 404),

    rateLimited: () =>
        createErrorResponse('RATE_LIMITED', 429),

    paymentFailed: (internalError?: Error) =>
        createErrorResponse('PAYMENT_FAILED', 402, { internalError }),

    internal: (internalError?: Error | unknown) =>
        createErrorResponse('INTERNAL_ERROR', 500, { internalError }),

    unavailable: () =>
        createErrorResponse('SERVICE_UNAVAILABLE', 503),
};

/**
 * Wrap an API handler with error sanitization
 * Catches all errors and returns generic messages
 */
export function withErrorHandling<T>(
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
    return handler().catch((error: unknown) => {
        // Check for known error types
        if (error instanceof Error) {
            if (error.message === 'Unauthorized' || error.message === 'Authentication required') {
                return errors.unauthorized();
            }
            if (error.message === 'Forbidden' || error.message.includes('permission')) {
                return errors.forbidden();
            }
            if (error.message === 'Not found') {
                return errors.notFound();
            }
        }

        // Default to internal error with logging
        return errors.internal(error);
    });
}

/**
 * Higher-order function to wrap entire API route handlers
 */
export function safeApiHandler<T>(
    handler: (request: Request) => Promise<NextResponse<T>>
): (request: Request) => Promise<NextResponse<T | ApiError>> {
    return async (request: Request) => {
        try {
            return await handler(request);
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message === 'Unauthorized' || error.message === 'Authentication required') {
                    return errors.unauthorized();
                }
                if (error.message === 'Forbidden') {
                    return errors.forbidden();
                }
            }
            return errors.internal(error);
        }
    };
}
