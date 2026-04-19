/**
 * @jest-environment node
 *
 * KnowledgeAgent Contract Gate.
 * Hits real Supabase + real OpenAI. Uses feature='test' for all traces,
 * and cleans up traces + test rows after.
 *
 * Runs the same contract against BOTH implementations (swap-impl test, R2):
 *   - KnowledgeAgentImpl (real, wraps RAG + OpenAI)
 *   - InMemoryKnowledgeAgent (deterministic in-memory fake)
 * Both must pass identically — proves the interface is implementation-agnostic.
 */
import fs from 'fs';
import path from 'path';

// Load real creds from .env.coolify BEFORE the module-under-test captures env.
// jest.setup.js hardcodes placeholder Supabase URL / service key and does not
// set OPENAI_API_KEY at all, so without this block the test would either write
// to nowhere or hit OpenAI with no key.
(() => {
  try {
    const envPath = path.resolve(__dirname, '../../../../../.env.coolify');
    const envFile = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of envFile.split(/\r?\n/)) {
      const line = rawLine.replace(/\r$/, '');
      const m = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|OLLAMA_API_KEY|OLLAMA_BASE_URL|OLLAMA_MODEL|OLLAMA_STRATEGY_MODEL|LLM_PROVIDER|EMBED_PROVIDER|EMBED_MODEL|NINEROUTER_EMBED_BASE_URL|NINEROUTER_EMBED_API_KEY)=(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* swallow — test will emit clear failure if creds missing */
  }
})();

import { createClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { KnowledgeAgentImpl, InMemoryKnowledgeAgent } = require('../knowledge-agent');
import type { KnowledgeAgent } from '../types';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const fixturePath = path.join(__dirname, 'golden/fixtures/knowledge-doc-1.txt');
const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

// Real LLM + embed round-trips can exceed Jest's 5s default.
jest.setTimeout(60000);

function runContract(label: string, agent: KnowledgeAgent) {
  describe(`KnowledgeAgent contract [${label}]`, () => {
    const createdSourceIds: string[] = [];

    afterAll(async () => {
      // cleanup test traces + ingest rows
      await sb.from('agent_traces').delete().eq('feature', 'test');
      // cleanup is impl-specific; the impl should provide a test helper
      // that removes rows by sourceId.
      if (typeof (agent as any).__testCleanup === 'function') {
        await (agent as any).__testCleanup(createdSourceIds);
      }
    });

    it('exposes version "v1"', () => {
      expect(agent.version).toBe('v1');
    });

    it('ingest returns a sourceId and positive chunkCount', async () => {
      const res = await agent.ingest({
        type: 'note',
        content: fixtureContent,
        meta: { topicId: 'polity.constitution', title: 'Constitution fixture' },
      });
      expect(res.sourceId).toBeTruthy();
      expect(res.chunkCount).toBeGreaterThan(0);
      createdSourceIds.push(res.sourceId);
    });

    it('retrieve returns chunks matching the query', async () => {
      const chunks = await agent.retrieve('When did the Indian Constitution come into effect?', {
        topK: 4,
        filter: { topicId: 'polity.constitution' },
      });
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeLessThanOrEqual(4);
      // Must find content about 26 January 1950 somewhere in the chunks.
      const joined = chunks.map((c) => c.text).join(' ').toLowerCase();
      expect(joined).toContain('26 january 1950');
    });

    it('retrieve hard-caps topK at 8 (spec §1.2)', async () => {
      const chunks = await agent.retrieve('constitution', { topK: 50 });
      expect(chunks.length).toBeLessThanOrEqual(8);
    });

    it('ground produces text with citations when cite=true', async () => {
      const chunks = await agent.retrieve('fundamental rights constitution', { topK: 3 });
      const answer = await agent.ground('Which part contains Fundamental Rights?', chunks, {
        cite: true,
        maxTokens: 200,
      });
      expect(answer.text.length).toBeGreaterThan(0);
      expect(answer.citations.length).toBeGreaterThan(0);
      expect(answer.tokensIn).toBeGreaterThan(0);
      expect(answer.tokensOut).toBeGreaterThan(0);
    });

    it('every call produces an agent_traces row with feature=test', async () => {
      const before = await sb
        .from('agent_traces')
        .select('id', { count: 'exact', head: true })
        .eq('feature', 'test')
        .eq('agent', 'knowledge');
      await agent.retrieve('test query', { topK: 2 });
      const after = await sb
        .from('agent_traces')
        .select('id', { count: 'exact', head: true })
        .eq('feature', 'test')
        .eq('agent', 'knowledge');
      expect((after.count ?? 0) - (before.count ?? 0)).toBeGreaterThan(0);
    });
  });
}

// Run contract against the real implementation.
runContract('real', new KnowledgeAgentImpl({ feature: 'test' }));

// R2 mitigation: same contract must pass against a second (in-memory) implementation.
runContract('mock', new InMemoryKnowledgeAgent({ feature: 'test' }));
