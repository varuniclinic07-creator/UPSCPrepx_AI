/**
 * MCQ Bookmark API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Bookmark questions for revision
 * - Add personal notes
 * - Tag organization
 * - Spaced repetition scheduling
 * - Bulk operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adaptiveEngine } from '@/lib/mcq/adaptive-engine';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const bookmarkSchema = z.object({
  questionId: z.string().uuid(),
  action: z.enum(['add', 'remove', 'update']),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = bookmarkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error?.issues },
        { status: 400 }
      );
    }

    const { questionId, action, notes, tags, difficulty } = validation.data;

    if (action === 'remove') {
      // Remove bookmark
      await supabase
        .from('mcq_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      return NextResponse.json({
        success: true,
        message: 'Bookmark removed',
      });
    }

    if (action === 'add' || action === 'update') {
      // Calculate spaced repetition schedule
      const { data: question } = await supabase
        .from('mcq_questions')
        .select('correct_option')
        .eq('id', questionId)
        .single();

      // Get or create bookmark
      const { data: existing } = await supabase
        .from('mcq_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

      if (existing && action === 'add') {
        return NextResponse.json(
          { success: false, error: 'Question already bookmarked' },
          { status: 409 }
        );
      }

      // Calculate next review date
      const schedule = await adaptiveEngine.calculateSpacedRepetition(
        user.id,
        questionId,
        true // Assume correct for initial bookmark
      );

      if (existing) {
        // Update existing bookmark
        await supabase
          .from('mcq_bookmarks')
          .update({
            notes: notes || existing.notes,
            tags: tags || existing.tags,
            difficulty_for_user: difficulty || existing.difficulty_for_user,
            next_review_at: schedule.nextReviewDate,
            review_count: schedule.reviewCount,
          })
          .eq('user_id', user.id)
          .eq('question_id', questionId);
      } else {
        // Create new bookmark
        await supabase
          .from('mcq_bookmarks')
          .insert({
            user_id: user.id,
            question_id: questionId,
            notes,
            tags,
            difficulty_for_user: difficulty,
            next_review_at: schedule.nextReviewDate,
            review_count: schedule.reviewCount,
          });
      }

      return NextResponse.json({
        success: true,
        message: action === 'add' ? 'Question bookmarked' : 'Bookmark updated',
        nextReview: schedule.nextReviewDate,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Bookmark API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get user's bookmarks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const tag = searchParams.get('tag');
    const dueOnly = searchParams.get('due') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('mcq_bookmarks')
      .select(`
        *,
        question:mcq_questions(
          id,
          question_text,
          subject,
          topic,
          difficulty,
          is_pyy,
          year
        )
      `)
      .eq('user_id', user.id);

    // Filter by due date
    if (dueOnly) {
      const now = new Date().toISOString();
      query = query.lte('next_review_at', now);
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: bookmarks, error } = await query.order('next_review_at', { ascending: true }).limit(limit);

    if (error) {
      console.error('Failed to fetch bookmarks:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }

    // Get bookmark count
    const { count } = await supabase
      .from('mcq_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: bookmarks || [],
        total: count || 0,
        dueCount: dueOnly ? bookmarks?.length || 0 : null,
      },
    });
  } catch (error) {
    console.error('Bookmark GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
