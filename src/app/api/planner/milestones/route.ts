/**
 * Milestones API
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Get milestone progress
 * - Track achievements
 * - Bilingual support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { milestoneManager } from '@/lib/planner/milestone-manager';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

// ============================================================================
// GET - Get milestones
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('plan_id');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get plan ID from parameter or user's active plan
    let targetPlanId = planId;

    if (!targetPlanId) {
      const { data: plan } = await getSupabase()
        .from('study_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!plan) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No active study plan',
            error_hi: 'कोई सक्रिय अध्ययन योजना नहीं'
          },
          { status: 404 }
        );
      }

      targetPlanId = plan.id;
    }

    // Verify plan ownership
    const { data: plan } = await getSupabase()
      .from('study_plans')
      .select('user_id')
      .eq('id', targetPlanId)
      .single();

    if (!plan || plan.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', error_hi: 'अनधिकृत' },
        { status: 403 }
      );
    }

    // Get all milestones
    const allMilestones = await milestoneManager.getMilestones(targetPlanId);
    const achievedMilestones = await milestoneManager.getAchievedMilestones(targetPlanId);
    const upcomingMilestones = await milestoneManager.getUpcomingMilestones(targetPlanId);
    const summary = await milestoneManager.getProgressSummary(targetPlanId);

    return NextResponse.json({
      success: true,
      data: {
        planId: targetPlanId,
        allMilestones: allMilestones.map((m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          targetValue: m.targetValue,
          currentValue: m.currentValue,
          unit: m.unit,
          progressPercentage: m.progressPercentage,
          isAchieved: m.isAchieved,
          achievedAt: m.achievedAt,
          estimatedDate: m.estimatedDate,
        })),
        achievedMilestones: achievedMilestones.length,
        upcomingMilestones: upcomingMilestones.map((m) => ({
          id: m.id,
          type: m.type,
          title: m.title,
          progressPercentage: m.progressPercentage,
          estimatedDate: m.estimatedDate,
        })),
        summary: {
          totalMilestones: summary.totalMilestones,
          achievedMilestones: summary.achievedMilestones,
          upcomingMilestones: summary.upcomingMilestones,
          overallProgress: summary.overallProgress,
          nextMilestone: summary.nextMilestone
            ? {
                type: summary.nextMilestone.type,
                title: summary.nextMilestone.title,
                progressPercentage: summary.nextMilestone.progressPercentage,
                estimatedDate: summary.nextMilestone.estimatedDate,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get milestones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch milestones',
        error_hi: 'मील के पत्थर प्राप्त करने में विफल'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Trigger milestone check (manual refresh)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('plan_id');
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID required' },
        { status: 400 }
      );
    }

    // Verify plan ownership
    const { data: plan } = await getSupabase()
      .from('study_plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan || plan.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', error_hi: 'अनधिकृत' },
        { status: 403 }
      );
    }

    // Check all milestones for achievements
    const achievements = await milestoneManager.checkAllMilestones(planId);

    return NextResponse.json({
      success: true,
      data: {
        achievements: achievements.map((a) => ({
          milestoneType: a.milestone.type,
          title: a.milestone.title,
          xpReward: a.xpReward,
          celebrationMessage: a.celebrationMessage,
          achievedAt: a.achievedAt,
        })),
        count: achievements.length,
      },
      message: {
        en: achievements.length > 0
          ? `🎉 ${achievements.length} new milestone(s) achieved!`
          : 'No new milestones achieved',
        hi: achievements.length > 0
          ? `🎉 ${achievements.length} नए मील के पत्थर हासिल किए!`
          : 'कोई नया मील का पत्थर हासिल नहीं हुआ',
      },
    });
  } catch (error) {
    console.error('Failed to check milestones:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check milestones',
        error_hi: 'मील के पत्थरों की जांच करने में विफल'
      },
      { status: 500 }
    );
  }
}
