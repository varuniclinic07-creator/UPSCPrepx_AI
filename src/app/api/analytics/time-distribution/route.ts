/**
 * Time Distribution API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/time-distribution?range=[7d|30d]
 * - Returns time breakdown by subject
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTimeDistribution } from '@/lib/analytics/time-distribution';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
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
