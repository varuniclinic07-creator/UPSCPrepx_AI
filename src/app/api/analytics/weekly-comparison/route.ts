/**
 * Weekly Comparison API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/weekly-comparison
 * - Returns current vs previous week metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyComparison } from '@/lib/analytics/weekly-comparison';
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

    const data = await getWeeklyComparison(userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch weekly comparison:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch weekly comparison' }, { status: 500 });
  }
}
