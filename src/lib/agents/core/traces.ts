// src/lib/agents/core/traces.ts
// Async-safe trace writer for the three v8 agents. Never throws.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

type AgentName = 'knowledge' | 'evaluation' | 'orchestrator';
type TraceStatus = 'success' | 'failure' | 'degraded';

export interface TraceInput {
  traceId: string;
  parentTraceId?: string;
  agent: AgentName;
  method: string;
  feature?: string;
  status: TraceStatus;
  userId?: string;
  input?: unknown;
  output?: unknown;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  model?: string;
  error?: string;
  version: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export function newTraceId(): string {
  return randomUUID();
}

/**
 * Writes a trace row. Returns the inserted row id, or empty string on failure.
 * NEVER THROWS — instrumentation must not crash callers.
 */
export async function recordTrace(t: TraceInput): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('agent_traces')
      .insert({
        trace_id: t.traceId,
        parent_trace_id: t.parentTraceId ?? null,
        agent: t.agent,
        method: t.method,
        feature: t.feature ?? null,
        status: t.status,
        user_id: t.userId ?? null,
        input: t.input ?? null,
        output: t.output ?? null,
        latency_ms: t.latencyMs ?? null,
        tokens_in: t.tokensIn ?? null,
        tokens_out: t.tokensOut ?? null,
        cost_usd: t.costUsd ?? null,
        model: t.model ?? null,
        error: t.error ?? null,
        version: t.version,
      })
      .select('id')
      .single();
    if (error) {
      // Log but do not throw.
      // eslint-disable-next-line no-console
      console.warn('[agent_traces] write failed:', error.message);
      return '';
    }
    return data?.id ?? '';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[agent_traces] unexpected:', e);
    return '';
  }
}

/**
 * Convenience wrapper: runs an agent method, records the trace, returns the
 * method's result. Use inside every agent method.
 */
export async function tracedCall<T>(
  t: Omit<TraceInput, 'status' | 'output' | 'latencyMs' | 'error'>,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    await recordTrace({
      ...t,
      status: 'success',
      output: result,
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (err: any) {
    await recordTrace({
      ...t,
      status: 'failure',
      error: String(err?.message ?? err),
      latencyMs: Date.now() - started,
    });
    throw err;
  }
}
