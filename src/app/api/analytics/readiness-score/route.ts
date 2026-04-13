/**
 * Readiness Score API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/readiness-score
 * - Returns exam readiness score and factors
 */

import { NextRequest, NextResponse } from 'next/server';
import { readinessScore } from '@/lib/analytics/readiness-score';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const result = await readinessScore.calculate(userId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to calculate readiness score:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate readiness score' }, { status: 500 });
  }
}
