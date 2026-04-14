'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Download, Play, Loader2, FileText } from 'lucide-react';

interface Compilation {
  id: string;
  month: number;
  year: number;
  pdf_url: string | null;
  video_url: string | null;
  status: string;
  topic_count: number;
  article_count: number;
}

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyCompilationPage() {
  const [compilations, setCompilations] = useState<Compilation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/compilations')
      .then(r => r.json())
      .then(d => setCompilations(d.compilations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const requestCompilation = async (month: number, year: number) => {
    await fetch('/api/compilations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    // Refresh
    const res = await fetch('/api/compilations');
    const data = await res.json();
    setCompilations(data.compilations || []);
  };

  // Generate cards for last 6 months
  const now = new Date();
  const monthCards = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const comp = compilations.find(c => c.month === m && c.year === y);
    return { month: m, year: y, label: `${MONTH_NAMES[m]} ${y}`, compilation: comp };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Monthly Compilation</h1>
              <p className="text-sm text-gray-600">Current affairs PDF + video for each month</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          monthCards.map(({ month, year, label, compilation }) => (
            <div key={`${month}-${year}`} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  {compilation && (
                    <p className="text-xs text-gray-500 mt-1">
                      {compilation.topic_count} topics — {compilation.article_count} articles
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {compilation?.status === 'ready' ? (
                    <>
                      {compilation.pdf_url && (
                        <a
                          href={compilation.pdf_url}
                          target="_blank"
                          rel="noopener"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition"
                        >
                          <Download className="w-4 h-4" /> PDF
                        </a>
                      )}
                      {compilation.video_url && (
                        <Link
                          href={`/dashboard/video/${compilation.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-saffron-50 text-saffron-700 rounded-lg text-sm hover:bg-saffron-100 transition"
                        >
                          <Play className="w-4 h-4" /> Watch Video
                        </Link>
                      )}
                    </>
                  ) : compilation?.status === 'generating' ? (
                    <span className="flex items-center gap-1 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </span>
                  ) : compilation?.status === 'pending' ? (
                    <span className="text-sm text-gray-500">Queued</span>
                  ) : (
                    <button
                      onClick={() => requestCompilation(month, year)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      <FileText className="w-4 h-4" /> Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
