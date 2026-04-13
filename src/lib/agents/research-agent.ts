import { BaseAgent } from './base-agent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResearchSource {
  type: 'web' | 'doc' | 'file' | 'scrape';
  title: string;
  content: string;
  url?: string;
  page?: number;
  relevanceScore: number;
}

export interface ResearchResult {
  sources: ResearchSource[];
  aggregatedContent: string;
  sourceCount: number;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

/**
 * ResearchAgent gathers information from three independent layers — web search,
 * document RAG, and file search — then aggregates the results into a single
 * ResearchResult. Each layer is fault-tolerant; failures in one layer do not
 * affect the others.
 */
export class ResearchAgent extends BaseAgent {
  constructor() {
    super('research');
  }

  async execute(params: {
    nodeId?: string;
    topic: string;
    subject?: string;
  }): Promise<ResearchResult> {
    const { nodeId, topic, subject } = params;
    const runId = await this.startRun({
      nodeId,
      topic,
      subject,
    });

    try {
      // Run all three layers in parallel; each may independently fail.
      const [webResult, docResult, fileResult] = await Promise.allSettled([
        this.searchWeb(topic),
        this.searchDocs(topic),
        this.searchFiles(topic),
      ]);

      const sources: ResearchSource[] = [];

      if (webResult.status === 'fulfilled') {
        sources.push(...webResult.value);
      } else {
        this.log(`Web search layer failed: ${webResult.reason?.message ?? webResult.reason}`);
      }

      if (docResult.status === 'fulfilled') {
        sources.push(...docResult.value);
      } else {
        this.log(`Doc RAG layer failed: ${docResult.reason?.message ?? docResult.reason}`);
      }

      if (fileResult.status === 'fulfilled') {
        sources.push(...fileResult.value);
      } else {
        this.log(`File search layer failed: ${fileResult.reason?.message ?? fileResult.reason}`);
      }

      // Sort by relevance descending
      sources.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const aggregatedContent = sources
        .map((s) => `[${s.type.toUpperCase()}] ${s.title}\n${s.content}`)
        .join('\n\n---\n\n');

      const result: ResearchResult = {
        sources,
        aggregatedContent,
        sourceCount: sources.length,
      };

      await this.completeRun(runId, { sourceCount: result.sourceCount });
      return result;
    } catch (err: any) {
      await this.completeRun(runId, { error: err?.message });
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Layer 1 — Web Search
  // ---------------------------------------------------------------------------

  private async searchWeb(topic: string): Promise<ResearchSource[]> {
    const url = process.env.AGENTIC_WEB_SEARCH_URL;
    if (!url) {
      this.log('AGENTIC_WEB_SEARCH_URL not configured — skipping web search layer');
      return [];
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic }),
      });

      if (!response.ok) {
        throw new Error(`Web search responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = Array.isArray(data) ? data : data.results ?? [];

      return results.map((r: any, i: number) => ({
        type: 'web' as const,
        title: r.title ?? `Web result ${i + 1}`,
        content: r.content ?? r.snippet ?? '',
        url: r.url ?? undefined,
        relevanceScore: r.relevanceScore ?? r.score ?? 0.5,
      }));
    } catch (err: any) {
      this.log(`Web search error: ${err.message}`);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Layer 2 — Document RAG
  // ---------------------------------------------------------------------------

  private async searchDocs(topic: string): Promise<ResearchSource[]> {
    const url = process.env.AGENTIC_DOC_CHAT_URL;
    if (!url) {
      this.log('AGENTIC_DOC_CHAT_URL not configured — skipping doc RAG layer');
      return [];
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic }),
      });

      if (!response.ok) {
        throw new Error(`Doc RAG responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = Array.isArray(data) ? data : data.results ?? [];

      return results.map((r: any, i: number) => ({
        type: 'doc' as const,
        title: r.title ?? `Document ${i + 1}`,
        content: r.content ?? r.answer ?? '',
        url: r.url ?? undefined,
        page: r.page ?? undefined,
        relevanceScore: r.relevanceScore ?? r.score ?? 0.6,
      }));
    } catch (err: any) {
      this.log(`Doc RAG error: ${err.message}`);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Layer 3 — File Search
  // ---------------------------------------------------------------------------

  private async searchFiles(topic: string): Promise<ResearchSource[]> {
    const url = process.env.AGENTIC_FILE_SEARCH_URL;
    if (!url) {
      this.log('AGENTIC_FILE_SEARCH_URL not configured — skipping file search layer');
      return [];
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic }),
      });

      if (!response.ok) {
        throw new Error(`File search responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: any[] = Array.isArray(data) ? data : data.results ?? [];

      return results.map((r: any, i: number) => ({
        type: 'file' as const,
        title: r.title ?? r.filename ?? `File ${i + 1}`,
        content: r.content ?? r.excerpt ?? '',
        url: r.url ?? undefined,
        page: r.page ?? undefined,
        relevanceScore: r.relevanceScore ?? r.score ?? 0.4,
      }));
    } catch (err: any) {
      this.log(`File search error: ${err.message}`);
      throw err;
    }
  }
}

/** Singleton research agent instance. */
export const researchAgent = new ResearchAgent();
