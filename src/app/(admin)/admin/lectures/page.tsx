'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, XCircle, Play, BarChart3 } from 'lucide-react';

interface LectureJob {
  id: string;
  topic: string;
  subject_slug: string;
  status: string;
  progress_percent: number;
  current_phase: string;
  video_url: string | null;
  total_chapters: number;
  created_at: string;
  profiles?: { email?: string; full_name?: string };
}

interface Stats { total: number; ready: number; inProgress: number; failed: number; }

const STATUS_COLORS: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  queued: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function AdminLecturesPage() {
  const [lectures, setLectures] = useState<LectureJob[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, ready: 0, inProgress: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/lectures');
      const data = await res.json();
      setLectures(data.lectures || []);
      setStats(data.stats || { total: 0, ready: 0, inProgress: 0, failed: 0 });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const cancelLecture = async (id: string) => {
    await fetch(`/api/admin/lectures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    fetchData();
  };

  const retryLecture = async (id: string) => {
    await fetch(`/api/admin/lectures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'queued', progress_percent: 0 }),
    });
    fetchData();
  };

  const filtered = filter === 'all'
    ? lectures
    : lectures.filter(l => l.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Lectures</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lecture Management</h1>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900 bg-gray-50' },
          { label: 'Ready', value: stats.ready, color: 'text-green-700 bg-green-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-700 bg-blue-50' },
          { label: 'Failed', value: stats.failed, color: 'text-red-700 bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'ready', 'queued', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition capitalize ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Topic</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{l.topic}</td>
                  <td className="px-4 py-3 text-gray-600">{l.subject_slug}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{l.profiles?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || 'bg-blue-100 text-blue-700'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-saffron-500 rounded-full" style={{ width: `${l.progress_percent}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {l.status === 'failed' && (
                      <button onClick={() => retryLecture(l.id)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                        Retry
                      </button>
                    )}
                    {!['ready', 'failed', 'cancelled'].includes(l.status) && (
                      <button onClick={() => cancelLecture(l.id)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">
                        Cancel
                      </button>
                    )}
                    {l.status === 'ready' && l.video_url && (
                      <a href={l.video_url} target="_blank" className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 inline-flex items-center gap-1">
                        <Play className="w-3 h-3" /> View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No lectures found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
