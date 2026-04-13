'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AgentRun {
  id: string;
  agent_type: string;
  status: string;
  nodes_processed: number;
  content_generated: number;
  errors: any[];
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
}

interface Stats {
  total_24h: number;
  running: number;
  completed: number;
  failed: number;
  partial: number;
  nodes_processed_24h: number;
  content_generated_24h: number;
  avg_duration_sec: number;
}

const AGENT_TYPES = ['research', 'notes', 'quiz', 'ca_ingestion', 'normalizer', 'evaluator', 'quality_check', 'video', 'animation'];
const STATUS_OPTIONS = ['running', 'completed', 'failed', 'partial'];

export default function HermesPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      if (agentFilter) params.set('agent_type', agentFilter);
      const res = await fetch(`/api/admin/agent-runs?${params}`);
      const json = await res.json();
      if (json.success) {
        setRuns(json.data.runs);
        setStats(json.data.stats);
        setBreakdown(json.data.agentBreakdown);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [statusFilter, agentFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'running': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'partial': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Running...';
    const sec = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Hermes Pipeline</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hermes Agent Monitor</h1>
        <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Runs (24h)', value: stats.total_24h, color: 'text-blue-600' },
            { label: 'Running', value: stats.running, color: 'text-blue-500' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600' },
            { label: 'Nodes Processed', value: stats.nodes_processed_24h, color: 'text-purple-600' },
            { label: 'Content Generated', value: stats.content_generated_24h, color: 'text-indigo-600' },
            { label: 'Avg Duration', value: `${stats.avg_duration_sec}s`, color: 'text-gray-600' },
            { label: 'Success Rate', value: stats.total_24h > 0 ? `${Math.round((stats.completed / stats.total_24h) * 100)}%` : 'N/A', color: 'text-green-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Agent Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Agent Activity (24h)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([agent, count]) => (
              <span key={agent} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                {agent}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={agentFilter} onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All agents</option>
          {AGENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No agent runs found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Nodes</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Errors</th>
                <th className="px-4 py-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {runs.map((run) => (
                <tr key={run.id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3 font-medium capitalize">{run.agent_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{run.nodes_processed}</td>
                  <td className="px-4 py-3 font-mono">{run.content_generated}</td>
                  <td className="px-4 py-3 text-xs">{formatDuration(run.started_at, run.completed_at)}</td>
                  <td className="px-4 py-3">
                    {run.errors && run.errors.length > 0 ? (
                      <span className="text-red-600 text-xs" title={JSON.stringify(run.errors)}>
                        {run.errors.length} error{run.errors.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(run.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
