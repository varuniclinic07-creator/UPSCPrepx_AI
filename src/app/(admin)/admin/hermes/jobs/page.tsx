'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface HermesJob {
  id: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface Stats {
  total_24h: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  avg_duration_sec: number;
}

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  running: <Play className="w-4 h-4 text-blue-500 animate-pulse" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  queued: <Clock className="w-4 h-4 text-yellow-500" />,
  cancelled: <XCircle className="w-4 h-4 text-gray-400" />,
};

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const sec = Math.round((end - start) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function HermesJobsPage() {
  const [jobs, setJobs] = useState<HermesJob[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/hermes/jobs?${params}`);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data.jobs);
        setStats(json.data.stats);
        setTotalPages(json.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/hermes" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Hermes Jobs</h1>
        <button onClick={fetchJobs} className="ml-auto p-2 rounded-lg hover:bg-muted" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold">{stats.total_24h}</div>
            <div className="text-xs text-muted-foreground">24h Total</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.queued}</div>
            <div className="text-xs text-muted-foreground">Queued</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Jobs table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Job ID</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-left p-3 font-medium">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">
                {loading ? 'Loading...' : 'No jobs found'}
              </td></tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{job.id.slice(0, 8)}</td>
                <td className="p-3">{job.job_type}</td>
                <td className="p-3">
                  <span className="flex items-center gap-2">
                    {statusIcon[job.status] || <Clock className="w-4 h-4" />}
                    {job.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="p-3">{formatDuration(job.started_at, job.completed_at)}</td>
                <td className="p-3">{job.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-40"
          ><ChevronLeft className="w-4 h-4" /></button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-40"
          ><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
