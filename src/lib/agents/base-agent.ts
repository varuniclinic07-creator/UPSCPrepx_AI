/**
 * Base Agent — shared foundation for all Hermes subagents
 * Provides: agent_runs logging, retry with exponential backoff,
 * per-agent provider preferences, Supabase service-role client, structured logging
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AgentType =
  | 'research' | 'notes' | 'quiz' | 'ca_ingestion'
  | 'normalizer' | 'evaluator' | 'quality_check' | 'video' | 'animation';

/** Per-agent provider preference overrides (spec Section 3) */
export type ProviderName = 'ollama' | 'groq' | 'nvidia' | 'gemini';

const AGENT_PROVIDER_PREFERENCES: Record<AgentType, ProviderName[]> = {
  normalizer:    ['ollama', 'groq'],
  research:      ['ollama', 'nvidia'],
  notes:         ['ollama', 'nvidia', 'gemini'],
  quiz:          ['groq', 'ollama'],
  ca_ingestion:  ['groq', 'ollama'],
  evaluator:     ['nvidia', 'gemini'],
  quality_check: ['groq'],
  video:         ['ollama'],
  animation:     ['ollama'],
};

export interface AgentRunRecord {
  id: string;
  agent_type: AgentType;
  status: 'running' | 'completed' | 'failed' | 'partial';
  nodes_processed: number;
  content_generated: number;
  errors: any[];
  started_at: string;
  completed_at?: string;
  metadata: Record<string, any>;
}

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected supabase: SupabaseClient;
  private runId: string | null = null;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /** Get the preferred provider order for this agent (spec Section 3). */
  protected getProviderPreferences(): ProviderName[] {
    return AGENT_PROVIDER_PREFERENCES[this.agentType] ?? ['ollama', 'groq', 'nvidia', 'gemini'];
  }

  /**
   * Retry an async operation with exponential backoff: 1s, 2s, 4s.
   * Spec requirement: "3 retries with exponential backoff (1s, 2s, 4s)"
   */
  protected async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        this.log('warn', `Attempt ${attempt + 1}/${retries} failed: ${(err as Error)?.message ?? err}`);
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /** Start an agent run — call at beginning of execute() */
  protected async startRun(metadata: Record<string, any> = {}): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('agent_runs')
        .insert({
          agent_type: this.agentType,
          status: 'running',
          metadata,
        })
        .select('id')
        .single();

      if (error || !data) {
        this.log('warn', 'Failed to start run in DB, continuing without tracking', error);
        return 'untracked';
      }

      this.runId = data.id;
      return data.id;
    } catch (err) {
      this.log('warn', 'agent_runs insert failed, continuing without tracking', err);
      return 'untracked';
    }
  }

  /** Complete an agent run — call at end of execute() */
  protected async completeRun(
    status: 'completed' | 'failed' | 'partial',
    stats: { nodes_processed?: number; content_generated?: number; errors?: any[] } = {}
  ): Promise<void> {
    if (!this.runId || this.runId === 'untracked') return;

    try {
      await this.supabase
        .from('agent_runs')
        .update({
          status,
          nodes_processed: stats.nodes_processed ?? 0,
          content_generated: stats.content_generated ?? 0,
          errors: stats.errors ?? [],
          completed_at: new Date().toISOString(),
        })
        .eq('id', this.runId);
    } catch (err) {
      this.log('warn', 'Failed to complete run in DB', err);
    }
  }

  /** Structured logging */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[${this.agentType}]`;
    if (level === 'error') console.error(prefix, message, data);
    else if (level === 'warn') console.warn(prefix, message, data);
    else console.log(prefix, message, data ?? '');
  }
}
