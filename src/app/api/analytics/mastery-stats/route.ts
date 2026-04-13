/**
 * Mastery Analytics API — /api/analytics/mastery-stats
 *
 * Returns mastery distribution, SRS pipeline stats, and level progression.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Mastery level distribution
    const { data: masteryRows } = await (supabase
      .from('user_mastery') as any)
      .select('mastery_level, accuracy_score, ease_factor, interval_days, next_revision_at, last_attempted_at')
      .eq('user_id', user.id);

    const rows = masteryRows || [];

    const distribution = {
      not_started: 0, weak: 0, developing: 0, strong: 0, mastered: 0,
    };
    rows.forEach((r: any) => {
      if (r.mastery_level in distribution) {
        distribution[r.mastery_level as keyof typeof distribution]++;
      }
    });

    // 2. SRS pipeline — due today / this week / overdue
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString();

    let overdue = 0, dueToday = 0, dueThisWeek = 0, upcoming = 0;
    rows.forEach((r: any) => {
      if (!r.next_revision_at) return;
      const d = new Date(r.next_revision_at);
      if (d < now) overdue++;
      else if (d.toISOString() <= todayEnd) dueToday++;
      else if (d.toISOString() <= weekEnd) dueThisWeek++;
      else upcoming++;
    });

    // 3. Average ease factor & accuracy
    const avgEase = rows.length > 0
      ? rows.reduce((s: number, r: any) => s + (r.ease_factor || 2.5), 0) / rows.length
      : 2.5;
    const avgAccuracy = rows.length > 0
      ? rows.reduce((s: number, r: any) => s + (r.accuracy_score || 0), 0) / rows.length
      : 0;

    // 4. Weekly mastery progression (last 8 weeks simulation from last_attempted_at)
    const weeklyProgression: { week: string; mastered: number; strong: number; developing: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 86400000);
      const weekLabel = `W-${i}`;
      const itemsBeforeWeek = rows.filter((r: any) =>
        r.last_attempted_at && new Date(r.last_attempted_at) <= weekStart
      );
      weeklyProgression.push({
        week: weekLabel,
        mastered: itemsBeforeWeek.filter((r: any) => r.mastery_level === 'mastered').length,
        strong: itemsBeforeWeek.filter((r: any) => r.mastery_level === 'strong').length,
        developing: itemsBeforeWeek.filter((r: any) => r.mastery_level === 'developing').length,
      });
    }

    return NextResponse.json({
      distribution,
      srs: { overdue, dueToday, dueThisWeek, upcoming },
      avgEase: Math.round(avgEase * 100) / 100,
      avgAccuracy: Math.round(avgAccuracy * 100),
      totalTopics: rows.length,
      weeklyProgression,
    });
  } catch (err) {
    console.error('Mastery stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
