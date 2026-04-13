'use client';

import Link from 'next/link';
import { BarChart3, Brain, Activity, Target, ArrowRight } from 'lucide-react';

const dashboards = [
  {
    title: 'Mastery Analytics',
    description: 'Track your knowledge mastery distribution, SRS pipeline, and topic progression over time.',
    href: '/dashboard/analytics/mastery',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    stats: 'Levels, SRS, Ease Factor',
  },
  {
    title: 'Study Activity',
    description: 'Daily study time trends, streak tracking, and weekly activity summaries with goal progress.',
    href: '/dashboard/analytics/activity',
    icon: Activity,
    color: 'from-emerald-500 to-teal-600',
    stats: 'Time, Streaks, Consistency',
  },
  {
    title: 'Performance Insights',
    description: 'Quiz score trends, subject-wise accuracy radar, and score distribution analysis.',
    href: '/dashboard/analytics/performance',
    icon: Target,
    color: 'from-orange-500 to-red-600',
    stats: 'Scores, Accuracy, Improvement',
  },
];

export default function AnalyticsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analytics Hub</h1>
              <p className="text-sm text-gray-600">Deep insights into your UPSC preparation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`bg-gradient-to-r ${d.color} p-6`}>
                <d.icon className="w-10 h-10 text-white mb-3" />
                <h2 className="text-xl font-bold text-white">{d.title}</h2>
                <p className="text-sm text-white/80 mt-1">{d.stats}</p>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 leading-relaxed">{d.description}</p>
                <div className="flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                  View Dashboard <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick link to existing progress page */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard/progress"
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Looking for the classic Progress Dashboard? Click here
          </Link>
        </div>
      </main>
    </div>
  );
}
