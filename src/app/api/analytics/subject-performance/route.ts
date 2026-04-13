/**
 * Subject Performance API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/subject-performance
 * - Returns MCQ accuracy per subject with trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubjectPerformance } from '@/lib/analytics/subject-performance';
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

    const data = await getSubjectPerformance(userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch subject performance:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subject performance' }, { status: 500 });
  }
}
