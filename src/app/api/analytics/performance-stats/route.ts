/**
 * Performance Analytics API — /api/analytics/performance-stats
 *
 * Returns quiz performance trends, subject-wise accuracy, and score distribution.
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

    // 1. Quiz scores over time
    const { data: quizzes } = await (supabase
      .from('quizzes') as any)
      .select('id, score, total_questions, correct_answers, subject, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);

    const quizTrend = (quizzes || []).map((q: any) => ({
      date: q.created_at?.split('T')[0] || '',
      score: q.score || 0,
      total: q.total_questions || 0,
      correct: q.correct_answers || 0,
      subject: q.subject || 'General',
    }));

    // 2. Subject-wise accuracy from user_mastery joined with knowledge_nodes
    const { data: masteryNodes } = await (supabase
      .from('user_mastery') as any)
      .select(`
        accuracy_score,
        attempts,
        correct,
        time_spent_seconds,
        mastery_level,
        knowledge_nodes!inner(subject)
      `)
      .eq('user_id', user.id);

    const subjectMap = new Map<string, { accuracy: number[]; time: number; count: number; mastered: number }>();
    (masteryNodes || []).forEach((r: any) => {
      const subject = r.knowledge_nodes?.subject || 'Other';
      const prev = subjectMap.get(subject) || { accuracy: [], time: 0, count: 0, mastered: 0 };
      if (r.accuracy_score > 0) prev.accuracy.push(r.accuracy_score);
      prev.time += r.time_spent_seconds || 0;
      prev.count++;
      if (r.mastery_level === 'mastered') prev.mastered++;
      subjectMap.set(subject, prev);
    });

    const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      avgAccuracy: data.accuracy.length > 0
        ? Math.round((data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length) * 100)
        : 0,
      totalTime: Math.round(data.time / 60), // minutes
      topicCount: data.count,
      masteredCount: data.mastered,
    }));

    // 3. Score distribution (buckets of 10%)
    const distribution = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${i * 10 + 10}%`,
      count: 0,
    }));
    quizTrend.forEach((q: any) => {
      const bucket = Math.min(Math.floor(q.score / 10), 9);
      distribution[bucket].count++;
    });

    // 4. Overall stats
    const scores = quizTrend.map((q: any) => q.score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

    // 5. Recent improvement (last 5 vs previous 5)
    let improvement = 0;
    if (scores.length >= 10) {
      const recent5 = scores.slice(-5).reduce((a: number, b: number) => a + b, 0) / 5;
      const prev5 = scores.slice(-10, -5).reduce((a: number, b: number) => a + b, 0) / 5;
      improvement = Math.round(recent5 - prev5);
    }

    return NextResponse.json({
      quizTrend,
      subjectPerformance,
      distribution,
      avgScore,
      bestScore,
      totalQuizzes: quizTrend.length,
      improvement,
    });
  } catch (err) {
    console.error('Performance stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
