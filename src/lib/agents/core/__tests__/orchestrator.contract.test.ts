/**
 * @jest-environment node
 *
 * OrchestratorAgent Contract Gate.
 * Hits real Supabase + real OpenAI. Exercises all 4 mentor modes,
 * the parent→child trace chain, and the recommendation / plan helpers.
 */
import fs from 'fs';
import path from 'path';

// Load real creds from .env.coolify BEFORE module-under-test captures env.
(() => {
  try {
    const envPath = path.resolve(__dirname, '../../../../../.env.coolify');
    const envFile = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of envFile.split(/\r?\n/)) {
      const line = rawLine.replace(/\r$/, '');
      const m = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY)=(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* swallow — test will emit clear failure if creds missing */
  }
})();

import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { OrchestratorAgentImpl } = require('../orchestrator-agent');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const TEST_USER = '00000000-0000-0000-0000-00000000C0DE';

describe('OrchestratorAgent contract', () => {
  const agent = new OrchestratorAgentImpl({ feature: 'test' });

  beforeAll(async () => {
    // Clean v8 first (FKs cascade otherwise), then seed a throwaway auth
    // user — v8_user_mastery.user_id has a hard FK to auth.users(id).
    await sb.from('v8_user_mastery').delete().eq('user_id', TEST_USER);
    await sb.from('v8_user_interactions').delete().eq('user_id', TEST_USER);
    await sb.auth.admin.deleteUser(TEST_USER).catch(() => {});
    const staleEmail = `orch-contract-${TEST_USER.toLowerCase()}@test.invalid`;
    const list = await sb.auth.admin.listUsers({ perPage: 200 });
    for (const u of list.data?.users ?? []) {
      if (u.email === staleEmail && u.id !== TEST_USER) {
        await sb.auth.admin.deleteUser(u.id).catch(() => {});
      }
    }
    const { error: ce } = await sb.auth.admin.createUser({
      id: TEST_USER,
      email: staleEmail,
      email_confirm: true,
      password: 'contract-test-throwaway-pw',
    } as any);
    if (ce) throw new Error(`seed user failed: ${ce.message}`);

    // Seed a small mastery state so nextBestAction and studyPlan have data.
    await sb.from('v8_user_mastery').insert([
      { user_id: TEST_USER, topic_id: 'polity.fundamental_rights', mastery: 0.35, confidence: 0.4, scoring_version: 'v1' },
      { user_id: TEST_USER, topic_id: 'economy.gdp', mastery: 0.80, confidence: 0.7, scoring_version: 'v1' },
    ]);
  });

  afterAll(async () => {
    await sb.from('agent_traces').delete().eq('feature', 'test');
    await sb.from('v8_user_mastery').delete().eq('user_id', TEST_USER);
    await sb.from('v8_user_interactions').delete().eq('user_id', TEST_USER);
    await sb.auth.admin.deleteUser(TEST_USER).catch(() => {});
  });

  it('exposes version v1', () => {
    expect(agent.version).toBe('v1');
  });

  it('answer() in explain mode returns ExplainReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'What are fundamental rights?', { mode: 'explain' });
    expect(reply.mode).toBe('explain');
    if (reply.mode === 'explain') {
      expect(typeof reply.answer).toBe('string');
      expect(Array.isArray(reply.citations)).toBe(true);
      expect(Array.isArray(reply.relatedTopics)).toBe(true);
    }
  });

  it('answer() in strategy mode returns StrategyReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'How should I study polity?', { mode: 'strategy' });
    expect(reply.mode).toBe('strategy');
    if (reply.mode === 'strategy') {
      expect(typeof reply.recommendation).toBe('string');
      expect(typeof reply.rationale).toBe('string');
      expect(Array.isArray(reply.nextSteps)).toBe(true);
      expect(Array.isArray(reply.weakTopicsAddressed)).toBe(true);
    }
  });

  it('answer() in revision mode returns RevisionReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'Revise fundamental rights', { mode: 'revision' });
    expect(reply.mode).toBe('revision');
    if (reply.mode === 'revision') {
      expect(typeof reply.topic).toBe('string');
      expect(Array.isArray(reply.keyPoints)).toBe(true);
      expect(Array.isArray(reply.commonMistakes)).toBe(true);
    }
  });

  it('answer() in diagnostic mode returns DiagnosticReply shape', async () => {
    const reply = await agent.answer(TEST_USER, 'Diagnose my weak areas', { mode: 'diagnostic' });
    expect(reply.mode).toBe('diagnostic');
    if (reply.mode === 'diagnostic') {
      expect(typeof reply.assessment).toBe('string');
      expect(Array.isArray(reply.strengths)).toBe(true);
      expect(Array.isArray(reply.gaps)).toBe(true);
      expect(typeof reply.priorityFix).toBe('string');
    }
  });

  it('orchestrator calls produce parent→child trace chain', async () => {
    const before = await sb.from('agent_traces').select('id', { count: 'exact', head: true })
      .eq('feature', 'test').eq('user_id', TEST_USER);
    await agent.answer(TEST_USER, 'Explain GDP', { mode: 'explain' });
    const after = await sb.from('agent_traces').select('*')
      .eq('feature', 'test').eq('user_id', TEST_USER)
      .order('created_at', { ascending: false }).limit(20);
    // Expect at least 1 orchestrator trace AND at least one child (knowledge or evaluation).
    const orchTraces = (after.data ?? []).filter((r: any) => r.agent === 'orchestrator');
    const childTraces = (after.data ?? []).filter((r: any) => r.parent_trace_id);
    expect(orchTraces.length).toBeGreaterThanOrEqual(1);
    expect(childTraces.length).toBeGreaterThanOrEqual(1);
  });

  it('nextBestAction returns a recommendation grounded in mastery data', async () => {
    const rec = await agent.nextBestAction(TEST_USER);
    expect(['revise','practice','read','rest']).toContain(rec.action);
    expect(typeof rec.reason).toBe('string');
    expect(typeof rec.estimatedMinutes).toBe('number');
  });

  it('studyPlan returns a day-by-day plan for the requested horizon', async () => {
    const plan = await agent.studyPlan(TEST_USER, 3);
    expect(plan.days.length).toBe(3);
    expect(plan.days[0].dayIndex).toBe(1);
    expect(plan.days[0].focus.length).toBeGreaterThan(0);
  });
});
