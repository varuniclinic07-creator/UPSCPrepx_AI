/**
 * CRON: Mastery Notifications — Daily 6:00am IST
 *
 * For each active user:
 * 1. Check streak milestones
 * 2. Generate SRS due reminders
 * 3. Weekly digest (Sundays only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';
import { getMasteryStats } from '@/lib/mastery/mastery-service';
import {
  checkStreakMilestones,
  generateDueReminders,
  generateWeeklyDigest,
  generateCATopicAlerts,
  generateSubjectInactivityAlerts,
  generateAccuracyRegressionAlerts,
} from '@/lib/mastery/mastery-notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get active users (logged in within 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .gte('last_sign_in_at', weekAgo)
      .limit(200);

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const isSunday = new Date().getDay() === 0;
    let processed = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // 1. Get current stats (includes streak)
        const stats = await getMasteryStats(user.id);

        // 2. Streak milestone check
        if (stats.current_streak > 0) {
          await checkStreakMilestones(user.id, stats.current_streak);
        }

        // 3. SRS due reminders
        await generateDueReminders(user.id);

        // 4. Weekly digest (Sundays)
        if (isSunday) {
          await generateWeeklyDigest(user.id);
        }

        // 5. CA topic alerts (daily)
        await generateCATopicAlerts(user.id);

        // 6. Subject inactivity alerts (daily)
        await generateSubjectInactivityAlerts(user.id);

        // 7. Accuracy regression alerts (daily)
        await generateAccuracyRegressionAlerts(user.id);

        processed++;
      } catch (err) {
        console.error(`Mastery notification error for user ${user.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      isSunday,
      totalUsers: users.length,
    });
  } catch (error) {
    console.error('Mastery notifications cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
