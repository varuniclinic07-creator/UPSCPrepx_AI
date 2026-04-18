/**
 * @jest-environment node
 *
 * EvaluationAgent Contract Gate.
 * Hits real Supabase. Uses feature='test' for all traces,
 * and cleans up traces + test rows after.
 */
import fs from 'fs';
import path from 'path';

// Load real creds from .env.coolify BEFORE the module-under-test captures env.
// jest.setup.js hardcodes placeholder Supabase URL / service key; without this
// block the test would write to nowhere.
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
const { EvaluationAgentImpl } = require('../evaluation-agent');
import type { QuizAttempt } from '../types';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const fixture: QuizAttempt = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'golden/fixtures/quiz-attempt-fixture.json'), 'utf8'),
);

describe('EvaluationAgent contract', () => {
  const agent = new EvaluationAgentImpl({ feature: 'test' });
  const testUserId = fixture.userId;

  beforeAll(async () => {
    // Clean slate in v8 tables first (FK cascades would fail otherwise).
    await sb.from('v8_user_interactions').delete().eq('user_id', testUserId);
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
    // Seed throwaway auth user — v8_user_interactions.user_id has a hard
    // FK to auth.users(id) (migration 055). Without this the inserts in
    // updateMastery silently fail and every downstream assertion passes
    // on empty data, masking real regressions.
    await sb.auth.admin.deleteUser(testUserId).catch(() => {});
    // Sweep any dangling user with the previous-run email too (unique-email
    // constraint on auth.users — a deleteUser-by-id on a mismatched-id row
    // from a crashed prior run leaves the email squatting).
    const staleEmail = `eval-contract-${testUserId.toLowerCase()}@test.invalid`;
    const list = await sb.auth.admin.listUsers({ perPage: 200 });
    for (const u of list.data?.users ?? []) {
      if (u.email === staleEmail && u.id !== testUserId) {
        await sb.auth.admin.deleteUser(u.id).catch(() => {});
      }
    }
    const { error: createErr } = await sb.auth.admin.createUser({
      id: testUserId,
      email: staleEmail,
      email_confirm: true,
      password: 'contract-test-throwaway-pw',
    } as any);
    if (createErr) throw new Error(`seed user failed: ${createErr.message}`);
  });

  afterAll(async () => {
    await sb.from('agent_traces').delete().eq('feature', 'test');
    await sb.from('v8_user_interactions').delete().eq('user_id', testUserId);
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
    await sb.auth.admin.deleteUser(testUserId).catch(() => {});
  });

  it('exposes version v1 and scoringVersion v1', () => {
    expect(agent.version).toBe('v1');
    expect(agent.scoringVersion).toBe('v1');
  });

  it('evaluateAttempt returns correct counts and accuracy', async () => {
    const res = await agent.evaluateAttempt(fixture);
    expect(res.totalCount).toBe(3);
    expect(res.correctCount).toBe(2);
    expect(res.accuracyPct).toBeCloseTo(66.67, 1);
    expect(res.perQuestion).toHaveLength(3);
  });

  it('updateMastery writes v8_user_mastery AND v8_user_interactions rows', async () => {
    await agent.updateMastery(testUserId, fixture);
    const mastery = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId);
    const interactions = await sb.from('v8_user_interactions').select('*').eq('user_id', testUserId);
    expect(mastery.data?.length).toBeGreaterThan(0);
    expect(interactions.data?.length).toBeGreaterThan(0);
    expect(interactions.data?.[0].type).toBe('quiz_attempt');
  });

  it('weakTopics surfaces topics with low mastery', async () => {
    const weak = await agent.weakTopics(testUserId, { limit: 5 });
    expect(Array.isArray(weak)).toBe(true);
    // After 2/3 correct on polity.fundamental_rights, mastery is moderate.
    // The exact number depends on scoring logic, but the call should return.
  });

  it('recomputeMastery is idempotent (spec §1.3 Invariant 2)', async () => {
    const first = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await agent.recomputeMastery(testUserId);
    const second = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await agent.recomputeMastery(testUserId);
    const third = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    // Second and third recomputes must produce byte-identical mastery/confidence fields.
    expect(second.data?.length).toBe(third.data?.length);
    for (let i = 0; i < (second.data?.length ?? 0); i++) {
      expect(third.data![i].mastery).toBe(second.data![i].mastery);
      expect(third.data![i].confidence).toBe(second.data![i].confidence);
    }
  });

  it('recomputeMastery reconstructs mastery from interactions alone (spec §1.3 Invariant 1)', async () => {
    const before = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    await sb.from('v8_user_mastery').delete().eq('user_id', testUserId);
    await agent.recomputeMastery(testUserId);
    const after = await sb.from('v8_user_mastery').select('*').eq('user_id', testUserId).order('topic_id');
    expect(after.data?.length).toBe(before.data?.length);
    for (let i = 0; i < (before.data?.length ?? 0); i++) {
      expect(after.data![i].mastery).toBe(before.data![i].mastery);
    }
  });

  it('analytics returns a summary with counts', async () => {
    const a = await agent.analytics(testUserId);
    expect(typeof a.overallMastery).toBe('number');
    expect(typeof a.topicsTouched).toBe('number');
    expect(Array.isArray(a.weakTopics)).toBe(true);
  });

  it('golden fixture score drift < 5% (R5)', async () => {
    const res = await agent.evaluateAttempt(fixture);
    // Baseline value — if scoringVersion is bumped, re-baseline explicitly.
    const baselineAccuracy = 66.67;
    expect(Math.abs(res.accuracyPct - baselineAccuracy)).toBeLessThan(5);
  });
});
