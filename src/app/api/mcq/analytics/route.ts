/**
 * MCQ Analytics API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Get comprehensive user analytics
 * - Performance tracking
 * - Weak area identification
 * - AI-powered recommendations
 * - Accuracy and speed trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analytics } from '@/lib/mcq/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const analyticsQuerySchema = z.object({
  days: z.string().transform(Number).default('30'),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Optional', 'General']).optional(),
});

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const validation = analyticsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query params', details: validation.errors },
        { status: 400 }
      );
    }

    const { days, subject } = validation.data;

    // Get comprehensive analytics
    const userAnalytics = await analytics.getUserAnalytics(user.id);

    // Filter by subject if specified
    let filteredAnalytics = userAnalytics;
    if (subject) {
      filteredAnalytics = {
        ...userAnalytics,
        subjectBreakdown: userAnalytics.subjectBreakdown.filter(s => s.subject === subject),
        topicBreakdown: userAnalytics.topicBreakdown.filter(t => t.subject === subject),
      };
    }

    // Get quick stats for header
    const { count: totalAttempts } = await supabase
      .from('mcq_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    const { count: totalBookmarks } = await supabase
      .from('mcq_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get recent activity
    const { data: recentAttempts } = await supabase
      .from('mcq_attempts')
      .select(`
        id,
        session_type,
        subject,
        topic,
        accuracy_percent,
        net_marks,
        completed_at,
        mock:mcq_mock_tests(
          title
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        analytics: filteredAnalytics,
        quickStats: {
          totalAttempts: totalAttempts || 0,
          totalBookmarks: totalBookmarks || 0,
          lastAttempt: recentAttempts?.[0]?.completed_at || null,
        },
        recentActivity: recentAttempts?.map(a => ({
          id: a.id,
          type: a.session_type,
          title: a.session_type === 'Mock' 
            ? (a as any).mock?.title || 'Mock Test'
            : `${a.subject} - ${a.topic || 'Practice'}`,
          accuracy: a.accuracy_percent,
          score: a.net_marks,
          date: a.completed_at,
        })) || [],
        period: {
          days,
          subject: subject || 'all',
        },
      },
    });
  } catch (error) {
    console.error('MCQ analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
