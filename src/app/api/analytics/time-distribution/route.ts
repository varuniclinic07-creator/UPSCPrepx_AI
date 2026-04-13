/**
 * Time Distribution API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/time-distribution?range=[7d|30d]
 * - Returns time breakdown by subject
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTimeDistribution } from '@/lib/analytics/time-distribution';
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

    const range = (request.nextUrl.searchParams.get('range') || '7d') as '7d' | '30d';
    const data = await getTimeDistribution(userId, range);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch time distribution:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch time distribution' }, { status: 500 });
  }
}
