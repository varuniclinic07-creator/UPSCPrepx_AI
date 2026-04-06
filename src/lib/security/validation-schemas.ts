// ═══════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION SCHEMAS - Zod-based request validation
// ═══════════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════
// COMMON FIELD VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

const emailSchema = z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .transform(s => s.toLowerCase().trim());

const phoneSchema = z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .transform(s => s.replace(/\D/g, ''));

const _uuidSchema = z.string().uuid('Invalid ID format');

const slugSchema = z.string()
    .min(1, 'Slug required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format');

const safeStringSchema = z.string()
    .transform(s => s.replace(/[<>]/g, '').trim());

// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const aiChatSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1).max(16000),
    })).min(1, 'At least one message required').max(100, 'Too many messages'),
    model: z.string()
        .min(1)
        .max(100)
        .regex(/^[a-zA-Z0-9\-\/\.]+$/, 'Invalid model name'),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).max(8000).optional(),
    top_p: z.number().min(0).max(1).optional(),
    stream: z.boolean().optional(),
    userId: z.string().optional(),
    taskType: z.enum(['generation', 'analysis', 'chat', 'coding']).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// AGENTIC QUERY SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const agenticQuerySchema = z.object({
    query: z.string()
        .min(1, 'Query is required')
        .max(2000, 'Query too long')
        .transform(s => safeStringSchema.parse(s)),
    context: z.object({
        subject: z.string().max(100).optional(),
        topic: z.string().max(200).optional(),
        currentArticle: z.string().max(1000).optional(),
    }).optional(),
    options: z.object({
        combineServices: z.boolean().optional(),
        includeWebSearch: z.boolean().optional(),
        includeStaticMaterials: z.boolean().optional(),
        cache: z.boolean().optional(),
    }).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const registerSchema = z.object({
    email: emailSchema.optional(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain uppercase letter')
        .regex(/[a-z]/, 'Password must contain lowercase letter')
        .regex(/[0-9]/, 'Password must contain number')
        .optional(),
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    registrationType: z.enum(['email', 'phone']),
}).refine(
    data => data.registrationType === 'email' ? data.email && data.password : data.phone,
    { message: 'Email and password required for email registration, phone required for phone registration' }
);

export const otpSchema = z.object({
    phone: phoneSchema,
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'Invalid OTP'),
});

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const paymentInitiateSchema = z.object({
    planSlug: slugSchema,
});

export const paymentVerifySchema = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const notesGenerateSchema = z.object({
    topic: z.string().min(3).max(500),
    subject: z.string().min(1).max(100),
    style: z.enum(['detailed', 'bullet_points', 'summary', 'mnemonic']).optional(),
    include: z.array(z.enum([
        'examples', 'diagrams', 'timeline', 'key_terms', 'previous_year_questions'
    ])).optional(),
});

export const quizGenerateSchema = z.object({
    topic: z.string().min(3).max(500),
    subject: z.string().min(1).max(100),
    difficulty: z.enum(['easy', 'medium', 'hard', 'upsc_prelims', 'upsc_mains']).optional(),
    questionCount: z.number().min(5).max(50).optional(),
    questionTypes: z.array(z.enum([
        'mcq', 'true_false', 'fill_blank', 'match'
    ])).optional(),
});

export const lectureGenerateSchema = z.object({
    topic: z.string().min(3).max(500),
    subject: z.string().min(1).max(100),
    duration: z.enum(['5', '10', '15', '20', '30']).optional(),
    style: z.enum(['lecture', 'animated', 'whiteboard']).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const materialUploadSchema = z.object({
    name: z.string().min(1).max(200),
    subject: z.string().min(1).max(100),
    category: z.enum(['ncert', 'reference', 'previous_year', 'notes', 'standard', 'other']),
    tags: z.array(z.string().max(50)).max(20).optional(),
    isStandard: z.boolean().optional(),
});

export const aiProviderSchema = z.object({
    name: z.string().min(1).max(100),
    display_name: z.string().min(1).max(100),
    api_base_url: z.string().url(),
    api_key_encrypted: z.string().optional(),
    default_model: z.string().min(1).max(100),
    available_models: z.array(z.string()).optional(),
    rate_limit_rpm: z.number().min(1).max(10000).optional(),
    rate_limit_tpm: z.number().min(1).max(10000000).optional(),
    priority: z.number().min(1).max(100).optional(),
    is_active: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY PARAMETER SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).default('desc'),
    sortBy: z.string().max(50).optional(),
});

export const filterSchema = z.object({
    subject: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    search: z.string().max(200).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPER
// ═══════════════════════════════════════════════════════════════════════════

export function validateRequest<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        return {
            success: false,
            error: NextResponse.json(
                {
                    error: 'Validation failed',
                    details: errors,
                },
                { status: 400 }
            ),
        };
    }

    return { success: true, data: result.data };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const schemas = {
    // AI
    aiChat: aiChatSchema,
    agenticQuery: agenticQuerySchema,

    // Auth
    register: registerSchema,
    otp: otpSchema,

    // Payments
    paymentInitiate: paymentInitiateSchema,
    paymentVerify: paymentVerifySchema,

    // Content
    notesGenerate: notesGenerateSchema,
    quizGenerate: quizGenerateSchema,
    lectureGenerate: lectureGenerateSchema,

    // Admin
    materialUpload: materialUploadSchema,
    aiProvider: aiProviderSchema,

    // Common
    pagination: paginationSchema,
    filter: filterSchema,
};