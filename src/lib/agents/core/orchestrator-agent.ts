// src/lib/agents/core/orchestrator-agent.ts
// Mentor orchestrator: 4 modes (explain / strategy / revision / diagnostic),
// plus nextBestAction and studyPlan. Delegates content retrieval to the
// Knowledge Agent and mastery analytics to the Evaluation Agent so that
// calls chain via parent→child traces (spec §1.2 A5).
import { createClient } from '@supabase/supabase-js';
import { newTraceId, recordTrace } from './traces';
import { chat, DEFAULT_CHAT_MODEL, STRATEGY_MODEL } from './openai-client';
import { KnowledgeAgentImpl } from './knowledge-agent';
import { EvaluationAgentImpl } from './evaluation-agent';
import type {
  OrchestratorAgent, OrchestratorAgentVersion, MentorMode, MentorReply,
  Recommendation, StudyPlan,
} from './types';

const VERSION: OrchestratorAgentVersion = 'v1';

export interface OrchestratorInitOpts { feature?: string }

export class OrchestratorAgentImpl implements OrchestratorAgent {
  readonly version = VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  constructor(opts: OrchestratorInitOpts = {}) { this.feature = opts.feature ?? 'unknown'; }

  async answer(userId: string, message: string, context: { mode?: MentorMode } = {}): Promise<MentorReply> {
    const mode: MentorMode = context.mode ?? 'explain';
    const parentTrace = newTraceId();
    const started = Date.now();

    try {
      // Sub-agents inherit parent trace so calls chain
      const knowledge = new KnowledgeAgentImpl({ feature: this.feature });
      const evaluator = new EvaluationAgentImpl({ feature: this.feature });

      let reply: MentorReply;
      switch (mode) {
        case 'explain': {
          const chunks = await knowledge.retrieve(message, { topK: 5 });
          const grounded = await knowledge.ground(message, chunks, { cite: true, maxTokens: 400 });
          reply = {
            mode: 'explain',
            answer: grounded.text,
            citations: grounded.citations,
            relatedTopics: [...new Set(chunks.map((c: any) => c.meta.topicId).filter(Boolean))],
          };
          break;
        }
        case 'strategy': {
          const analytics = await evaluator.analytics(userId);
          const system = 'You are a UPSC mentor. Respond ONLY with JSON matching: {recommendation:string, rationale:string, nextSteps:string[], weakTopicsAddressed:string[]}.';
          const prompt = `User asked: ${message}\n\nTheir weak topics: ${analytics.weakTopics.map(w => w.topicId).join(', ') || 'none yet'}\nOverall mastery: ${analytics.overallMastery}\nRespond with JSON.`;
          const res = await chat({ model: STRATEGY_MODEL, system, prompt, jsonMode: true, maxTokens: 500 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'strategy',
            recommendation: String(parsed.recommendation ?? ''),
            rationale: String(parsed.rationale ?? ''),
            nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
            weakTopicsAddressed: Array.isArray(parsed.weakTopicsAddressed) ? parsed.weakTopicsAddressed.map(String) : [],
          };
          break;
        }
        case 'revision': {
          const chunks = await knowledge.retrieve(message, { topK: 4 });
          const system = 'You are a UPSC mentor. Output ONLY JSON: {topic:string, keyPoints:string[], commonMistakes:string[], quickQuiz?:[{q:string,a:string}]}.';
          const ctx = chunks.map((c: any, i: number) => `[C${i+1}] ${c.text}`).join('\n\n');
          const prompt = `Revise the topic for the student. Message: ${message}\n\nContext:\n${ctx}`;
          const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, jsonMode: true, maxTokens: 500 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'revision',
            topic: String(parsed.topic ?? message),
            keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
            commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes.map(String) : [],
            quickQuiz: Array.isArray(parsed.quickQuiz) ? parsed.quickQuiz.slice(0, 3) : undefined,
          };
          break;
        }
        case 'diagnostic': {
          const analytics = await evaluator.analytics(userId);
          // Separate strong vs gap topics from mastery data.
          const { data: masteryRows } = await this.sb.from('v8_user_mastery')
            .select('topic_id, mastery').eq('user_id', userId);
          const strengths = (masteryRows ?? [])
            .filter((r: any) => r.mastery >= 0.75)
            .map((r: any) => ({ topicId: r.topic_id, mastery: Number(r.mastery) }));
          const gaps = (masteryRows ?? [])
            .filter((r: any) => r.mastery < 0.5)
            .map((r: any) => ({ topicId: r.topic_id, mastery: Number(r.mastery) }));
          const system = 'UPSC mentor. JSON only: {assessment:string, priorityFix:string}.';
          const prompt = `Student question: ${message}\nAnalytics: overall=${analytics.overallMastery}, strong=${strengths.length}, gaps=${gaps.length}\nTop weak: ${gaps[0]?.topicId ?? 'none'}`;
          const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, jsonMode: true, maxTokens: 350 });
          const parsed = JSON.parse(res.text);
          reply = {
            mode: 'diagnostic',
            assessment: String(parsed.assessment ?? ''),
            strengths, gaps,
            priorityFix: String(parsed.priorityFix ?? gaps[0]?.topicId ?? ''),
          };
          break;
        }
      }

      await recordTrace({
        traceId: parentTrace, agent: 'orchestrator', method: 'answer',
        feature: this.feature, status: 'success', userId,
        input: { message, mode }, output: { mode: reply!.mode },
        latencyMs: Date.now() - started, version: VERSION,
      });
      return reply!;
    } catch (err: any) {
      await recordTrace({
        traceId: parentTrace, agent: 'orchestrator', method: 'answer',
        feature: this.feature, status: 'failure', userId,
        error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async nextBestAction(userId: string): Promise<Recommendation> {
    const traceId = newTraceId();
    const started = Date.now();
    const evaluator = new EvaluationAgentImpl({ feature: this.feature });
    const a = await evaluator.analytics(userId);
    const weakest = a.weakTopics[0];
    let rec: Recommendation;
    if (a.topicsTouched === 0) {
      rec = { action: 'read', reason: 'No activity yet — start by reading a note.', estimatedMinutes: 15 };
    } else if (weakest && weakest.mastery < 0.3) {
      rec = { action: 'revise', topicId: weakest.topicId, reason: `Mastery at ${weakest.mastery} on ${weakest.topicId} — revise before more practice.`, estimatedMinutes: 20 };
    } else if (weakest) {
      rec = { action: 'practice', topicId: weakest.topicId, reason: `Strengthen ${weakest.topicId} with practice questions.`, estimatedMinutes: 25 };
    } else {
      rec = { action: 'practice', reason: 'All topics look solid — broaden with mixed practice.', estimatedMinutes: 30 };
    }
    await recordTrace({
      traceId, agent: 'orchestrator', method: 'nextBestAction',
      feature: this.feature, status: 'success', userId, output: rec,
      latencyMs: Date.now() - started, version: VERSION,
    });
    return rec;
  }

  async studyPlan(userId: string, horizonDays: number): Promise<StudyPlan> {
    const traceId = newTraceId();
    const started = Date.now();
    const evaluator = new EvaluationAgentImpl({ feature: this.feature });
    const a = await evaluator.analytics(userId);
    const topics = a.weakTopics.length
      ? a.weakTopics.map((w) => w.topicId)
      : ['polity.constitution', 'economy.basics', 'environment.biodiversity'];
    const days = Array.from({ length: horizonDays }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() + i);
      const focus = topics.slice(0, 2).map((topicId) => ({
        topicId, minutes: 45, mode: (i % 3 === 0 ? 'read' : i % 3 === 1 ? 'quiz' : 'revise') as 'read'|'quiz'|'revise',
      }));
      return { dayIndex: i + 1, date: date.toISOString().slice(0, 10), focus };
    });
    const plan = { days };
    await recordTrace({
      traceId, agent: 'orchestrator', method: 'studyPlan',
      feature: this.feature, status: 'success', userId, output: { days: horizonDays },
      latencyMs: Date.now() - started, version: VERSION,
    });
    return plan;
  }
}
