// ═══════════════════════════════════════════════════════════════
// INPUT VALIDATION UTILITIES
// Centralized validation for API request data
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const schemas = {
    // User-related
    email: z.string().email().max(254),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).regex(/^[a-zA-Z\s\-']+$/),

    // Content-related
    topic: z.string().min(1).max(200).transform(s => s.trim()),
    subject: z.string().min(1).max(100).transform(s => s.trim()),
    content: z.string().min(1).max(50000),
    searchQuery: z.string().min(1).max(100).transform(s =>
        s.replace(/[%_\\'";\-\-]/g, '').trim()
    ),

    // IDs
    uuid: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9\-]+$/).max(50),

    // Pagination
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    // Quiz-related
    quizAnswers: z.array(z.number().int().min(0).max(3)),
    difficulty: z.enum(['easy', 'medium', 'hard']),

    // Plan-related
    planSlug: z.string().regex(/^[a-z0-9\-]+$/).max(50),

    // File-related
    fileName: z.string().max(255).regex(/^[a-zA-Z0-9_\-\.]+$/),
    fileSize: z.number().max(50 * 1024 * 1024), // 50MB max
};

// ═══════════════════════════════════════════════════════════════
// COMPOSITE SCHEMAS FOR COMMON API PAYLOADS
// ═══════════════════════════════════════════════════════════════

export const apiSchemas = {
    // Notes generation
    generateNotes: z.object({
        topic: schemas.topic,
        subject: schemas.subject,
        level: z.enum(['basic', 'intermediate', 'advanced']).optional(),
    }),

    // Quiz generation
    generateQuiz: z.object({
        topic: schemas.topic,
        subject: schemas.subject,
        questionCount: z.number().int().min(5).max(50).default(10),
        difficulty: schemas.difficulty.optional(),
    }),

    // Quiz submission
    submitQuiz: z.object({
        quizId: schemas.uuid,
        answers: schemas.quizAnswers,
        timeSpent: z.number().int().min(0).max(7200), // Max 2 hours
    }),

    // User registration
    register: z.object({
        email: schemas.email,
        password: schemas.password.optional(),
        name: schemas.name.optional(),
        phone: schemas.phone.optional(),
        registrationType: z.enum(['email', 'phone']),
    }),

    // User update
    updateUser: z.object({
        name: schemas.name.optional(),
        phone: schemas.phone.optional(),
        preferences: z.record(z.string(), z.unknown()).optional(),
    }),

    // Payment initiation
    initiatePayment: z.object({
        planSlug: schemas.planSlug,
    }),

    // Bookmark
    bookmark: z.object({
        contentType: z.enum(['note', 'quiz', 'lecture', 'article']),
        contentId: schemas.uuid,
    }),

    // Agentic query
    agenticQuery: z.object({
        query: z.string().min(1).max(2000),
        context: z.string().max(5000).optional(),
        model: z.string().max(50).optional(),
    }),

    // AI chat
    aiChat: z.object({
        messages: z.array(z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string().min(1).max(10000),
        })).min(1).max(100),
        model: z.string().max(50).optional(),
    }),
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: z.ZodIssue[];
}

/**
 * Validate data against a schema
 */
export function validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    try {
        const result = schema.safeParse(data);

        if (result.success) {
            return { success: true, data: result.data };
        }

        return {
            success: false,
            error: 'Validation failed',
            details: result.error.issues,
        };
    } catch (error) {
        return {
            success: false,
            error: 'Invalid input data',
        };
    }
}

/**
 * Validate and extract specific fields from request body
 */
export async function validateBody<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
    try {
        const body = await request.json();
        return validate(schema, body);
    } catch (error) {
        return {
            success: false,
            error: 'Invalid JSON body',
        };
    }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
): ValidationResult<T> {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return validate(schema, params);
}

// ═══════════════════════════════════════════════════════════════
// SANITIZATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize string input for display (prevent XSS)
 */
export function sanitizeForDisplay(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Sanitize for SQL-like queries
 */
export function sanitizeForQuery(input: string): string {
    return input
        .replace(/[%_\\'";\-\-]/g, '')
        .trim()
        .slice(0, 100);
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
        .slice(0, 255);
}
