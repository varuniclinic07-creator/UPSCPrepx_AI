'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface KnowledgeNode {
  id: string;
  type: string;
  title: string;
  subject: string | null;
  syllabus_code: string | null;
  confidence_score: number;
  source_count: number;
  freshness_score: number;
  human_approved: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_nodes: number;
  approved: number;
  unapproved: number;
  avg_confidence: number;
  avg_freshness: number;
  by_type: Record<string, number>;
  by_subject: Record<string, number>;
  low_quality: number;
}

const NODE_TYPES = ['subject', 'topic', 'subtopic', 'pyq', 'current_affair', 'note', 'quiz', 'answer_framework', 'scheme', 'judgment', 'report', 'uploaded_material'];

export default function KnowledgeBasePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [approved, setApproved] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (type) params.set('type', type);
      if (subject) params.set('subject', subject);
      if (approved) params.set('approved', approved);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/knowledge-graph?${params}`);
      const json = await res.json();
      if (json.success) {
        setNodes(json.data.nodes);
        setStats(json.data.stats);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [type, subject, approved, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const scoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const subjects = stats ? Object.keys(stats.by_subject).sort() : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Knowledge Graph</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Knowledge Graph Explorer</h1>

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Total Nodes', value: stats.total_nodes, color: 'text-blue-600' },
              { label: 'Approved', value: stats.approved, color: 'text-green-600' },
              { label: 'Unapproved', value: stats.unapproved, color: 'text-yellow-600' },
              { label: 'Low Quality', value: stats.low_quality, color: 'text-red-600' },
              { label: 'Avg Confidence', value: `${Math.round(stats.avg_confidence * 100)}%`, color: scoreColor(stats.avg_confidence) },
              { label: 'Avg Freshness', value: `${Math.round(stats.avg_freshness * 100)}%`, color: scoreColor(stats.avg_freshness) },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Type Distribution */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Node Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_type).sort((a, b) => b[1] - a[1]).map(([t, count]) => (
                <button key={t} onClick={() => { setType(t); setPage(1); }}
                  className={`text-xs px-3 py-1 rounded-full transition ${
                    type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}>
                  {t}: {count}
                </button>
              ))}
              {type && (
                <button onClick={() => { setType(''); setPage(1); }}
                  className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text" placeholder="Search titles..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-64"
        />
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={approved} onChange={(e) => { setApproved(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All approval</option>
          <option value="true">Approved</option>
          <option value="false">Not approved</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : nodes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No nodes found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Freshness</th>
                <th className="px-4 py-3 font-medium">Sources</th>
                <th className="px-4 py-3 font-medium">Approved</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {nodes.map((node) => (
                <tr key={node.id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3">
                    <div className="font-medium max-w-xs truncate">{node.title}</div>
                    {node.syllabus_code && (
                      <div className="text-xs text-gray-500">{node.syllabus_code}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                      {node.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{node.subject || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${scoreColor(node.confidence_score)}`}>
                      {Math.round(node.confidence_score * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${scoreColor(node.freshness_score)}`}>
                      {Math.round(node.freshness_score * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-center">{node.source_count}</td>
                  <td className="px-4 py-3 text-center">
                    {node.human_approved ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(node.updated_at).toLocaleDateString()}</td>
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
