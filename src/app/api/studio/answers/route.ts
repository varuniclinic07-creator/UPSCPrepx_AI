/**
 * Answers API Route - User Content Studio (Feature F4)
 * 
 * Handles CRUD operations for practice answers
 * Master Prompt v8.0 - READ Mode
 * 
 * Endpoints:
 * - GET: List user answers with filters
 * - POST: Create new answer
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';
import { getAuthUser } from '@/lib/security/auth';
import { checkSubscriptionAccess } from '@/lib/trial/subscription-checker';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AnswerSchema = z.object({
  questionId: z.string().uuid().optional(),
  title: z.object({
    en: z.string().min(1).max(200),
    hi: z.string().min(1).max(200).optional(),
  }),
  content: z.string().min(1),
  contentHtml: z.string().optional(),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional']),
  wordLimit: z.number().int().positive().optional(),
  timeLimit: z.number().int().positive().optional(),
  timeSpent: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    isPractice: z.boolean().default(true),
    linkedMainsQuestion: z.string().uuid().optional(),
    evaluationId: z.string().uuid().optional(),
  }).optional(),
});

const UpdateAnswerSchema = AnswerSchema.partial();

const ListAnswersSchema = z.object({
  questionId: z.string().uuid().optional(),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional']).optional(),
  isEvaluated: z.boolean().optional(),
  hasEvaluation: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['created_at', 'updated_at', 'word_count', 'score']).default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// GET - List Answers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      questionId: searchParams.get('questionId') || undefined,
      subject: searchParams.get('subject') as any || undefined,
      isEvaluated: searchParams.get('isEvaluated') === 'true',
      hasEvaluation: searchParams.get('hasEvaluation') === 'true',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as any) || 'updated_at',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    };

    // Validate
    const validated = ListAnswersSchema.parse(queryParams);

    // Subscription check
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');

    // Build query
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase
      .from('user_answers')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.id);

    // Apply filters
    if (validated.questionId) {
      query = query.eq('question_id', validated.questionId);
    }
    if (validated.subject) {
      query = query.eq('subject', validated.subject);
    }
    if (validated.isEvaluated !== undefined) {
      query = query.eq('is_evaluated', validated.isEvaluated);
    }
    if (validated.hasEvaluation !== undefined) {
      // Join with mains_evaluations to check if evaluation exists
      query = query.eq('has_evaluation', validated.hasEvaluation);
    }
    if (validated.search) {
      query = query.or(
        `title_en.ilike.%${validated.search}%,content.ilike.%${validated.search}%`
      );
    }

    // Apply sorting
    const orderColumn = (validated.sortBy as string) === 'title' ? 'title_en' : validated.sortBy;
    query = query.order(orderColumn, { ascending: validated.sortOrder === 'asc' });

    // Pagination
    const from = (validated.page - 1) * validated.limit;
    const to = from + validated.limit - 1;
    query = query.range(from, to);

    // Execute
    const { data: answers, error, count } = await query;

    if (error) {
      console.error('Failed to fetch answers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        answers,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / validated.limit),
        },
      },
    });
  } catch (error) {
    console.error('Answers list error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Answer
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const validated = AnswerSchema.parse(body);

    // Subscription check
    const subscription = await checkSubscriptionAccess(authUser.id, 'content_studio');
    
    // Free tier limit: 20 answers/month
    if (subscription.tier !== 'premium' && subscription.tier !== 'premium_plus') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .gte('created_at', startOfMonth.toISOString());

      if ((count || 0) >= 20) {
        return NextResponse.json(
          {
            success: false,
            error: 'Free tier limit reached. Upgrade to Premium for unlimited answers.',
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // Best-effort KG normalization for the answer's subject + title
    try {
      await normalizeUPSCInput(`${validated.subject} ${validated.title.en}`);
    } catch { /* best-effort */ }

    // Calculate word count
    const wordCount = validated.content.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = validated.content.length;

    // Create answer
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: answer, error } = await supabase
      .from('user_answers')
      .insert({
        user_id: authUser.id,
        question_id: validated.questionId || null,
        title_en: validated.title.en,
        title_hi: validated.title.hi || validated.title.en,
        content: validated.content,
        content_html: validated.contentHtml || null,
        subject: validated.subject,
        word_limit: validated.wordLimit || null,
        time_limit: validated.timeLimit || null,
        time_spent: validated.timeSpent || null,
        word_count: wordCount,
        character_count: characterCount,
        tags: validated.tags || [],
        metadata: validated.metadata || {},
        is_evaluated: false,
        has_evaluation: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create answer:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create answer' },
        { status: 500 }
      );
    }

    // Award XP for writing answer (Gamification F13)
    try {
      await supabase.rpc('award_xp', {
        p_user_id: authUser.id,
        p_xp_amount: 15,
        p_reason: 'answer_written',
      });
    } catch (xpError) {
      console.warn('Failed to award XP:', xpError);
    }

    return NextResponse.json({
      success: true,
      data: answer,
      message: 'Answer created successfully',
    });
  } catch (error) {
    console.error('Create answer error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
