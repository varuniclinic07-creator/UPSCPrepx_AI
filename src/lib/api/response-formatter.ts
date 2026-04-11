// ═══════════════════════════════════════════════════════════════
// API RESPONSE FORMATTER
// Standardized API responses with pagination, sorting, filtering
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/app-error';
import { getSecurityHeaders } from '@/lib/security/headers';

// ═══════════════════════════════════════════════════════════════
// STANDARD RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}

export interface ResponseMeta {
    requestId?: string;
    timestamp: string;
    duration?: number;
    version?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: PaginationMeta;
    meta?: ResponseMeta;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
}

export interface SortedQueryOptions<T> {
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface FilterCondition {
    field: string;
    operator: FilterOperator;
    value: unknown;
}

export type FilterOperator =
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'contains'
    | 'startsWith'
    | 'endsWith';

// ═══════════════════════════════════════════════════════════════
// RESPONSE FACTORIES
// ═══════════════════════════════════════════════════════════════

/**
 * Create a success response
 */
export function successResponse<T>(
    data: T,
    meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            ...meta,
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 200,
    });
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
    data: T,
    meta?: Partial<ResponseMeta>
): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            ...meta,
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 201,
    });
}

/**
 * Create a no content response (204)
 */
export function noContentResponse(): NextResponse {
    return new NextResponse(null, {
        headers: getSecurityHeaders(),
        status: 204,
    });
}

/**
 * Create an error response
 */
export function errorResponse(
    error: AppError | Error,
    requestId?: string
): NextResponse<ApiResponse> {
    const appError = error instanceof AppError ? error : null;

    const response: ApiResponse = {
        success: false,
        error: {
            code: appError?.code || 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: appError?.metadata,
            stack:
                process.env.NODE_ENV === 'development'
                    ? (error as Error).stack
                    : undefined,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: appError?.statusCode || 500,
    });
}

/**
 * Create a validation error response (400)
 */
export function validationErrorResponse(
    errors: Array<{ field: string; message: string }>,
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: { errors },
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 400,
    });
}

/**
 * Create an unauthorized response (401)
 */
export function unauthorizedResponse(
    message = 'Unauthorized',
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'UNAUTHORIZED',
            message,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 401,
    });
}

/**
 * Create a forbidden response (403)
 */
export function forbiddenResponse(
    message = 'Forbidden',
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'FORBIDDEN',
            message,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 403,
    });
}

/**
 * Create a not found response (404)
 */
export function notFoundResponse(
    resource: string,
    id?: string,
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `${resource} not found${id ? `: ${id}` : ''}`,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 404,
    });
}

/**
 * Create a conflict response (409)
 */
export function conflictResponse(
    message: string,
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'CONFLICT',
            message,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 409,
    });
}

/**
 * Create a too many requests response (429)
 */
export function rateLimitResponse(
    retryAfterSeconds: number,
    requestId?: string
): NextResponse<ApiResponse> {
    const response: ApiResponse = {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
        },
    };

    return NextResponse.json(response, {
        headers: {
            ...getSecurityHeaders(),
            'Retry-After': retryAfterSeconds.toString(),
        },
        status: 429,
    });
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    pagination: {
        page: number;
        limit: number;
        total: number;
    },
    meta?: Partial<ResponseMeta>
): NextResponse<PaginatedResponse<T>> {
    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<T> = {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            nextCursor: page < totalPages ? String(page + 1) : undefined,
            previousCursor: page > 1 ? String(page - 1) : undefined,
        },
        meta: {
            timestamp: new Date().toISOString(),
            version: '1.0',
            ...meta,
        },
    };

    return NextResponse.json(response, {
        headers: getSecurityHeaders(),
        status: 200,
    });
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(
    searchParams: URLSearchParams,
    options: { defaultLimit?: number; maxLimit?: number } = {}
): {
    page: number;
    limit: number;
    offset: number;
} {
    const defaultLimit = options.defaultLimit ?? 20;
    const maxLimit = options.maxLimit ?? 100;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
        maxLimit,
        Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Create cursor-based pagination for infinite scroll
 */
export interface CursorPaginationParams {
    cursor?: string;
    limit?: number;
    direction?: 'forward' | 'backward';
}

export function parseCursorPaginationParams(
    searchParams: URLSearchParams,
    options: { defaultLimit?: number; maxLimit?: number } = {}
): CursorPaginationParams {
    const defaultLimit = options.defaultLimit ?? 20;
    const maxLimit = options.maxLimit ?? 100;

    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(
        maxLimit,
        Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
    );
    const direction =
        searchParams.get('direction') === 'backward' ? 'backward' : 'forward';

    return { cursor, limit, direction };
}

// ═══════════════════════════════════════════════════════════════
// SORTING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse sorting parameters from URL search params
 */
export function parseSortParams<T extends Record<string, unknown>>(
    searchParams: URLSearchParams,
    allowedFields: Array<keyof T>
): {
    sortBy?: keyof T;
    sortOrder: 'asc' | 'desc';
} {
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');

    let sortBy: keyof T | undefined;
    if (sortByParam && allowedFields.includes(sortByParam as keyof T)) {
        sortBy = sortByParam as keyof T;
    }

    const sortOrder: 'asc' | 'desc' =
        sortOrderParam === 'desc' ? 'desc' : 'asc';

    return { sortBy, sortOrder };
}

/**
 * Apply sorting to Supabase query
 */
export function applySortToQuery<T extends Record<string, unknown>>(
    query: any,
    sortBy?: keyof T,
    sortOrder: 'asc' | 'desc' = 'asc'
): any {
    if (sortBy) {
        return query.order(String(sortBy), { ascending: sortOrder === 'asc' });
    }
    return query;
}

// ═══════════════════════════════════════════════════════════════
// FILTERING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse filter conditions from URL search params
 */
export function parseFilterParams(
    searchParams: URLSearchParams,
    allowedFields: string[]
): FilterCondition[] {
    const conditions: FilterCondition[] = [];

    for (const [key, value] of searchParams.entries()) {
        // Check for operator syntax: field[op]=value
        const match = key.match(/^(\w+)\[(\w+)\]$/);
        if (match) {
            const [, field, operator] = match;
            if (
                allowedFields.includes(field) &&
                isValidOperator(operator as FilterOperator)
            ) {
                conditions.push({
                    field,
                    operator: operator as FilterOperator,
                    value: parseFilterValue(value, operator as FilterOperator),
                });
            }
        } else if (allowedFields.includes(key)) {
            // Simple equality: field=value
            conditions.push({
                field: key,
                operator: 'eq',
                value: value,
            });
        }
    }

    return conditions;
}

function isValidOperator(op: string): op is FilterOperator {
    return [
        'eq',
        'neq',
        'gt',
        'gte',
        'lt',
        'lte',
        'in',
        'contains',
        'startsWith',
        'endsWith',
    ].includes(op);
}

function parseFilterValue(value: string, operator: FilterOperator): unknown {
    switch (operator) {
        case 'in':
            return value.split(',').map((v) => v.trim());
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte':
            return isNaN(Number(value)) ? value : Number(value);
        default:
            return value;
    }
}

/**
 * Apply filters to Supabase query
 */
export function applyFiltersToQuery<T extends Record<string, unknown>>(
    query: any,
    conditions: FilterCondition[]
): any {
    for (const { field, operator, value } of conditions) {
        switch (operator) {
            case 'eq':
                query = query.eq(field, value);
                break;
            case 'neq':
                query = query.neq(field, value);
                break;
            case 'gt':
                query = query.gt(field, value);
                break;
            case 'gte':
                query = query.gte(field, value);
                break;
            case 'lt':
                query = query.lt(field, value);
                break;
            case 'lte':
                query = query.lte(field, value);
                break;
            case 'in':
                query = query.in(field, value as string[]);
                break;
            case 'contains':
                query = query.like(field, `%${value}%`);
                break;
            case 'startsWith':
                query = query.like(field, `${value}%`);
                break;
            case 'endsWith':
                query = query.like(field, `%${value}`);
                break;
        }
    }

    return query;
}

// ═══════════════════════════════════════════════════════════════
// COMBINED QUERY BUILDER
// ═══════════════════════════════════════════════════════════════

export interface QueryBuilderOptions<T> {
    page?: number;
    limit?: number;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    filters?: FilterCondition[];
    search?: { field: keyof T; query: string };
}

/**
 * Build a complete query with pagination, sorting, and filtering
 */
export function buildQuery<T extends Record<string, unknown>>(
    baseQuery: any,
    options: QueryBuilderOptions<T>
): {
    query: any;
    pagination: { page: number; limit: number };
} {
    let query = baseQuery;

    // Apply filters
    if (options.filters?.length) {
        query = applyFiltersToQuery(query, options.filters);
    }

    // Apply search
    if (options.search) {
        query = query.like(String(options.search.field), `%${options.search.query}%`);
    }

    // Apply sorting
    if (options.sortBy) {
        query = applySortToQuery(query, options.sortBy, options.sortOrder || 'asc');
    }

    // Apply pagination
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    return { query, pagination: { page, limit } };
}

// ═══════════════════════════════════════════════════════════════
// REQUEST ID GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `req_${timestamp}_${random}`;
}

/**
 * Extract or generate request ID from headers
 */
export function getOrGenerateRequestId(headers: Headers): string {
    return headers.get('X-Request-ID') || generateRequestId();
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

/**
 * Wrap an API handler with standardized response formatting
 */
export function withApiResponse<T>(
    handler: () => Promise<NextResponse<ApiResponse<T>>>
): () => Promise<NextResponse<ApiResponse<T>>> {
    return async () => {
        const requestId = generateRequestId();
        const startTime = Date.now();

        try {
            const response = await handler();
            const duration = Date.now() - startTime;

            // Add timing header
            response.headers.set('X-Response-Time', `${duration}ms`);
            response.headers.set('X-Request-ID', requestId);

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorResponse = errorResponse(error as Error, requestId);
            errorResponse.headers.set('X-Response-Time', `${duration}ms`);
            return errorResponse;
        }
    };
}
