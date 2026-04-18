// src/lib/agents/core/evaluation-agent.ts
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { newTraceId, recordTrace } from './traces';
import { chat, DEFAULT_CHAT_MODEL } from './openai-client';
import { KnowledgeAgentImpl } from './knowledge-agent';
import type {
  EvaluationAgent, EvaluationAgentVersion, ScoringVersion,
  QuizAttempt, ScoreResult, Question, Answer, Explanation,
  MasteryDelta, WeakTopic, UserPerformanceSummary,
} from './types';

const VERSION: EvaluationAgentVersion = 'v1';
const SCORING_VERSION: ScoringVersion = 'v1';

export interface EvalInitOpts {
  feature?: string;
}

export class EvaluationAgentImpl implements EvaluationAgent {
  readonly version = VERSION;
  readonly scoringVersion = SCORING_VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  constructor(opts: EvalInitOpts = {}) { this.feature = opts.feature ?? 'unknown'; }

  async evaluateAttempt(attempt: QuizAttempt): Promise<ScoreResult> {
    const traceId = newTraceId();
    const started = Date.now();
    const perQuestion = attempt.questions.map((q) => ({
      id: q.id,
      isCorrect: q.userAnswer === q.correct,
      timeMs: q.timeMs,
    }));
    const correctCount = perQuestion.filter((p) => p.isCorrect).length;
    const totalCount = perQuestion.length;
    const accuracyPct = (correctCount / totalCount) * 100;
    const timeTotalMs = perQuestion.reduce((acc, p) => acc + p.timeMs, 0);

    const result: ScoreResult = { correctCount, totalCount, accuracyPct, timeTotalMs, perQuestion };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'evaluateAttempt', feature: this.feature,
      status: 'success', input: { quizId: attempt.quizId, count: totalCount },
      output: result, latencyMs: Date.now() - started, version: VERSION,
    });
    return result;
  }

  async explainWrong(q: Question, userAnswer: Answer, correct: Answer): Promise<Explanation> {
    const traceId = newTraceId();
    const started = Date.now();
    // Call Knowledge Agent for grounded context.
    const knowledge = new KnowledgeAgentImpl({ feature: this.feature });
    const chunks = await knowledge.retrieve(`${q.prompt} ${correct.text}`, { topK: 4, filter: { topicId: q.topicId } });
    const grounded = await knowledge.ground(
      `Why is "${correct.text}" correct and "${userAnswer.text}" wrong for: ${q.prompt}?`,
      chunks, { cite: true, maxTokens: 350 },
    );

    const explanation: Explanation = {
      answerText: grounded.text,
      citations: grounded.citations,
      whyWrong: `You chose "${userAnswer.text}", but the correct answer is "${correct.text}".`,
      relatedTopics: [q.topicId],
    };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'explainWrong', feature: this.feature,
      status: 'success', input: { questionId: q.id, topicId: q.topicId },
      output: { citationCount: grounded.citations.length },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return explanation;
  }

  async updateMastery(userId: string, attempt: QuizAttempt): Promise<MasteryDelta[]> {
    const traceId = newTraceId();
    const started = Date.now();
    // 1. Append interaction row first (source of truth).
    await this.sb.from('v8_user_interactions').insert({
      user_id: userId,
      type: 'quiz_attempt',
      topic_id: attempt.topicId,
      payload: attempt,
      result: await this.evaluateAttempt(attempt),
      time_spent_ms: attempt.questions.reduce((a, q) => a + q.timeMs, 0),
    });

    // 2. Recompute mastery from interactions (the only legal write path to v8_user_mastery).
    const deltas = await this.recomputeMasteryInternal(userId);

    await recordTrace({
      traceId, agent: 'evaluation', method: 'updateMastery', feature: this.feature,
      status: 'success', input: { userId, topicId: attempt.topicId },
      output: { deltaCount: deltas.length }, latencyMs: Date.now() - started, version: VERSION,
    });
    return deltas;
  }

  async weakTopics(userId: string, opts: { limit?: number } = {}): Promise<WeakTopic[]> {
    const traceId = newTraceId();
    const started = Date.now();
    const { data, error } = await this.sb
      .from('v8_user_mastery')
      .select('topic_id, mastery, confidence, last_seen')
      .eq('user_id', userId)
      .lt('mastery', 0.5)
      .order('mastery', { ascending: true })
      .limit(opts.limit ?? 10);
    if (error) throw error;
    const out: WeakTopic[] = (data ?? []).map((r: any) => ({
      topicId: r.topic_id, mastery: Number(r.mastery), confidence: Number(r.confidence),
      lastSeen: r.last_seen,
    }));
    await recordTrace({
      traceId, agent: 'evaluation', method: 'weakTopics', feature: this.feature,
      status: 'success', output: { count: out.length },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return out;
  }

  async analytics(userId: string): Promise<UserPerformanceSummary> {
    const traceId = newTraceId();
    const started = Date.now();
    const { data: readiness } = await this.sb
      .from('v8_readiness_score').select('*').eq('user_id', userId).maybeSingle();
    const weak = await this.weakTopics(userId, { limit: 5 });
    const summary: UserPerformanceSummary = {
      overallMastery: Number(readiness?.overall_mastery ?? 0),
      strongCount: readiness?.strong_count ?? 0,
      weakCount: readiness?.weak_count ?? 0,
      topicsTouched: readiness?.topics_touched ?? 0,
      recentActivity: readiness?.most_recent_activity ?? null,
      weakTopics: weak,
    };
    await recordTrace({
      traceId, agent: 'evaluation', method: 'analytics', feature: this.feature,
      status: 'success', output: summary,
      latencyMs: Date.now() - started, version: VERSION,
    });
    return summary;
  }

  async recomputeMastery(userId: string): Promise<void> {
    const traceId = newTraceId();
    const started = Date.now();
    await this.recomputeMasteryInternal(userId);
    await recordTrace({
      traceId, agent: 'evaluation', method: 'recomputeMastery', feature: this.feature,
      status: 'success', input: { userId },
      latencyMs: Date.now() - started, version: VERSION,
    });
  }

  // Deterministic, idempotent mastery recomputation.
  // Algorithm (scoringVersion v1): for each topic_id seen in user_interactions,
  //   accuracy = correct / total across all quiz_attempt rows for that topic.
  //   mastery = min(1, accuracy * (1 + log10(1 + attempts)))
  //   confidence = min(1, attempts / 10)
  //   streak_days = consecutive days with ≥1 interaction
  private async recomputeMasteryInternal(userId: string): Promise<MasteryDelta[]> {
    const { data: rows, error } = await this.sb
      .from('v8_user_interactions')
      .select('type, topic_id, result, created_at')
      .eq('user_id', userId)
      .eq('type', 'quiz_attempt')
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Group by topic_id.
    const byTopic = new Map<string, { correct: number; total: number; last: string }>();
    for (const r of rows ?? []) {
      if (!r.topic_id) continue;
      const cur = byTopic.get(r.topic_id) ?? { correct: 0, total: 0, last: r.created_at };
      const score = (r.result ?? {}) as { correctCount?: number; totalCount?: number };
      cur.correct += score.correctCount ?? 0;
      cur.total += score.totalCount ?? 0;
      cur.last = r.created_at;
      byTopic.set(r.topic_id, cur);
    }

    // Before snapshot for deltas
    const beforeRes = await this.sb.from('v8_user_mastery').select('*').eq('user_id', userId);
    const before = new Map<string, any>((beforeRes.data ?? []).map((r: any) => [r.topic_id, r]));

    // Compute and upsert
    const upserts: any[] = [];
    const deltas: MasteryDelta[] = [];
    for (const [topicId, stats] of byTopic) {
      const accuracy = stats.total === 0 ? 0 : stats.correct / stats.total;
      const masteryRaw = accuracy * (1 + Math.log10(1 + stats.total));
      const mastery = Math.min(1, Math.max(0, Number(masteryRaw.toFixed(2))));
      const confidence = Math.min(1, Number((stats.total / 10).toFixed(2)));
      upserts.push({
        user_id: userId, topic_id: topicId,
        mastery, confidence,
        last_seen: stats.last,
        streak_days: 0,  // streak computed in Phase 2 — leave 0 for now
        scoring_version: SCORING_VERSION,
        updated_at: new Date().toISOString(),
      });
      const prev = before.get(topicId);
      deltas.push({
        topicId,
        masteryBefore: prev ? Number(prev.mastery) : 0,
        masteryAfter: mastery,
        confidenceBefore: prev ? Number(prev.confidence) : 0,
        confidenceAfter: confidence,
      });
    }

    // Wipe + re-insert (idempotent, deterministic).
    await this.sb.from('v8_user_mastery').delete().eq('user_id', userId);
    if (upserts.length) {
      const { error: insErr } = await this.sb.from('v8_user_mastery').insert(upserts);
      if (insErr) throw insErr;
    }
    return deltas;
  }
}
