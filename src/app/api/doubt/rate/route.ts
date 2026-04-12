/**
 * POST /api/doubt/rate
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Rate answer quality (1-5 stars)
 * - Helpful/not helpful feedback
 * - Flag incorrect answers for review
 * - Rating affects AI provider analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { doubtService, ratingSchema } from '@/lib/doubt/doubt-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const rateRequestSchema = ratingSchema.extend({
  answer_id: z.string().uuid(),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Parse and validate request
    const body = await request.json();
    const validation = rateRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Rate the answer
    const result = await doubtService.rateAnswer(data.answer_id, user.id, data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === 'Answer not found' ? 404 : 500 }
      );
    }

    // If flagged, notify admin (optional - implement with notification service)
    if (data.is_flagged) {
      console.debug(`Answer ${data.answer_id} flagged by user ${user.id}`);
      // TODO: Send notification to admin queue
    }

    // Update provider analytics (optional)
    if (data.rating && data.rating <= 2) {
      // Track low ratings for provider performance analysis
      console.debug(`Low rating (${data.rating}) for answer ${data.answer_id}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: data.rating,
        isHelpful: data.is_helpful,
        isFlagged: data.is_flagged,
      },
    });
  } catch (error) {
    console.error('Rate answer API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit rating' 
      },
      { status: 500 }
    );
  }
}
