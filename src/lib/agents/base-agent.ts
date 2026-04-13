/**
 * Base Agent — shared foundation for all Hermes subagents
 * Provides: agent_runs logging, Supabase service-role client, structured logging
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AgentType =
  | 'research' | 'notes' | 'quiz' | 'ca_ingestion'
  | 'normalizer' | 'evaluator' | 'quality_check' | 'video' | 'animation';

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
