/**
 * Activity Analytics API — /api/analytics/activity-stats
 *
 * Returns daily study activity, streak info, and time distribution.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(Number(searchParams.get('days')) || 30, 90);

    const since = new Date(Date.now() - days * 86400000).toISOString();

    // 1. Daily mastery activity (group by day from user_mastery)
    const { data: masteryRows } = await (supabase
      .from('user_mastery') as any)
      .select('last_attempted_at, time_spent_seconds, attempts, correct')
      .eq('user_id', user.id)
      .gte('last_attempted_at', since);

    const dailyMap = new Map<string, { minutes: number; topics: number; attempts: number; correct: number }>();
    (masteryRows || []).forEach((r: any) => {
      if (!r.last_attempted_at) return;
      const day = r.last_attempted_at.split('T')[0];
      const prev = dailyMap.get(day) || { minutes: 0, topics: 0, attempts: 0, correct: 0 };
      prev.minutes += Math.round((r.time_spent_seconds || 0) / 60);
      prev.topics++;
      prev.attempts += r.attempts || 0;
      prev.correct += r.correct || 0;
      dailyMap.set(day, prev);
    });

    // Fill in missing days
    const dailyActivity: { date: string; minutes: number; topics: number; accuracy: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      dailyActivity.push({
        date: key,
        minutes: entry?.minutes || 0,
        topics: entry?.topics || 0,
        accuracy: entry && entry.attempts > 0
          ? Math.round((entry.correct / entry.attempts) * 100)
          : 0,
      });
    }

    // 2. Streak — consecutive days with activity
    let currentStreak = 0;
    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].minutes > 0 || dailyActivity[i].topics > 0) {
        currentStreak++;
      } else if (i < dailyActivity.length - 1) {
        break; // Allow today to be 0 if it's early in the day
      }
    }

    // 3. Total stats
    const totalMinutes = dailyActivity.reduce((s, d) => s + d.minutes, 0);
    const activeDays = dailyActivity.filter(d => d.minutes > 0 || d.topics > 0).length;
    const avgMinutesPerDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

    // 4. Weekly summary
    const weeklySummary: { week: string; minutes: number; topics: number }[] = [];
    for (let w = 0; w < Math.ceil(days / 7); w++) {
      const start = w * 7;
      const end = Math.min(start + 7, dailyActivity.length);
      const slice = dailyActivity.slice(start, end);
      weeklySummary.push({
        week: `W${w + 1}`,
        minutes: slice.reduce((s, d) => s + d.minutes, 0),
        topics: slice.reduce((s, d) => s + d.topics, 0),
      });
    }

    return NextResponse.json({
      dailyActivity,
      currentStreak,
      totalMinutes,
      activeDays,
      avgMinutesPerDay,
      weeklySummary,
    });
  } catch (err) {
    console.error('Activity stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
