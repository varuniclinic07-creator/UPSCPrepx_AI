/**
 * Hermes Logger — tracks job execution and structured logs
 * Uses service_role client to bypass RLS for worker writes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    _client = createClient(url, key);
  }
  return _client;
}

export async function createHermesJob(
  jobType: string,
  payload: Record<string, unknown> = {},
  userId?: string,
): Promise<string> {
  const { data, error } = await getClient()
    .from('hermes_jobs')
    .insert({
      job_type: jobType,
      status: 'queued',
      payload,
      user_id: userId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Hermes] Failed to create job:', error.message);
    throw error;
  }

  return data.id;
}

export async function updateHermesJob(
  jobId: string,
  status: JobStatus,
  result?: Record<string, unknown>,
  error?: string,
): Promise<void> {
  const update: Record<string, unknown> = { status };

  if (status === 'running') {
    update.started_at = new Date().toISOString();
  }
  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    update.completed_at = new Date().toISOString();
  }
  if (result) update.result = result;
  if (error) update.error = error;

  const { error: dbError } = await getClient()
    .from('hermes_jobs')
    .update(update)
    .eq('id', jobId);

  if (dbError) {
    console.error('[Hermes] Failed to update job:', dbError.message);
  }
}

export async function incrementJobAttempt(jobId: string): Promise<void> {
  // Use RPC or raw increment
  const { data } = await getClient()
    .from('hermes_jobs')
    .select('attempts')
    .eq('id', jobId)
    .single();

  if (data) {
    await getClient()
      .from('hermes_jobs')
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq('id', jobId);
  }
}

export async function logHermes(
  jobId: string | null,
  level: LogLevel,
  service: string,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await getClient()
    .from('hermes_logs')
    .insert({
      job_id: jobId,
      level,
      service,
      message,
      metadata: metadata || {},
    });

  if (error) {
    // Don't throw on log failures — just console
    console.error('[Hermes] Log write failed:', error.message);
  }
}

/**
 * Convenience: wrap a job lifecycle (create → run → complete/fail)
 */
export async function runHermesJob<T>(
  jobType: string,
  payload: Record<string, unknown>,
  executor: (jobId: string) => Promise<T>,
  userId?: string,
): Promise<T> {
  const jobId = await createHermesJob(jobType, payload, userId);

  try {
    await updateHermesJob(jobId, 'running');
    await incrementJobAttempt(jobId);
    await logHermes(jobId, 'info', jobType, `Job started: ${jobType}`);

    const result = await executor(jobId);

    await updateHermesJob(jobId, 'completed', { output: result });
    await logHermes(jobId, 'info', jobType, `Job completed: ${jobType}`);

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await updateHermesJob(jobId, 'failed', undefined, message);
    await logHermes(jobId, 'error', jobType, `Job failed: ${message}`);
    throw err;
  }
}
