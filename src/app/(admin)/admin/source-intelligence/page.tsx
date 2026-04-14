'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface SourceRow {
  source: string;
  last_scrape: string;
  total_count: number;
  untagged_count: number;
  /** Health: green = scraped within 24h, yellow = 24-72h ago, red = >72h or never */
  health: 'green' | 'yellow' | 'red';
}

interface AgentRunInfo {
  last_success_at: string | null;
  last_failure_at: string | null;
  total_runs: number;
  success_count: number;
  failure_count: number;
}

interface DayCount {
  date: string;
  count: number;
}

interface UntaggedArticle {
  id: string;
  title: string;
  source: string;
  created_at: string;
  subject: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function healthColor(h: 'green' | 'yellow' | 'red'): string {
  return { green: 'bg-green-500', yellow: 'bg-yellow-400', red: 'bg-red-500' }[h];
}

function computeHealth(lastScrape: string | null): 'green' | 'yellow' | 'red' {
  if (!lastScrape) return 'red';
  const hoursAgo = (Date.now() - new Date(lastScrape).getTime()) / 3600000;
  if (hoursAgo <= 24) return 'green';
  if (hoursAgo <= 72) return 'yellow';
  return 'red';
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SourceIntelligencePage() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [agentInfo, setAgentInfo] = useState<AgentRunInfo | null>(null);
  const [dailyCounts, setDailyCounts] = useState<DayCount[]>([]);
  const [untagged, setUntagged] = useState<UntaggedArticle[]>([]);
  const [totalUntagged, setTotalUntagged] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = getSupabase();
    try {
      // Fetch all CA articles and agent runs in parallel
      const [caResult, agentResult] = await Promise.all([
        (supabase.from('current_affairs') as any)
          .select('id, title, source, created_at, node_id, subject')
          .order('created_at', { ascending: false }),
        (supabase.from('agent_runs') as any)
          .select('id, agent_type, status, created_at')
          .eq('agent_type', 'ca_ingestion')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      const rows = caResult.data || [];
      const agentRuns = agentResult.data || [];

      // ── Build agent run summary ──
      let lastSuccess: string | null = null;
      let lastFailure: string | null = null;
      let successCount = 0;
      let failureCount = 0;
      for (const run of agentRuns) {
        if (run.status === 'completed') {
          successCount++;
          if (!lastSuccess || run.created_at > lastSuccess) lastSuccess = run.created_at;
        } else if (run.status === 'failed') {
          failureCount++;
          if (!lastFailure || run.created_at > lastFailure) lastFailure = run.created_at;
        }
      }
      setAgentInfo({
        last_success_at: lastSuccess,
        last_failure_at: lastFailure,
        total_runs: agentRuns.length,
        success_count: successCount,
        failure_count: failureCount,
      });

      // ── Build source summary ──
      const sourceMap: Record<string, { last: string; total: number; untagged: number }> = {};
      let globalUntagged = 0;
      for (const row of rows) {
        const src = row.source || 'unknown';
        if (!sourceMap[src]) sourceMap[src] = { last: '', total: 0, untagged: 0 };
        sourceMap[src].total++;
        if (row.created_at > sourceMap[src].last) sourceMap[src].last = row.created_at;
        if (!row.node_id) {
          sourceMap[src].untagged++;
          globalUntagged++;
        }
      }
      setTotalUntagged(globalUntagged);

      setSources(
        Object.entries(sourceMap)
          .map(([source, v]) => ({
            source,
            last_scrape: v.last,
            total_count: v.total,
            untagged_count: v.untagged,
            health: computeHealth(v.last || null),
          }))
          .sort((a, b) => b.total_count - a.total_count)
      );

      // ── Build daily counts for last 7 days ──
      const days: DayCount[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const count = rows.filter((r: any) => r.created_at?.slice(0, 10) === dateStr).length;
        days.push({ date: dateStr, count });
      }
      setDailyCounts(days);

      // ── Get untagged articles ──
      const untaggedRows = rows
        .filter((r: any) => !r.node_id)
        .slice(0, 100)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          source: r.source,
          created_at: r.created_at,
          subject: r.subject,
        }));
      setUntagged(untaggedRows);
    } catch (err) {
      console.error('Source intelligence fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClassify = async (articleId: string) => {
    setClassifying(articleId);
    try {
      await fetch('/api/agentic/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_type: 'ca_ingestion', article_id: articleId, action: 'classify' }),
      });
      await fetchData();
    } catch (err) {
      console.error('Classify failed:', err);
    }
    setClassifying(null);
  };

  const maxDayCount = Math.max(...dailyCounts.map((d) => d.count), 1);

  const filteredSources = filter
    ? sources.filter((s) => s.source.toLowerCase().includes(filter.toLowerCase()))
    : sources;

  const filteredUntagged = filter
    ? untagged.filter((u) => u.source.toLowerCase().includes(filter.toLowerCase()))
    : untagged;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-500">Loading source intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/console" className="hover:underline">Console</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Source Intelligence</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Source Intelligence</h1>
        <button onClick={fetchData} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      {/* ── Ingestion Agent Health Summary ── */}
      {agentInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Successful Scrape</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {agentInfo.last_success_at ? timeAgo(agentInfo.last_success_at) : 'never'}
            </p>
            {agentInfo.last_success_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(agentInfo.last_success_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Failure</p>
            <p className={`text-sm font-semibold ${agentInfo.last_failure_at ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
              {agentInfo.last_failure_at ? timeAgo(agentInfo.last_failure_at) : 'none'}
            </p>
            {agentInfo.last_failure_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(agentInfo.last_failure_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ingestion Runs</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{agentInfo.total_runs}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="text-green-600">{agentInfo.success_count} ok</span>
              {' / '}
              <span className="text-red-500">{agentInfo.failure_count} fail</span>
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Untagged Articles</p>
            <p className={`text-sm font-semibold ${totalUntagged > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {totalUntagged}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">no node_id in knowledge graph</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filter by source name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-xs text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        />
      </div>

      {/* Sources Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">CA Sources Overview</h2>
        </div>
        {filteredSources.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">No sources found</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 font-medium">Health</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Last Scrape</th>
                <th className="px-4 py-2 font-medium">Total Articles</th>
                <th className="px-4 py-2 font-medium">Untagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSources.map((s) => (
                <tr key={s.source} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${healthColor(s.health)}`}
                      title={
                        s.health === 'green'
                          ? 'Scraped within 24h'
                          : s.health === 'yellow'
                            ? 'Scraped 24-72h ago'
                            : 'Not scraped in 72h+'
                      }
                    />
                  </td>
                  <td className="px-4 py-2 font-medium">{s.source}</td>
                  <td className="px-4 py-2 text-xs">
                    <span>{timeAgo(s.last_scrape)}</span>
                    <span className="block text-gray-400">
                      {new Date(s.last_scrape).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-2">{s.total_count}</td>
                  <td className="px-4 py-2">
                    {s.untagged_count > 0 ? (
                      <span className="text-orange-600 font-medium">{s.untagged_count}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ingestion Chart (last 7 days) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Articles Ingested (Last 7 Days)</h2>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-2 h-32">
            {dailyCounts.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{d.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.max((d.count / maxDayCount) * 100, 4)}%` }}
                />
                <span className="text-xs text-gray-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Untagged Articles */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Untagged Articles ({filteredUntagged.length})
          </h2>
        </div>
        {filteredUntagged.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">All articles are tagged</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium">Subject</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUntagged.map((a) => (
                  <tr key={a.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-2 max-w-xs truncate" title={a.title}>{a.title}</td>
                    <td className="px-4 py-2 text-xs">{a.source}</td>
                    <td className="px-4 py-2 text-xs">{a.subject || '--'}</td>
                    <td className="px-4 py-2 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleClassify(a.id)}
                        disabled={classifying === a.id}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {classifying === a.id ? 'Classifying...' : 'Classify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
