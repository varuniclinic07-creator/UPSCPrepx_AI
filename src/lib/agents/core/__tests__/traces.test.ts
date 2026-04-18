/**
 * Real-Supabase test. Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Tests write to agent_traces with feature='test' and clean up after.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load real Supabase creds from .env.coolify BEFORE requiring the module under test.
const envPath = resolve(__dirname, '../../../../../.env.coolify');
try {
  const envFile = readFileSync(envPath, 'utf8');
  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, '');
    const m = line.match(/^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
} catch {
  /* swallow — test will emit clear failure if creds missing */
}

// Require (not import) so it evaluates AFTER env fixup runs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { recordTrace, newTraceId } = require('../traces');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

describe('recordTrace', () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length) {
      await sb.from('agent_traces').delete().in('id', createdIds);
    }
  });

  it('writes a row and returns its id', async () => {
    const traceId = newTraceId();
    const id = await recordTrace({
      traceId,
      agent: 'knowledge',
      method: 'retrieve',
      feature: 'test',
      status: 'success',
      input: { q: 'x' },
      output: { chunks: [] },
      latencyMs: 5,
      tokensIn: 1,
      tokensOut: 0,
      version: 'v1',
    });
    expect(id).toBeTruthy();
    createdIds.push(id);

    const { data, error } = await sb
      .from('agent_traces')
      .select('*')
      .eq('id', id)
      .single();
    expect(error).toBeNull();
    expect(data?.agent).toBe('knowledge');
    expect(data?.method).toBe('retrieve');
    expect(data?.feature).toBe('test');
    expect(data?.status).toBe('success');
  });

  it('chains parent→child traces via parent_trace_id', async () => {
    const parentTrace = newTraceId();
    const parentId = await recordTrace({
      traceId: parentTrace,
      agent: 'orchestrator',
      method: 'answer',
      feature: 'test',
      status: 'success',
      version: 'v1',
    });
    createdIds.push(parentId);

    const childTrace = newTraceId();
    const childId = await recordTrace({
      traceId: childTrace,
      parentTraceId: parentId,
      agent: 'knowledge',
      method: 'retrieve',
      feature: 'test',
      status: 'success',
      version: 'v1',
    });
    createdIds.push(childId);

    const { data } = await sb.from('agent_traces').select('*').eq('id', childId).single();
    expect(data?.parent_trace_id).toBe(parentId);
  });

  it('never throws — failures log but do not crash caller', async () => {
    // Force failure by passing an invalid agent name.
    await expect(
      recordTrace({
        traceId: newTraceId(),
        // @ts-expect-error invalid agent
        agent: 'not_a_real_agent',
        method: 'x',
        feature: 'test',
        status: 'success',
        version: 'v1',
      }),
    ).resolves.toBeDefined(); // returns empty string, does not throw
  });
});
