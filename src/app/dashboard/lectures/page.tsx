'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Clock, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { LectureGenerationDialog } from '@/components/lectures/lecture-generation-dialog';
import { LectureProgressCard } from '@/components/lectures/lecture-progress-card';

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
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-green-100 text-green-700' },
  queued: { label: 'Queued', className: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  outline: { label: 'Generating', className: 'bg-blue-100 text-blue-700' },
  scripting: { label: 'Scripting', className: 'bg-blue-100 text-blue-700' },
  visuals: { label: 'Creating Visuals', className: 'bg-purple-100 text-purple-700' },
  audio: { label: 'Voiceover', className: 'bg-indigo-100 text-indigo-700' },
  compiling: { label: 'Compiling', className: 'bg-cyan-100 text-cyan-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
};

export default function LecturesPage() {
  const [lectures, setLectures] = useState<LectureJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLectures = useCallback(async () => {
    try {
      const res = await fetch('/api/lectures');
      const data = await res.json();
      setLectures(data.data || data.lectures || data || []);
    } catch (err) {
      console.error('Failed to fetch lectures:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLectures(); }, [fetchLectures]);

  const readyLectures = lectures.filter(l => l.status === 'ready');
  const inProgressLectures = lectures.filter(l =>
    !['ready', 'failed', 'cancelled'].includes(l.status)
  );
  const failedLectures = lectures.filter(l => l.status === 'failed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-2 bg-saffron-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Animated Lectures</h1>
                <p className="text-sm text-gray-600">{lectures.length} lecture{lectures.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <LectureGenerationDialog onGenerated={fetchLectures} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* In-progress lectures */}
        {inProgressLectures.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-saffron-500 animate-spin" /> In Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressLectures.map((l) => (
                <LectureProgressCard
                  key={l.id}
                  jobId={l.id}
                  topic={l.topic}
                  subject={l.subject_slug}
                  initialStatus={l.status}
                  initialProgress={l.progress_percent}
                  initialPhase={l.current_phase}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ready lectures */}
        {readyLectures.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ready to Watch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {readyLectures.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/lectures/${l.id}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="aspect-video bg-gradient-to-br from-saffron-500 to-orange-600 flex items-center justify-center relative">
                    <Play className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[l.status]?.className || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_BADGE[l.status]?.label || l.status}
                    </span>
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-medium text-saffron-600">{l.subject_slug}</span>
                    <h3 className="font-semibold text-sm text-gray-900 mt-1 line-clamp-2">{l.topic}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {l.total_chapters || 18} chapters</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Failed lectures */}
        {failedLectures.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Failed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {failedLectures.map((l) => (
                <div key={l.id} className="bg-white rounded-xl border border-red-200 p-4">
                  <h3 className="font-semibold text-sm text-gray-900">{l.topic}</h3>
                  <p className="text-xs text-gray-500 mt-1">{l.subject_slug}</p>
                  <p className="text-xs text-red-600 mt-2">{l.current_phase || 'Generation failed'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {lectures.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No lectures yet</h2>
            <p className="text-gray-500 mb-6">Generate your first AI-powered animated lecture on any UPSC topic.</p>
            <LectureGenerationDialog onGenerated={fetchLectures} />
          </div>
        )}
      </main>
    </div>
  );
}
