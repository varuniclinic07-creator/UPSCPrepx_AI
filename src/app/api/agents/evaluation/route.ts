/**
 * Evaluation Agent HTTP surface.
 *
 * POST /api/agents/evaluation
 *   body: { action: 'submit',    attempt: QuizAttempt } → { score, deltas }
 *   body: { action: 'weak',      limit? }               → { weakTopics }
 *   body: { action: 'analytics' }                       → { summary }
 *   body: { action: 'recompute' }                       → { success }
 *
 * Phase-1 hero surface for C2 (Quiz page) migration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EvaluationAgentImpl } from '@/lib/agents/core/evaluation-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const agent = new EvaluationAgentImpl({ feature: 'quiz', userId: user.id });

    switch (action) {
      case 'submit': {
        const raw = body?.attempt;
        if (!raw || !Array.isArray(raw.questions)) {
          return NextResponse.json({ success: false, error: 'attempt.questions required' }, { status: 400 });
        }
        // Force-bind userId from auth, never trust client-sent id.
        const attempt = {
          userId: user.id,
          quizId: String(raw.quizId ?? `quiz-${Date.now()}`),
          topicId: String(raw.topicId ?? 'unknown'),
          questions: raw.questions,
        };
        const score = await agent.evaluateAttempt(attempt);
        const deltas = await agent.updateMastery(user.id, attempt);
        return NextResponse.json({ success: true, score, deltas });
      }
      case 'weak': {
        const limit = Math.min(20, Number(body?.limit ?? 5));
        const weakTopics = await agent.weakTopics(user.id, { limit });
        return NextResponse.json({ success: true, weakTopics });
      }
      case 'analytics': {
        const summary = await agent.analytics(user.id);
        return NextResponse.json({ success: true, summary });
      }
      case 'recompute': {
        await agent.recomputeMastery(user.id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
