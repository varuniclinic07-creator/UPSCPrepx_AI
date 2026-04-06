/**
 * Complete Task API
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Mark task as complete
 * - Award XP rewards
 * - Track streaks
 * - Bilingual support
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { progressTracker } from '@/lib/planner/progress-tracker';
import { milestoneManager } from '@/lib/planner/milestone-manager';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CompleteTaskSchema = z.object({
  task_id: z.string().uuid(),
  time_spent_minutes: z.number().min(1).max(480),
  quality_rating: z.number().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// POST - Mark task as complete
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
    const validation = CompleteTaskSchema.safeParse(body);

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

    const { task_id, time_spent_minutes, quality_rating, notes } = validation.data;

    // Verify task belongs to user
    const { data: task } = await supabase
      .from('study_tasks')
      .select('*, schedules:study_schedules(plan_id)')
      .eq('id', task_id)
      .single();

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found', error_hi: 'कार्य नहीं मिला' },
        { status: 404 }
      );
    }

    // Verify plan ownership
    const planId = (task.schedules as any)?.plan_id;
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

    // Check if already completed
    if (task.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Task already completed',
          error_hi: 'कार्य पहले ही पूरा हो गया'
        },
        { status: 400 }
      );
    }

    // Mark task as complete via progress tracker
    const result = await progressTracker.completeTask({
      taskId: task_id,
      userId,
      timeSpentMinutes: time_spent_minutes,
      qualityRating: quality_rating,
      notes,
    });

    // Check milestones after completion
    const achievements = await milestoneManager.checkAllMilestones(planId);

    // Prepare response
    const response: any = {
      success: true,
      message: {
        en: 'Task completed successfully!',
        hi: 'कार्य सफलतापूर्वक पूरा हुआ!',
      },
      data: {
        taskId: task_id,
        xpEarned: result.xpEarned,
        streakDays: result.streakDays,
        dailyProgress: result.dailyProgress,
        achievements: achievements.map((a) => ({
          milestoneType: a.milestone.type,
          title: a.milestone.title,
          xpReward: a.xpReward,
          celebrationMessage: a.celebrationMessage,
        })),
      },
    };

    // Add streak bonus message if applicable
    if (result.streakDays > 0 && result.streakDays % 7 === 0) {
      response.streakBonus = {
        en: `🔥 ${result.streakDays} day streak! Amazing commitment!`,
        hi: `🔥 ${result.streakDays} दिन की streak! अद्भुत समर्पण!`,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to complete task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete task',
        error_hi: 'कार्य पूरा करने में विफल'
      },
      { status: 500 }
    );
  }
}
