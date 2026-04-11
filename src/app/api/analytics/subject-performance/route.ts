/**
 * Subject Performance API Route
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GET /api/analytics/subject-performance
 * - Returns MCQ accuracy per subject with trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubjectPerformance } from '@/lib/analytics/subject-performance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
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
