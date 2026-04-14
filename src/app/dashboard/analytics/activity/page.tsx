'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, Flame, Clock, Calendar, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell,
  LineChart, Line,
} from 'recharts';

interface ActivityData {
  dailyActivity: { date: string; minutes: number; topics: number; accuracy: number }[];
  currentStreak: number;
  totalMinutes: number;
  activeDays: number;
  avgMinutesPerDay: number;
  weeklySummary: { week: string; minutes: number; topics: number }[];
}

export default function ActivityAnalyticsPage() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/activity-stats?days=${range}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

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

  const hours = Math.floor(data.totalMinutes / 60);
  const mins = data.totalMinutes % 60;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/analytics" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Study Activity</h1>
                <p className="text-sm text-gray-600">Last {range} days</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[7, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    range === d ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Study Time', value: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`, icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'Current Streak', value: `${data.currentStreak}d`, icon: Flame, color: 'text-orange-600 bg-orange-50' },
            { label: 'Active Days', value: `${data.activeDays}/${range}`, icon: Calendar, color: 'text-green-600 bg-green-50' },
            { label: 'Avg/Day', value: `${data.avgMinutesPerDay}m`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
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

        {/* Daily Study Time Area Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Study Minutes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.dailyActivity}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)} // MM-DD
                interval={Math.max(Math.floor(data.dailyActivity.length / 10), 0)}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => `Date: ${d}`}
                formatter={((v: number) => [`${v} min`, 'Study Time']) as any}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#colorMinutes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Accuracy Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Daily Accuracy Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyActivity.filter(d => d.accuracy > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={((v: number) => [`${v}%`, 'Accuracy']) as any}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Summary Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Summary</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.weeklySummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="minutes" name="Minutes" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="topics" name="Topics" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consistency Heatmap (simple grid) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Consistency Map</h3>
          <div className="flex flex-wrap gap-1">
            {data.dailyActivity.map((d) => {
              const intensity = d.minutes === 0 ? 0 : Math.min(d.minutes / 60, 1);
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.minutes}m`}
                  className="w-4 h-4 rounded-sm transition"
                  style={{
                    backgroundColor: d.minutes === 0
                      ? '#F3F4F6'
                      : `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Less</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
              <div
                key={v}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(16, 185, 129, ${v})` }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </main>
    </div>
  );
}
