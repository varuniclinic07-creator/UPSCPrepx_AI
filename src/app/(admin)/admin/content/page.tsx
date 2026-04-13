'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  content_type: string;
  status: string;
  confidence_score: number;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  ai_provider: string | null;
  agent_type: string | null;
  knowledge_nodes: {
    id: string;
    title: string;
    subject: string | null;
    syllabus_code: string | null;
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  needs_revision: number;
  total: number;
}

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'needs_revision', 'all'];
const TYPE_FILTERS = ['note', 'quiz', 'mind_map', 'answer_framework', 'ca_brief', 'mcq_set', 'video_script', 'animation_prompt'];

export default function ContentQueuePage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, needs_revision: 0, total: 0 });
  const [status, setStatus] = useState('pending');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: String(page), limit: '15' });
      if (type) params.set('type', type);
      const res = await fetch(`/api/admin/content-queue?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setStats(json.data.stats);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [status, type, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (itemId: string, action: string) => {
    setActionLoading(itemId);
    try {
      const notes = action === 'reject' ? prompt('Rejection reason (optional):') : undefined;
      await fetch('/api/admin/content-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action, reviewNotes: notes }),
      });
      fetchData();
    } catch (err) {
      console.error('Action error:', err);
    }
    setActionLoading(null);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'needs_revision': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">Content Queue</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Content Queue Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
          { label: 'Needs Revision', value: stats.needs_revision, color: 'text-orange-600' },
          { label: 'Total', value: stats.total, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                status === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All types</option>
          {TYPE_FILTERS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No items found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.knowledge_nodes?.title || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{item.knowledge_nodes?.subject} {item.knowledge_nodes?.syllabus_code ? `(${item.knowledge_nodes.syllabus_code})` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                      {item.content_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono ${confidenceColor(item.confidence_score)}`}>
                      {Math.round((item.confidence_score || 0) * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{item.agent_type || '-'}</td>
                  <td className="px-4 py-3 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(item.id, 'approve')}
                          disabled={actionLoading === item.id}
                          className="text-green-600 hover:underline text-xs font-medium disabled:opacity-50">
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={actionLoading === item.id}
                          className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'needs_revision')}
                          disabled={actionLoading === item.id}
                          className="text-orange-600 hover:underline text-xs font-medium disabled:opacity-50">
                          Revise
                        </button>
                      </>
                    )}
                    {item.review_notes && (
                      <span className="text-gray-400 text-xs" title={item.review_notes}>Notes</span>
                    )}
                  </td>
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
