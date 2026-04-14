/**
 * Daily Tasks API
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Get today's scheduled tasks
 * - Track completion status
 * - Bilingual support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { recommendationEngine } from '@/lib/planner/recommendation-engine';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

// ============================================================================
// GET - Get daily tasks
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's active plan
    const { data: plan } = await getSupabase()
      .from('study_plans' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single() as { data: any };

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

    // Get schedule for the date
    const { data: schedule } = await getSupabase()
      .from('study_schedules' as any)
      .select('*')
      .eq('plan_id', plan.id)
      .eq('date', date)
      .single() as { data: any };

    if (!schedule) {
      // No schedule for this date - might be in the future or past
      return NextResponse.json({
        success: true,
        data: {
          date,
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
          message: {
            en: 'No tasks scheduled for this date',
            hi: 'इस तिथि के लिए कोई कार्य निर्धारित नहीं है',
          },
        },
      });
    }

    // Get tasks for this schedule
    const { data: tasks } = await getSupabase()
      .from('study_tasks' as any)
      .select('*')
      .eq('schedule_id', schedule.id)
      .order('order_index', { ascending: true }) as { data: any[] | null };

    // Calculate progress
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
    const totalTasks = tasks?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        date,
        scheduleId: schedule.id,
        dayNumber: schedule.day_number,
        status: schedule.status,
        totalTasks,
        completedTasks,
        progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalEstimatedMinutes: schedule.total_estimated_minutes,
        totalActualMinutes: schedule.total_actual_minutes,
        tasks: tasks?.map((task) => ({
          id: task.id,
          type: task.task_type,
          subject: task.subject,
          topic: task.topic,
          subtopic: task.subtopic,
          estimatedMinutes: task.estimated_minutes,
          actualMinutes: task.actual_minutes,
          status: task.status,
          completedAt: task.completed_at,
          contentLinks: task.content_links || [],
          orderIndex: task.order_index,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Failed to get daily tasks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tasks',
        error_hi: 'कार्य प्राप्त करने में विफल'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Get recommendations for today
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get daily recommendations
    const recommendations = await recommendationEngine.getDailyRecommendations(userId);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        count: recommendations.length,
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
