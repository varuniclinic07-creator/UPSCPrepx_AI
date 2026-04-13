/**
 * Mastery Update API — POST /api/mastery/update
 *
 * Records a practice result and updates SM-2 scheduling.
 * Called after quiz completions, MCQ sessions, revision reviews.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateMastery } from '@/lib/mastery/mastery-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nodeId, correct, total, timeSpentSec } = body;

    if (!nodeId || typeof correct !== 'number' || typeof total !== 'number') {
      return NextResponse.json(
        { success: false, error: 'nodeId, correct, and total are required' },
        { status: 400 }
      );
    }

    if (correct < 0 || total < 1 || correct > total) {
      return NextResponse.json(
        { success: false, error: 'Invalid correct/total values' },
        { status: 400 }
      );
    }

    const record = await updateMastery(
      user.id,
      nodeId,
      correct,
      total,
      timeSpentSec || 0
    );

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Failed to update mastery' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mastery_level: record.mastery_level,
        accuracy_score: record.accuracy_score,
        next_revision_at: record.next_revision_at,
        interval_days: record.interval_days,
        attempts: record.attempts,
      },
    });
  } catch (error) {
    console.error('Mastery update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
