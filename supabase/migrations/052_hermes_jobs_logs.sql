-- ============================================
-- Migration 052: Hermes Jobs & Logs Tables
-- Tracks all Hermes agent job execution and logs
-- ============================================

-- Hermes Jobs: tracks every background job dispatched by Hermes
CREATE TABLE IF NOT EXISTS public.hermes_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  payload JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Hermes Logs: structured log entries for each job
CREATE TABLE IF NOT EXISTS public.hermes_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.hermes_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_hermes_jobs_status ON public.hermes_jobs(status);
CREATE INDEX IF NOT EXISTS idx_hermes_jobs_job_type ON public.hermes_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_hermes_jobs_created_at ON public.hermes_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hermes_jobs_user_id ON public.hermes_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_hermes_logs_job_id ON public.hermes_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_hermes_logs_level ON public.hermes_logs(level);
CREATE INDEX IF NOT EXISTS idx_hermes_logs_service ON public.hermes_logs(service);
CREATE INDEX IF NOT EXISTS idx_hermes_logs_created_at ON public.hermes_logs(created_at DESC);

-- RLS
ALTER TABLE public.hermes_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hermes_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all jobs
CREATE POLICY "admin_read_hermes_jobs" ON public.hermes_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can read their own jobs
CREATE POLICY "user_read_own_hermes_jobs" ON public.hermes_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role can do everything (for workers)
CREATE POLICY "service_role_hermes_jobs" ON public.hermes_jobs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin can read all logs
CREATE POLICY "admin_read_hermes_logs" ON public.hermes_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can do everything with logs
CREATE POLICY "service_role_hermes_logs" ON public.hermes_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
