/**
 * GET /api/doubt/thread/[id]
 * DELETE /api/doubt/thread/[id]
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Get complete doubt thread with all Q&A
 * - Delete thread (owner only)
 * - Thread history and context preservation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { doubtService } from '@/lib/doubt/doubt-service';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET HANDLER - Get Thread Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID required' },
        { status: 400 }
      );
    }

    // Get thread with all questions and answers
    const result = await doubtService.getThread(threadId, user.id);

    if (result.error || !result.thread) {
      return NextResponse.json(
        { success: false, error: result.error || 'Thread not found' },
        { status: 404 }
      );
    }

    // Build response with full thread data
    const response = {
      success: true,
      data: {
        thread: {
          ...result.thread,
          isOwner: result.thread.user_id === user.id,
        },
        questions: result.questions.map(q => ({
          ...q,
          attachments: q.attachments || [],
        })),
        answers: result.answers.map(a => ({
          ...a,
          // Include rating if user has rated this answer
        })),
        stats: {
          totalQuestions: result.questions.length,
          totalAnswers: result.answers.length,
          avgResponseTimeMs: result.answers.length > 0
            ? result.answers.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / result.answers.length
            : 0,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get thread API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get thread' 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE HANDLER - Delete Thread
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID required' },
        { status: 400 }
      );
    }

    // Delete thread (cascade will handle related records)
    const result = await doubtService.deleteThread(threadId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Thread not found' ? 404 : 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully',
    });
  } catch (error) {
    console.error('Delete thread API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete thread' 
      },
      { status: 500 }
    );
  }
}
