/**
 * Study Trend Chart Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Line chart of daily study hours
 * - 7d/30d/90d toggle
 * - Subject color coding
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

interface StudyTrendChartProps {
  showHindi: boolean;
}

interface StudyDataPoint {
  date: string;
  GS1: number;
  GS2: number;
  GS3: number;
  GS4: number;
  CSAT: number;
  total: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  GS1: '#3B82F6',
  GS2: '#10B981',
  GS3: '#F97316',
  GS4: '#8B5CF6',
  CSAT: '#EF4444',
};

export function StudyTrendChart({ showHindi }: StudyTrendChartProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<StudyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjects, setShowSubjects] = useState<Record<string, boolean>>({
    GS1: true, GS2: true, GS3: true, GS4: true, CSAT: true,
  });

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // In production: fetch from /api/analytics/study-trends?range={range}
      // Generate sample data
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const sampleData: StudyDataPoint[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const gs1 = Math.random() * 3 + 0.5;
        const gs2 = Math.random() * 2.5 + 0.5;
        const gs3 = Math.random() * 2 + 0.5;
        const gs4 = Math.random() * 1.5 + 0.5;
        const csat = i % 3 === 0 ? Math.random() * 1.5 + 0.5 : 0;

        sampleData.push({
          date: date.toISOString().split('T')[0],
          GS1: Math.round(gs1 * 10) / 10,
          GS2: Math.round(gs2 * 10) / 10,
          GS3: Math.round(gs3 * 10) / 10,
          GS4: Math.round(gs4 * 10) / 10,
          CSAT: Math.round(csat * 10) / 10,
          total: Math.round((gs1 + gs2 + gs3 + gs4 + csat) * 10) / 10,
        });
      }

      setData(sampleData);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setShowSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
  };

  const maxHours = Math.max(...data.map((d) => d.total), 1);
  const chartHeight = 200;
  const chartWidth = 100; // percentage

  const getPointX = (index: number) => (index / (data.length - 1)) * 100;
  const getPointY = (value: number) => chartHeight - (value / (maxHours + 1)) * chartHeight;

  const buildPath = (subject: string) => {
    return data
      .map((point, i) => {
        const x = getPointX(i);
        const y = getPointY(point[subject as keyof StudyDataPoint] as number);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  const avgHours = data.length > 0 ? (data.reduce((sum, d) => sum + d.total, 0) / data.length).toFixed(1) : 0;
  const trend = data.length >= 7
    ? data.slice(-7).reduce((sum, d) => sum + d.total, 0) / 7 -
      data.slice(0, 7).reduce((sum, d) => sum + d.total, 0) / 7
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-saffron-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {showHindi ? 'अध्ययन प्रवृत्ति' : 'Study Trend'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  range === r
                    ? 'bg-saffron-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r === '7d' ? (showHindi ? '7 दिन' : '7D') : r === '30d' ? (showHindi ? '30 दिन' : '30D') : (showHindi ? '90 दिन' : '90D')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {showHindi ? 'औसत:' : 'Avg:'} <span className="font-semibold text-saffron-600">{avgHours}h</span>
          </span>
          <span className={`flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Subject Legend */}
      <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-3">
        {Object.entries(SUBJECT_COLORS).map(([subject, color]) => (
          <button
            key={subject}
            onClick={() => toggleSubject(subject)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-opacity ${
              showSubjects[subject] ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
            {subject}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="p-4">
        <svg
          viewBox={`0 0 100 ${chartHeight + 20}`}
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: `${chartHeight}px` }}
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              y1={getPointY(maxHours * fraction)}
              x2="100"
              y2={getPointY(maxHours * fraction)}
              stroke="#E5E7EB"
              strokeWidth="0.2"
              strokeDasharray="2 2"
            />
          ))}

          {/* Subject Lines */}
          {Object.keys(SUBJECT_COLORS).map((subject) =>
            showSubjects[subject] ? (
              <path
                key={subject}
                d={buildPath(subject)}
                fill="none"
                stroke={SUBJECT_COLORS[subject]}
                strokeWidth="1"
                strokeLinecap="round"
              />
            ) : null
          )}

          {/* Data Points */}
          {Object.keys(SUBJECT_COLORS).map(
            (subject) =>
              showSubjects[subject] &&
              data.map((point, i) => (
                <circle
                  key={`${subject}-${i}`}
                  cx={getPointX(i)}
                  cy={getPointY(point[subject as keyof StudyDataPoint] as number)}
                  r="1"
                  fill={SUBJECT_COLORS[subject]}
                />
              ))
          )}
        </svg>

        {/* Date Labels */}
        <div className="mt-2 flex justify-between text-[10px] text-gray-400">
          {data.length > 0 && (
            <>
              <span>{new Date(data[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <span>{new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {showHindi ? `पिछले ${data.length} दिनों का डेटा` : `Data from last ${data.length} days`}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {data.length > 0 ? data[data.length - 1].date : '-'}
        </span>
      </div>
    </div>
  );
}