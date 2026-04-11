/**
 * Study Planner Schedule API
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Create/get study schedules
 * - AI-powered generation
 * - Bilingual support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scheduleGenerator } from '@/lib/planner/schedule-generator';
import { milestoneManager } from '@/lib/planner/milestone-manager';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateScheduleSchema = z.object({
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daily_study_hours: z.number().min(1).max(16),
  subjects: z.array(z.string()).min(1),
  optional_subject: z.string().optional(),
  current_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

const GetScheduleSchema = z.object({
  plan_id: z.string().uuid().optional(),
});

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

// ============================================================================
// GET - Get study schedule
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const planId = searchParams.get('plan_id');

    if (!planId) {
      // Get user's active plan
      const userId = request.headers.get('x-user-id');
      
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      const { data: plan } = await getSupabase()
        .from('study_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!plan) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No active study plan found. Create one first.',
            error_hi: 'कोई सक्रिय अध्ययन योजना नहीं मिली। पहले एक बनाएं।'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          plan,
          milestones: await milestoneManager.getMilestones(plan.id),
        },
      });
    }

    // Get specific plan
    const { data: plan } = await getSupabase()
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Get schedules for this plan
    const { data: schedules } = await getSupabase()
      .from('study_schedules')
      .select('*, tasks:study_tasks(*)')
      .eq('plan_id', planId)
      .order('date', { ascending: true })
      .limit(30); // First 30 days

    return NextResponse.json({
      success: true,
      data: {
        plan,
        schedules,
        milestones: await milestoneManager.getMilestones(planId),
      },
    });
  } catch (error) {
    console.error('Failed to get schedule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schedule',
        error_hi: 'अनुसूची प्राप्त करने में विफल'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create study schedule
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user from headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = CreateScheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          error_hi: 'अमान्य इनपुट',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { exam_date, daily_study_hours, subjects, optional_subject, current_level } = validation.data;

    // Check if user already has an active plan
    const { data: existingPlan } = await getSupabase()
      .from('study_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existingPlan) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You already have an active study plan',
          error_hi: 'आपके पास पहले से ही एक सक्रिय अध्ययन योजना है'
        },
        { status: 400 }
      );
    }

    // Generate schedule using AI
    const schedule = await scheduleGenerator.generateSchedule({
      userId,
      examDate: exam_date,
      dailyStudyHours: daily_study_hours,
      subjects,
      optionalSubject: optional_subject,
      currentLevel: current_level,
    });

    // Get milestones
    const milestones = await milestoneManager.getMilestones(schedule.planId);

    return NextResponse.json(
      {
        success: true,
        message: {
          en: 'Study schedule created successfully!',
          hi: 'अध्ययन अनुसूची सफलतापूर्वक बनाई गई!',
        },
        data: {
          planId: schedule.planId,
          totalDays: schedule.totalDays,
          totalTasks: schedule.totalTasks,
          milestones: milestones.map((m) => ({
            type: m.type,
            title: m.title,
            estimatedDate: m.estimatedDate,
          })),
          firstWeek: schedule.days.slice(0, 7),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create schedule',
        error_hi: 'अनुसूची बनाने में विफल'
      },
      { status: 500 }
    );
  }
}
