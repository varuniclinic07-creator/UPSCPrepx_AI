/**
 * Study Trends API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/study-trends?range=[7d|30d|90d]
 * - Returns daily study hours by subject
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudyTrends } from '@/lib/analytics/study-trends';
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

    const range = (request.nextUrl.searchParams.get('range') || '30d') as '7d' | '30d' | '90d';
    const data = await getStudyTrends(userId, range);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch study trends:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch study trends' }, { status: 500 });
  }
}
