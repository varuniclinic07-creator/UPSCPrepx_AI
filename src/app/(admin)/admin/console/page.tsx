'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const supabase = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Status = 'up' | 'down' | 'unknown';
interface AgentRun { id: string; agent_type: string; status: string; nodes_processed: number; content_generated: number; errors: any[]; started_at: string; completed_at: string | null; }
interface SourceStat { source: string; last_scrape: string; today_count: number; untagged_count: number; }

const badge = (s: string) => ({ running: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', partial: 'bg-orange-100 text-orange-700', up: 'bg-green-100 text-green-700', down: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-500');

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (<div><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className={`text-lg font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p></div>);
}

export default function AdminConsolePage() {
  const [health, setHealth] = useState({ noNotes: 0, stale: 0, pending: 0, rejected: 0 });
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, generated: 0 });
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [sys, setSys] = useState<{ providers: Record<string, Status>; minio: string; queue: number; remotion: string; manim: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const sb = supabase();
    try {
      // Content Health counts
      const [noNotes, stale, pending, rejected] = await Promise.all([
        (sb.from('knowledge_nodes') as any).select('id', { count: 'exact', head: true }).eq('type', 'subtopic').is('metadata->>has_notes', null),
        (sb.from('knowledge_nodes') as any).select('id', { count: 'exact', head: true }).lt('freshness_score', 0.4),
        (sb.from('content_queue') as any).select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        (sb.from('content_queue') as any).select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      ]);
      setHealth({ noNotes: noNotes.count ?? 0, stale: stale.count ?? 0, pending: pending.count ?? 0, rejected: rejected.count ?? 0 });

      // Agent runs
      const { data: agentRuns } = await (sb.from('agent_runs') as any)
        .select('id,agent_type,status,nodes_processed,content_generated,errors,started_at,completed_at')
        .order('started_at', { ascending: false }).limit(50);
      setRuns(agentRuns || []);
      const h24 = new Date(Date.now() - 86400000).toISOString();
      const recent = (agentRuns || []).filter((r: AgentRun) => r.started_at >= h24);
      setStats({ total: recent.length, completed: recent.filter((r: AgentRun) => r.status === 'completed').length, failed: recent.filter((r: AgentRun) => r.status === 'failed').length, generated: recent.reduce((s: number, r: AgentRun) => s + (r.content_generated || 0), 0) });

      // Source Intelligence
      const { data: caData } = await (sb.from('current_affairs') as any).select('source,created_at,node_id');
      const sMap: Record<string, { last: string; today: number; untagged: number }> = {};
      const today = new Date().toISOString().slice(0, 10);
      for (const row of caData || []) {
        const src = row.source || 'unknown';
        if (!sMap[src]) sMap[src] = { last: '', today: 0, untagged: 0 };
        if (row.created_at > sMap[src].last) sMap[src].last = row.created_at;
        if (row.created_at?.slice(0, 10) === today) sMap[src].today++;
        if (!row.node_id) sMap[src].untagged++;
      }
      setSources(Object.entries(sMap).map(([source, v]) => ({ source, last_scrape: v.last, today_count: v.today, untagged_count: v.untagged })));

      // System Health
      setSys({ providers: { ollama: 'unknown', groq: 'unknown', nvidia: 'unknown', gemini: 'unknown' }, minio: process.env.NEXT_PUBLIC_MINIO_URL || 'Not configured', queue: pending.count ?? 0, remotion: process.env.NEXT_PUBLIC_REMOTION_URL || 'Not configured', manim: process.env.NEXT_PUBLIC_MANIM_URL || 'Not configured' });
      const check = async (url: string): Promise<Status> => { try { return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok ? 'up' : 'down'; } catch { return 'down'; } };
      const results = await Promise.allSettled([check('/api/health/ollama'), check('/api/health/groq'), check('/api/health/nvidia'), check('/api/health/gemini')]);
      const names = ['ollama', 'groq', 'nvidia', 'gemini'];
      setSys(prev => prev ? { ...prev, providers: Object.fromEntries(names.map((n, i) => [n, results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<Status>).value : 'down'])) } : prev);
    } catch (err) { console.error('Console fetch error:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i); }, [fetchAll]);

  const handleRetry = async (run: AgentRun) => {
    setRetrying(run.id);
    try { await fetch('/api/agentic/orchestrator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_type: run.agent_type, retry_run_id: run.id }) }); await fetchAll(); } catch (err) { console.error('Retry failed:', err); }
    setRetrying(null);
  };

  const fmt = (iso: string) => iso ? new Date(iso).toLocaleString() : '--';
  const dur = (s: string, e: string | null) => { if (!e) return 'Running...'; const sec = Math.round((new Date(e).getTime() - new Date(s).getTime()) / 1000); return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`; };

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><p className="text-gray-500">Loading console data...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link><span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Console</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
        <button onClick={fetchAll} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1 - Content Health */}
        <Card title="Content Health">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Subtopics without notes" value={health.noNotes} color="text-orange-600" />
            <Stat label="Stale nodes (< 0.4)" value={health.stale} color="text-red-600" />
            <Stat label="Pending review queue" value={health.pending} color="text-blue-600" />
            <Stat label="Rejected content" value={health.rejected} color="text-red-500" />
          </div>
        </Card>

        {/* Panel 2 - Agent Monitor */}
        <Card title="Agent Monitor">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <Stat label="24h runs" value={stats.total} color="text-blue-600" />
            <Stat label="Completed" value={stats.completed} color="text-green-600" />
            <Stat label="Failed" value={stats.failed} color="text-red-600" />
            <Stat label="Generated" value={stats.generated} color="text-purple-600" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-gray-500 dark:text-gray-400">
                <tr><th className="text-left py-1">Agent</th><th className="text-left py-1">Status</th><th className="text-left py-1">Duration</th><th className="text-left py-1">Err</th><th className="py-1"></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {runs.slice(0, 15).map(r => (
                  <tr key={r.id}>
                    <td className="py-1 capitalize">{r.agent_type}</td>
                    <td className="py-1"><span className={`px-1.5 py-0.5 rounded text-xs ${badge(r.status)}`}>{r.status}</span></td>
                    <td className="py-1 text-gray-500">{dur(r.started_at, r.completed_at)}</td>
                    <td className="py-1 text-red-500">{r.errors?.length || 0}</td>
                    <td className="py-1">{r.status === 'failed' && <button onClick={() => handleRetry(r)} disabled={retrying === r.id} className="text-blue-600 hover:underline disabled:opacity-50">{retrying === r.id ? '...' : 'Retry'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/admin/hermes" className="block mt-2 text-xs text-blue-600 hover:underline">View full agent monitor</Link>
        </Card>

        {/* Panel 3 - Source Intelligence */}
        <Card title="Source Intelligence">
          {sources.length === 0 ? <p className="text-sm text-gray-400">No CA sources found</p> : (
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-500 dark:text-gray-400">
                  <tr><th className="text-left py-1">Source</th><th className="text-left py-1">Last Scrape</th><th className="text-left py-1">Today</th><th className="text-left py-1">Untagged</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sources.map(s => (
                    <tr key={s.source}>
                      <td className="py-1 font-medium">{s.source}</td>
                      <td className="py-1 text-gray-500">{fmt(s.last_scrape)}</td>
                      <td className="py-1">{s.today_count}</td>
                      <td className="py-1 text-orange-500">{s.untagged_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link href="/admin/source-intelligence" className="block mt-2 text-xs text-blue-600 hover:underline">View detailed source intelligence</Link>
        </Card>

        {/* Panel 4 - System Health */}
        <Card title="System Health">
          {sys && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">AI Providers</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sys.providers).map(([p, s]) => (
                    <span key={p} className={`px-2 py-0.5 rounded text-xs capitalize ${badge(s)}`}>{p}: {s}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">MinIO Storage</p><p className="text-xs font-mono truncate text-gray-700 dark:text-gray-300">{sys.minio}</p></div>
                <Stat label="Queue Depth" value={sys.queue} color="text-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-500">Remotion Service</p><p className="text-xs font-mono truncate text-gray-700 dark:text-gray-300">{sys.remotion}</p></div>
                <div><p className="text-xs text-gray-500">Manim Service</p><p className="text-xs font-mono truncate text-gray-700 dark:text-gray-300">{sys.manim}</p></div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
