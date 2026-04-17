'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface HermesLog {
  id: string;
  job_id: string | null;
  level: string;
  service: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const levelColor: Record<string, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
};

export default function HermesLogsPage() {
  const [logs, setLogs] = useState<HermesLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [levelFilter, setLevelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (levelFilter) params.set('level', levelFilter);
    if (searchQuery) params.set('q', searchQuery);

    try {
      const res = await fetch(`/api/admin/hermes/logs?${params}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setTotalPages(json.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
    setLoading(false);
  }, [page, levelFilter, searchQuery]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/hermes" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">Hermes Logs</h1>
        <button onClick={fetchLogs} className="ml-auto p-2 rounded-lg hover:bg-muted" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter logs by message..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        >
          <option value="">All Levels</option>
          <option value="debug">DEBUG</option>
          <option value="info">INFO</option>
          <option value="warn">WARN</option>
          <option value="error">ERROR</option>
        </select>
      </form>

      {/* Log entries */}
      <div className="rounded-xl border bg-card font-mono text-xs space-y-0 overflow-hidden">
        {logs.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            {loading ? 'Loading...' : 'No logs found'}
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 p-3 border-b last:border-b-0 hover:bg-muted/30">
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(log.created_at).toLocaleString()}
            </span>
            <span className={`font-bold w-12 uppercase ${levelColor[log.level] || 'text-gray-500'}`}>
              {log.level}
            </span>
            <span className="text-primary/70">[{log.service}]</span>
            <span className="flex-1">{log.message}</span>
          </div>
        ))}
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
