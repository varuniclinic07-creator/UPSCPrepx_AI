// ═══════════════════════════════════════════════════════════════
// ZOD VALIDATION SCHEMAS
// Centralized input validation for all API routes
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation
 */
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long');

/**
 * Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Phone number validation (Indian format)
 */
export const phoneSchema = z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .or(z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid international format'));

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Sorting schema
 */
export const sortingSchema = z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ═══════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Billing cycle enum
 */
export const billingCycleSchema = z.enum(['monthly', 'quarterly', 'yearly']).default('monthly');

/**
 * Payment initiation schema
 */
export const paymentInitiateSchema = z.object({
    planSlug: z
        .string()
        .min(1, 'Plan is required')
        .regex(/^[a-z0-9-]+$/, 'Invalid plan slug format'),
    billingCycle: billingCycleSchema.optional(),
});

/**
 * Payment verification schema
 */
export const paymentVerifySchema = z.object({
    paymentId: uuidSchema,
    orderId: z.string().min(1, 'Order ID is required'),
    signature: z.string().min(1, 'Signature is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
});

/**
 * Razorpay webhook payload schema (partial - we validate signature separately)
 */
export const razorpayWebhookSchema = z.object({
    event: z.string(),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string(),
                order_id: z.string(),
                status: z.string(),
                amount: z.number(),
            }).optional(),
        }).optional(),
        refund: z.object({
            entity: z.object({
                id: z.string(),
                payment_id: z.string(),
                amount: z.number(),
            }).optional(),
        }).optional(),
    }),
});

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTION SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Subscription tier enum
 */
export const subscriptionTierSchema = z.enum(['trial', 'basic', 'premium', 'premium_plus']);

/**
 * Subscription status enum
 */
export const subscriptionStatusSchema = z.enum(['active', 'cancelled', 'expired', 'past_due', 'trialing', 'pending']);

// ═══════════════════════════════════════════════════════════════
// USER SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * User profile update schema
 */
export const userUpdateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    avatarUrl: z.string().url('Invalid URL format').optional(),
    phone: phoneSchema.optional(),
});

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    notifications: z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        sms: z.boolean().optional(),
    }).optional(),
});

// ═══════════════════════════════════════════════════════════════
// AI/FEATURE SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Feature key enum for usage tracking
 */
export const featureKeySchema = z.enum([
    'mcq',
    'mains_eval',
    'custom_notes',
    'doubt',
    'mentor',
    'ai_chat',
    'notes_generate',
    'mind_maps',
]);

/**
 * Usage recording schema
 */
export const usageRecordSchema = z.object({
    feature: featureKeySchema,
    resourceId: uuidSchema.optional(),
    resourceType: z.string().optional(),
    tokensUsed: z.number().int().nonnegative().optional().default(0),
    metadata: z.record(z.unknown()).optional(),
});

/**
 * AI chat request schema
 */
export const aiChatSchema = z.object({
    message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
    sessionId: uuidSchema.optional(),
    context: z.record(z.unknown()).optional(),
});

/**
 * Notes generation schema
 */
export const notesGenerateSchema = z.object({
    topic: z.string().min(3, 'Topic is required').max(500, 'Topic too long'),
    subtopic: z.string().optional(),
    format: z.enum(['summary', 'detailed', 'bullet', 'mindmap']).default('detailed'),
    sourceMaterial: z.string().optional(),
});

/**
 * MCQ practice schema
 */
export const mcqPracticeSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    topic: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    count: z.number().int().positive().max(50).default(10),
});

/**
 * Mains answer evaluation schema
 */
export const mainsEvalSchema = z.object({
    questionId: uuidSchema,
    answerText: z.string().min(10, 'Answer too short').max(10000, 'Answer too long'),
    wordCount: z.number().int().positive().optional(),
});

// ═══════════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Login schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

/**
 * Registration schema
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: phoneSchema.optional(),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
});

// ═══════════════════════════════════════════════════════════════
// CONTENT SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Current affairs filter schema
 */
export const currentAffairsFilterSchema = paginationSchema.merge(sortingSchema).extend({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

/**
 * Notes library filter schema
 */
export const notesFilterSchema = paginationSchema.merge(sortingSchema).extend({
    subject: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdBy: z.enum(['user', 'ai', 'community']).optional(),
});

// ═══════════════════════════════════════════════════════════════
// CRON/AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════════

/**
 * Cron job auth schema
 */
export const cronAuthSchema = z.object({
    authorization: z.string().regex(/^Bearer .+$/, 'Invalid authorization header format'),
});

// ═══════════════════════════════════════════════════════════════
// LEGACY SCHEMAS (backward compatibility)
// ═══════════════════════════════════════════════════════════════

export const generateNotesSchema = z.object({
    topic: z.string().min(3, 'Topic too short').max(500, 'Topic too long'),
    subject: z.string().min(1, 'Subject is required'),
    level: z.enum(['basic', 'intermediate', 'advanced']).optional(),
});

export const generateQuizSchema = z.object({
    topic: z.string().min(3, 'Topic too short').max(500, 'Topic too long'),
    subject: z.string().min(1, 'Subject is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionCount: z.number().int().min(5).max(50).optional(),
});

export const submitQuizSchema = z.object({
    quizId: z.string().uuid('Invalid quiz ID'),
    answers: z.array(z.object({
        questionId: z.number().int(),
        selectedOption: z.number().int(),
    })),
    timeSpent: z.number().int().positive(),
});

export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').optional(),
    preferences: z.object({
        language: z.enum(['english', 'hindi']).optional(),
        theme: z.enum(['light', 'dark']).optional(),
        notifications: z.boolean().optional(),
    }).optional(),
});

export const createPaymentSchema = z.object({
    planId: z.string().uuid('Invalid plan ID'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
});

// Type exports
export type GenerateNotesInput = z.infer<typeof generateNotesSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ═══════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Validate request body against schema
 */
export function validateBody<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): z.infer<T> {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
        throw new ValidationError(errors);
    }

    return result.data;
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): z.infer<T> {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
        throw new ValidationError(errors);
    }

    return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
    public readonly errors: Array<{ field: string; message: string }>;
    public readonly code = 'VALIDATION_ERROR';

    constructor(errors: Array<{ field: string; message: string }>) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Sanitize object string fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}
