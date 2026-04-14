import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type TaskType =
  | 'generate_notes'
  | 'generate_quiz'
  | 'ingest_ca'
  | 'evaluate_answer'
  | 'score_content'
  | 'generate_video'
  | 'generate_animation'
  | 'research_topic'
  | 'normalize_input'
  | 'syllabus_coverage'
  | 'freshness_check';

export interface HermesTask {
  type: TaskType;
  nodeId?: string;
  topic?: string;
  subject?: string;
  payload?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
}

export interface HermesResult {
  success: boolean;
  agentType: string;
  data?: any;
  error?: string;
  runId?: string;
}

/**
 * HermesOrchestrator — central dispatcher that routes tasks to the correct
 * specialist agent. Uses lazy (dynamic) imports to avoid circular dependencies
 * and keep initial bundle size small.
 *
 * Dead-letter: tracks failure counts per node; after 3 failures a node is
 * flagged in the admin console via `knowledge_nodes.metadata.dead_letter`.
 */
export class HermesOrchestrator {
  private supabase: SupabaseClient;
  /** In-memory failure counter: nodeId → count */
  private failureCounts = new Map<string, number>();
  private static DEAD_LETTER_THRESHOLD = 3;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    this.supabase = createClient(url, key);
  }

  /**
   * Dispatch a single task to the appropriate agent.
   * On failure, increments per-node failure counter; after 3 failures
   * the node is flagged as dead-letter in the admin console.
   */
  async dispatch(task: HermesTask): Promise<HermesResult> {
    try {
      const result = await this.withRetry(() => this.route(task));
      // Reset failure counter on success
      if (task.nodeId) this.failureCounts.delete(task.nodeId);
      return result;
    } catch (err: any) {
      // Dead-letter tracking
      if (task.nodeId) {
        const count = (this.failureCounts.get(task.nodeId) ?? 0) + 1;
        this.failureCounts.set(task.nodeId, count);

        if (count >= HermesOrchestrator.DEAD_LETTER_THRESHOLD) {
          await this.flagDeadLetter(task.nodeId, task.type, err?.message);
        }
      }

      return {
        success: false,
        agentType: task.type,
        error: err?.message ?? 'Unknown orchestrator error',
      };
    }
  }

  /**
   * Flag a node as dead-letter in knowledge_nodes metadata for admin visibility.
   */
  private async flagDeadLetter(nodeId: string, taskType: string, errorMsg?: string): Promise<void> {
    try {
      await this.supabase
        .from('knowledge_nodes')
        .update({
          metadata: {
            dead_letter: true,
            dead_letter_task: taskType,
            dead_letter_error: errorMsg ?? 'Unknown',
            dead_letter_at: new Date().toISOString(),
          },
        })
        .eq('id', nodeId);
    } catch {
      // Best-effort; don't let dead-letter flagging crash the orchestrator
    }
  }

  /**
   * Run an ordered pipeline of tasks sequentially. A failing task is recorded
   * but does not halt subsequent tasks.
   */
  async runPipeline(tasks: HermesTask[]): Promise<HermesResult[]> {
    const results: HermesResult[] = [];

    for (const task of tasks) {
      const result = await this.dispatch(task);
      results.push(result);
      // Skip failures — they are already captured in the result
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async route(task: HermesTask): Promise<HermesResult> {
    const params = {
      nodeId: task.nodeId,
      topic: task.topic ?? '',
      subject: task.subject,
      ...task.payload,
    };

    switch (task.type) {
      case 'generate_notes': {
        const { NotesAgent } = await import('./notes-agent');
        const agent = new NotesAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'notes', data };
      }

      case 'generate_quiz': {
        const { QuizAgent } = await import('./quiz-agent');
        const agent = new QuizAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'quiz', data };
      }

      case 'normalize_input': {
        const { normalizeUPSCInput } = await import('./normalizer-agent');
        const data = await normalizeUPSCInput(params.topic);
        return { success: true, agentType: 'normalizer', data };
      }

      case 'research_topic': {
        const { ResearchAgent } = await import('./research-agent');
        const agent = new ResearchAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'research', data };
      }

      case 'ingest_ca': {
        const { CAIngestionAgent } = await import('./ca-ingestion-agent');
        const agent = new CAIngestionAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'ca_ingestion', data };
      }

      case 'evaluate_answer': {
        const { EvaluatorAgent } = await import('./evaluator-agent');
        const agent = new EvaluatorAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'evaluator', data };
      }

      case 'score_content': {
        const { QualityAgent } = await import('./quality-agent');
        const agent = new QualityAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'quality_check', data };
      }

      case 'generate_video': {
        const { VideoAgent } = await import('./video-agent');
        const agent = new VideoAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'video', data };
      }

      case 'generate_animation': {
        const { AnimationAgent } = await import('./animation-agent');
        const agent = new AnimationAgent();
        const data = await agent.execute(params as any);
        return { success: true, agentType: 'animation', data };
      }

      case 'syllabus_coverage':
      case 'freshness_check':
        return {
          success: false,
          agentType: task.type,
          error: `Task type "${task.type}" is not yet implemented`,
        };

      default:
        return {
          success: false,
          agentType: task.type,
          error: `Unknown task type: ${task.type}`,
        };
    }
  }

  /**
   * Retry with exponential back-off: 1 s, 2 s, 4 s.
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

/** Singleton orchestrator instance. */
export const hermes = new HermesOrchestrator();
