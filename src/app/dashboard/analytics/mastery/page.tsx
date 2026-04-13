'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, ArrowLeft, AlertCircle, Clock, TrendingUp, Layers } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend,
} from 'recharts';

const LEVEL_COLORS: Record<string, string> = {
  mastered: '#10B981',
  strong: '#3B82F6',
  developing: '#F59E0B',
  weak: '#EF4444',
  not_started: '#D1D5DB',
};

const LEVEL_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  strong: 'Strong',
  developing: 'Developing',
  weak: 'Weak',
  not_started: 'Not Started',
};

interface MasteryData {
  distribution: Record<string, number>;
  srs: { overdue: number; dueToday: number; dueThisWeek: number; upcoming: number };
  avgEase: number;
  avgAccuracy: number;
  totalTopics: number;
  weeklyProgression: { week: string; mastered: number; strong: number; developing: number }[];
}

export default function MasteryAnalyticsPage() {
  const [data, setData] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/mastery-stats')
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

  const pieData = Object.entries(data.distribution)
    .filter(([, v]) => v > 0)
    .map(([level, count]) => ({
      name: LEVEL_LABELS[level],
      value: count,
      color: LEVEL_COLORS[level],
    }));

  const srsData = [
    { name: 'Overdue', value: data.srs.overdue, color: '#EF4444' },
    { name: 'Due Today', value: data.srs.dueToday, color: '#F59E0B' },
    { name: 'This Week', value: data.srs.dueThisWeek, color: '#3B82F6' },
    { name: 'Upcoming', value: data.srs.upcoming, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/analytics" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mastery Analytics</h1>
              <p className="text-sm text-gray-600">{data.totalTopics} topics tracked</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Topics', value: data.totalTopics, icon: Layers, color: 'text-blue-600 bg-blue-50' },
            { label: 'Avg Accuracy', value: `${data.avgAccuracy}%`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Avg Ease', value: data.avgEase.toFixed(2), icon: Brain, color: 'text-purple-600 bg-purple-50' },
            { label: 'Overdue', value: data.srs.overdue, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mastery Distribution Pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Mastery Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No mastery data yet</div>
            )}
          </div>

          {/* SRS Pipeline Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">SRS Review Pipeline</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={srsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {srsData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Progression Stacked Area */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Mastery Progression (8 Weeks)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.weeklyProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="mastered" stackId="1" fill="#10B981" stroke="#059669" />
                <Area type="monotone" dataKey="strong" stackId="1" fill="#3B82F6" stroke="#2563EB" />
                <Area type="monotone" dataKey="developing" stackId="1" fill="#F59E0B" stroke="#D97706" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
