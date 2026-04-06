/**
 * Time Distribution Chart Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Donut chart of study time by subject
 * - Hover details with percentages
 * - Ideal vs actual comparison
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { PieChart, Clock, AlertTriangle } from 'lucide-react';

interface TimeDistributionChartProps {
  showHindi: boolean;
}

interface SubjectTime {
  subject: string;
  hours: number;
  percentage: number;
  color: string;
  ideal: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  GS1: '#3B82F6',
  GS2: '#10B981',
  GS3: '#F97316',
  GS4: '#8B5CF6',
  CSAT: '#EF4444',
  'Current Affairs': '#F59E0B',
};

const SUBJECT_LABELS: Record<string, { en: string; hi: string }> = {
  GS1: { en: 'GS1 - History & Geo', hi: 'GS1 - इतिहास और भूगोल' },
  GS2: { en: 'GS2 - Polity & IR', hi: 'GS2 - राजव्यवस्था' },
  GS3: { en: 'GS3 - Economy & Tech', hi: 'GS3 - अर्थव्यवस्था' },
  GS4: { en: 'GS4 - Ethics', hi: 'GS4 - नैतिकता' },
  CSAT: { en: 'CSAT', hi: 'CSAT' },
  'Current Affairs': { en: 'Current Affairs', hi: 'करंट अफेयर्स' },
};

const DONUT_RADIUS = 80;
const DONUT_WIDTH = 30;

export function TimeDistributionChart({ showHindi }: TimeDistributionChartProps) {
  const [data, setData] = useState<SubjectTime[]>([]);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration
      const sampleData: SubjectTime[] = [
        { subject: 'GS1', hours: 12.5, percentage: 22, color: SUBJECT_COLORS.GS1, ideal: 20 },
        { subject: 'GS2', hours: 10.2, percentage: 18, color: SUBJECT_COLORS.GS2, ideal: 20 },
        { subject: 'GS3', hours: 8.7, percentage: 15, color: SUBJECT_COLORS.GS3, ideal: 20 },
        { subject: 'GS4', hours: 6.3, percentage: 11, color: SUBJECT_COLORS.GS4, ideal: 15 },
        { subject: 'CSAT', hours: 5.1, percentage: 9, color: SUBJECT_COLORS.CSAT, ideal: 10 },
        { subject: 'Current Affairs', hours: 14.2, percentage: 25, color: SUBJECT_COLORS['Current Affairs'], ideal: 15 },
      ];
      setData(sampleData);
    } catch (error) {
      console.error('Failed to fetch time distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = data.reduce((sum, s) => sum + s.hours, 0);

  // Calculate donut segments
  const donutSegments = data.map((subject, index) => {
    const startAngle = data.slice(0, index).reduce((sum, s) => sum + (s.percentage / 100) * 360, 0);
    const endAngle = startAngle + (subject.percentage / 100) * 360;
    return { ...subject, startAngle, endAngle };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="w-48 h-48 bg-gray-200 rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'समय वितरण' : 'Time Distribution'}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {totalHours.toFixed(1)} {showHindi ? 'घंटे इस सप्ताह' : 'hours this week'}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 200 200">
              {donutSegments.map((segment, i) => (
                <path
                  key={segment.subject}
                  d={describeArc(100, 100, DONUT_RADIUS, segment.startAngle + 1, segment.endAngle - 1)}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={hoveredSubject === segment.subject ? DONUT_WIDTH + 5 : DONUT_WIDTH}
                  strokeLinecap="round"
                  className="transition-all cursor-pointer"
                  onClick={() => setHoveredSubject(hoveredSubject === segment.subject ? null : segment.subject)}
                />
              ))}
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hoveredSubject ? (
                <>
                  <span className="text-2xl font-bold" style={{ color: SUBJECT_COLORS[hoveredSubject] }}>
                    {data.find(s => s.subject === hoveredSubject)?.hours.toFixed(1)}h
                  </span>
                  <span className="text-xs text-gray-500">{hoveredSubject}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">{showHindi ? 'कुल घंटे' : 'Total hrs'}</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((subject) => {
              const isNeglected = subject.percentage < subject.ideal * 0.5;
              return (
                <button
                  key={subject.subject}
                  onClick={() => setHoveredSubject(hoveredSubject === subject.subject ? null : subject.subject)}
                  onMouseEnter={() => setHoveredSubject(subject.subject)}
                  onMouseLeave={() => setHoveredSubject(null)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    hoveredSubject === subject.subject ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-700">
                        {SUBJECT_LABELS[subject.subject]?.[showHindi ? 'hi' : 'en']}
                      </span>
                      {isNeglected && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {subject.hours}h ({subject.percentage}%) - {showHindi ? 'लक्ष्य' : 'target'}: {subject.ideal}%
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{subject.percentage}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Neglect Warning */}
        {data.some(s => s.percentage < s.ideal * 0.5) && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                {showHindi
                  ? `⚠️ ${data.filter(s => s.percentage < s.ideal * 0.5).length} ${'विषयों में समय कम हो रहा है। संतुलन बढ़ाएं।'}`
                  : `⚠️ ${data.filter(s => s.percentage < s.ideal * 0.5).length} ${' subjects are neglected. Try to balance your study time.'}`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}