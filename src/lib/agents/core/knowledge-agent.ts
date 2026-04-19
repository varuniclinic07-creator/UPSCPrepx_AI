// src/lib/agents/core/knowledge-agent.ts
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { chat, embed, DEFAULT_CHAT_MODEL } from './openai-client';
import { newTraceId, recordTrace } from './traces';
import type {
  KnowledgeAgent, KnowledgeAgentVersion, SourceInput, IngestResult,
  RetrievedChunk, GroundedAnswer, Filter, Citation,
} from './types';

const VERSION: KnowledgeAgentVersion = 'v1';
const HARD_CAP_TOPK = 8;
const DEFAULT_TOPK = 6;
const CHUNK_SIZE = 800;  // characters per chunk, tuned later

function chunkText(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) out.push(text.slice(i, i + CHUNK_SIZE));
  return out;
}

export interface AgentInitOpts {
  feature?: string;
  traceId?: string;
}

export class KnowledgeAgentImpl implements KnowledgeAgent {
  readonly version = VERSION;
  private sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );
  private feature: string;
  private parentTraceId?: string;
  private userId?: string;
  constructor(opts: AgentInitOpts & { parentTraceId?: string; userId?: string } = {}) {
    this.feature = opts.feature ?? 'unknown';
    this.parentTraceId = opts.parentTraceId;
    this.userId = opts.userId;
  }

  async ingest(source: SourceInput): Promise<IngestResult> {
    const traceId = newTraceId();
    const started = Date.now();
    try {
      const sourceId = randomUUID();
      const chunks = chunkText(source.content);
      const { vectors, tokensIn, costUsd } = await embed(chunks);
      const rows = chunks.map((chunk, i) => ({
        source_id: sourceId,
        topic_id: source.meta.topicId ?? null,
        source_type: source.type,
        chunk_text: chunk,
        embedding: vectors[i] as any,
        meta: source.meta,
      }));
      const { error } = await this.sb.from('v8_knowledge_chunks').insert(rows);
      if (error) throw new Error(error.message);

      await recordTrace({
        traceId, agent: 'knowledge', method: 'ingest', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'success', input: { type: source.type, chars: source.content.length },
        output: { sourceId, chunkCount: chunks.length },
        latencyMs: Date.now() - started,
        tokensIn, costUsd, model: 'text-embedding-3-small', version: VERSION,
      });
      return { sourceId, chunkCount: chunks.length, tokensProcessed: tokensIn };
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'ingest', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async retrieve(query: string, opts: { topK?: number; filter?: Filter; rerank?: boolean } = {}): Promise<RetrievedChunk[]> {
    const traceId = newTraceId();
    const started = Date.now();
    const topK = Math.min(opts.topK ?? DEFAULT_TOPK, HARD_CAP_TOPK);
    try {
      const { vectors, tokensIn } = await embed([query]);
      const queryVec = vectors[0];
      const { data, error } = await this.sb.rpc('v8_match_chunks', {
        query_embedding: queryVec,
        match_count: topK,
        topic_filter: opts.filter?.topicId ?? null,
        source_type_filter: opts.filter?.sourceType ?? null,
      });
      if (error) throw new Error(error.message);
      const chunks: RetrievedChunk[] = (data ?? []).map((r: any) => ({
        id: r.id, text: r.chunk_text, score: r.similarity,
        meta: { ...(r.meta ?? {}), sourceId: r.source_id },
      }));
      await recordTrace({
        traceId, agent: 'knowledge', method: 'retrieve', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'success', input: { query, topK, filter: opts.filter ?? null },
        output: { count: chunks.length }, latencyMs: Date.now() - started,
        tokensIn, model: 'text-embedding-3-small', version: VERSION,
      });
      return chunks;
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'retrieve', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async ground(query: string, chunks: RetrievedChunk[], opts: { style?: 'concise'|'detailed'; cite?: boolean; maxTokens?: number } = {}): Promise<GroundedAnswer> {
    const traceId = newTraceId();
    const started = Date.now();
    const cite = opts.cite ?? true;
    const maxTokens = opts.maxTokens ?? 400;
    try {
      const system =
        'You are a UPSC-focused grounded answerer. Use ONLY the provided context chunks. ' +
        (cite ? 'At the end of each claim, inline-cite like [C1], [C2] referring to chunk indices. ' : '') +
        (opts.style === 'concise' ? 'Be brief: 2-3 sentences.' : 'Be thorough but factual.');
      const context = chunks.map((c, i) => `[C${i + 1}] ${c.text}`).join('\n\n');
      const prompt = `Question: ${query}\n\nContext:\n${context}\n\nAnswer:`;
      const res = await chat({ model: DEFAULT_CHAT_MODEL, system, prompt, maxTokens });

      const citations: Citation[] = cite
        ? chunks.map((c) => ({
            sourceId: c.meta.sourceId, chunkId: c.id,
            snippet: c.text.slice(0, 120), url: (c.meta as any).url,
          }))
        : [];

      await recordTrace({
        traceId, agent: 'knowledge', method: 'ground', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'success', input: { query, chunkCount: chunks.length, cite },
        output: { textLen: res.text.length, citationCount: citations.length },
        latencyMs: Date.now() - started,
        tokensIn: res.tokensIn, tokensOut: res.tokensOut, costUsd: res.costUsd,
        model: res.model, version: VERSION,
      });

      return { text: res.text, citations, tokensIn: res.tokensIn, tokensOut: res.tokensOut };
    } catch (err: any) {
      await recordTrace({
        traceId, agent: 'knowledge', method: 'ground', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
        status: 'failure', error: String(err?.message ?? err),
        latencyMs: Date.now() - started, version: VERSION,
      });
      throw err;
    }
  }

  async __testCleanup(sourceIds: string[]) {
    if (!sourceIds.length) return;
    await this.sb.from('v8_knowledge_chunks').delete().in('source_id', sourceIds);
  }
}

/**
 * In-memory swap implementation (R2 mitigation).
 * Implements same public API; uses substring matching instead of embeddings.
 * Runs the same contract test to prove the wrap is clean.
 */
export class InMemoryKnowledgeAgent implements KnowledgeAgent {
  readonly version: KnowledgeAgentVersion = 'v1';
  private store: Array<{ id: string; sourceId: string; topicId?: string; text: string }> = [];
  private feature: string;
  private parentTraceId?: string;
  constructor(opts: AgentInitOpts & { parentTraceId?: string } = {}) {
    this.feature = opts.feature ?? 'unknown';
    this.parentTraceId = opts.parentTraceId;
  }

  async ingest(source: SourceInput): Promise<IngestResult> {
    const sourceId = randomUUID();
    const chunks = chunkText(source.content);
    for (const c of chunks) {
      this.store.push({ id: randomUUID(), sourceId, topicId: source.meta.topicId, text: c });
    }
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'ingest', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
      status: 'success', version: 'v1',
    });
    return { sourceId, chunkCount: chunks.length, tokensProcessed: 0 };
  }

  async retrieve(query: string, opts: { topK?: number; filter?: Filter } = {}): Promise<RetrievedChunk[]> {
    const topK = Math.min(opts.topK ?? DEFAULT_TOPK, HARD_CAP_TOPK);
    // Token-overlap scoring: words >=4 chars from query matched against chunk text.
    const terms = query.toLowerCase().match(/[a-z0-9]+/g)?.filter((t) => t.length >= 4) ?? [];
    const matches = this.store
      .filter((r) => (opts.filter?.topicId ? r.topicId === opts.filter.topicId : true))
      .map((r) => {
        const lower = r.text.toLowerCase();
        const score = terms.reduce((acc, t) => (lower.includes(t) ? acc + 1 : acc), 0);
        return { r, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((m) => ({
        id: m.r.id, text: m.r.text, score: m.score,
        meta: { sourceId: m.r.sourceId, topicId: m.r.topicId },
      }));
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'retrieve', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
      status: 'success', version: 'v1',
    });
    return matches;
  }

  async ground(query: string, chunks: RetrievedChunk[], opts: { cite?: boolean } = {}): Promise<GroundedAnswer> {
    const cite = opts.cite ?? true;
    await recordTrace({
      traceId: newTraceId(), agent: 'knowledge', method: 'ground', feature: this.feature, parentTraceId: this.parentTraceId, userId: this.userId,
      status: 'success', version: 'v1',
    });
    const text = `Based on ${chunks.length} chunks: ${chunks[0]?.text.slice(0, 120) ?? 'no data'}`;
    // Approximate token accounting for the in-memory impl so contract
    // assertions on tokensIn/tokensOut hold without hitting OpenAI.
    const tokensIn = Math.max(1, Math.ceil(query.length / 4) + chunks.reduce((a, c) => a + Math.ceil(c.text.length / 4), 0));
    const tokensOut = Math.max(1, Math.ceil(text.length / 4));
    return {
      text,
      citations: cite ? chunks.map((c) => ({
        sourceId: c.meta.sourceId, chunkId: c.id, snippet: c.text.slice(0, 80),
      })) : [],
      tokensIn, tokensOut,
    };
  }

  async __testCleanup() { this.store = []; }
}
