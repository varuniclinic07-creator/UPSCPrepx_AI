'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, ArrowLeft, Trophy, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell,
} from 'recharts';

interface PerformanceData {
  quizTrend: { date: string; score: number; total: number; correct: number; subject: string }[];
  subjectPerformance: { subject: string; avgAccuracy: number; totalTime: number; topicCount: number; masteredCount: number }[];
  distribution: { range: string; count: number }[];
  avgScore: number;
  bestScore: number;
  totalQuizzes: number;
  improvement: number;
}

const SCORE_COLORS = [
  '#EF4444', '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#059669', '#047857',
];

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/performance-stats')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
          <div className="h-12 bg-gray-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load analytics</div>;

  // Radar data from subject performance
  const radarData = data.subjectPerformance.slice(0, 8).map((s) => ({
    subject: s.subject.length > 12 ? s.subject.slice(0, 12) + '...' : s.subject,
    accuracy: s.avgAccuracy,
    mastery: s.topicCount > 0 ? Math.round((s.masteredCount / s.topicCount) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/analytics" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Performance Insights</h1>
              <p className="text-sm text-gray-600">{data.totalQuizzes} quizzes analyzed</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Score', value: `${data.avgScore}%`, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
            { label: 'Best Score', value: `${data.bestScore}%`, icon: Trophy, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Total Quizzes', value: data.totalQuizzes, icon: Zap, color: 'text-purple-600 bg-purple-50' },
            {
              label: 'Improvement',
              value: data.improvement >= 0 ? `+${data.improvement}%` : `${data.improvement}%`,
              icon: TrendingUp,
              color: data.improvement >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`p-2 rounded-lg w-fit ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold mt-2 text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Quiz Score Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quiz Score Trend</h3>
          {data.quizTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.quizTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ fill: '#F97316', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No quiz data yet. Take a quiz to see trends!</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Accuracy Radar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Subject Accuracy Radar</h3>
            {radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Mastery %" dataKey="mastery" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">Need 3+ subjects for radar view</div>
            )}
          </div>

          {/* Score Distribution Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Quizzes" radius={[4, 4, 0, 0]}>
                  {data.distribution.map((_, i) => (
                    <Cell key={i} fill={SCORE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Table */}
        {data.subjectPerformance.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Subject</th>
                    <th className="text-right py-2 font-medium text-gray-600">Avg Accuracy</th>
                    <th className="text-right py-2 font-medium text-gray-600">Study Time</th>
                    <th className="text-right py-2 font-medium text-gray-600">Topics</th>
                    <th className="text-right py-2 font-medium text-gray-600">Mastered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjectPerformance.map((s) => (
                    <tr key={s.subject} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 font-medium text-gray-900">{s.subject}</td>
                      <td className="text-right py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.avgAccuracy >= 80 ? 'bg-green-100 text-green-700' :
                          s.avgAccuracy >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.avgAccuracy}%
                        </span>
                      </td>
                      <td className="text-right py-2 text-gray-600">
                        {s.totalTime >= 60 ? `${Math.floor(s.totalTime / 60)}h ${s.totalTime % 60}m` : `${s.totalTime}m`}
                      </td>
                      <td className="text-right py-2 text-gray-600">{s.topicCount}</td>
                      <td className="text-right py-2 text-gray-600">{s.masteredCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
