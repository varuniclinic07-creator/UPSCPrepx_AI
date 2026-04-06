/**
 * Schedule Adjustment API
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Get adjustment recommendations
 * - Apply schedule changes
 * - Bilingual support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { adaptiveAdjuster } from '@/lib/planner/adaptive-adjuster';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ApplyAdjustmentSchema = z.object({
  plan_id: z.string().uuid(),
  adjustment_type: z.enum(['add_hours', 'extend_date', 'add_revision', 'intensify']),
  options: z.object({
    additionalHoursPerDay: z.number().min(1).max(4).optional(),
    newExamDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    skipLowPriorityTopics: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// GET - Get adjustment recommendations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('plan_id');
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!planId) {
      // Get user's active plan
      const { data: plan } = await supabase
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

      return NextResponse.json({
        success: true,
        data: { planId: plan.id },
      });
    }

    // Verify plan ownership
    const { data: plan } = await supabase
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

    // Get recommendations from AI
    const result = await adaptiveAdjuster.getRecommendations(planId);

    return NextResponse.json({
      success: true,
      data: {
        planId,
        status: {
          daysBehind: result.status.daysBehind,
          completionRate: result.status.completionRate,
          expectedCompletionDate: result.status.expectedCompletionDate,
          originalExamDate: result.status.originalExamDate,
          isOnTrack: result.status.isOnTrack,
          riskLevel: result.status.riskLevel,
        },
        recommendations: result.recommendations,
        motivationalMessage: result.motivationalMessage,
      },
    });
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get recommendations',
        error_hi: 'सिफारिशें प्राप्त करने में विफल'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Apply schedule adjustment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = ApplyAdjustmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          error_hi: 'अमान्य इनपुट',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { plan_id, adjustment_type, options } = validation.data;

    // Verify plan ownership
    const { data: plan } = await supabase
      .from('study_plans')
      .select('user_id')
      .eq('id', plan_id)
      .single();

    if (!plan || plan.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', error_hi: 'अनधिकृत' },
        { status: 403 }
      );
    }

    // Apply adjustment
    const result = await adaptiveAdjuster.applyAdjustments(
      plan_id,
      adjustment_type,
      options
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message.en,
          error_hi: result.message.hi
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        tasksRescheduled: result.tasksRescheduled,
        tasksAdded: result.tasksAdded,
        tasksRemoved: result.tasksRemoved,
        newExamDate: result.newExamDate,
      },
    });
  } catch (error) {
    console.error('Failed to apply adjustment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to apply adjustment',
        error_hi: 'समायोजन लागू करने में विफल'
      },
      { status: 500 }
    );
  }
}
