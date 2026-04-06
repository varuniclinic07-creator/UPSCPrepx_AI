/**
 * Consistency Heatmap Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - GitHub-style calendar heatmap
 * - Color intensity = study hours
 * - Streak indicators
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Clock } from 'lucide-react';

interface ConsistencyHeatmapProps {
  showHindi: boolean;
}

interface DayData {
  date: string;
  hours: number;
  month: number;
  dayOfWeek: number;
}

export function ConsistencyHeatmap({ showHindi }: ConsistencyHeatmapProps) {
  const [data, setData] = useState<DayData[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Generate last 120 days of sample data
      const sampleData: DayData[] = [];
      let streak = 0;
      let longest = 0;
      let total = 0;

      for (let i = 119; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const hours = Math.random() > 0.15 ? Math.random() * 8 + 0.5 : 0;
        if (hours > 0) {
          streak++;
          total++;
          longest = Math.max(longest, streak);
        } else {
          streak = 0;
        }

        sampleData.push({
          date: date.toISOString().split('T')[0],
          hours: Math.round(hours * 10) / 10,
          month: date.getMonth(),
          dayOfWeek: date.getDay(),
        });
      }

      setData(sampleData);

      // Calculate current streak from end
      let current = 0;
      for (let i = sampleData.length - 1; i >= 0; i--) {
        if (sampleData[i].hours > 0) current++;
        else break;
      }
      setCurrentStreak(current);
      setLongestStreak(longest);
      setTotalDays(total);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (hours: number) => {
    if (hours === 0) return 'bg-gray-100';
    if (hours < 2) return 'bg-green-200';
    if (hours < 4) return 'bg-green-300';
    if (hours < 6) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getCellLabel = (hours: number) => {
    if (hours === 0) return showHindi ? 'कोई अध्ययन नहीं' : 'No study';
    return `${hours}h ${showHindi ? 'अध्ययन' : 'studied'}`;
  };

  // Group by weeks (7 days each)
  const weeks: DayData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Get month labels
  const monthLabels = data.reduce((labels: string[], day) => {
    const month = day.date.slice(0, 7);
    if (!labels.includes(month)) labels.push(month);
    return labels;
  }, []);

  // Day of week labels
  const dayLabels = showHindi ? ['रवि', 'सो', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'] :
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {showHindi ? 'स्थिरता हीटमैप' : 'Consistency Heatmap'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-orange-600 font-medium">
              <Flame className="w-4 h-4" />
              {currentStreak} {showHindi ? 'दिन' : 'days'}
            </span>
            <span className="text-gray-500">
              {showHindi ? 'सर्वश्रेष्ठ:' : 'Best:'} {longestStreak}
            </span>
            <span className="text-gray-500">
              {totalDays}/{120} {showHindi ? 'दिन' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="p-4 overflow-x-auto">
        <div className="flex items-start gap-1">
          {/* Day Labels */}
          <div className="space-y-0.5 pt-5">
            {dayLabels.map((day, i) => (
              <div key={day} className="h-3.5 text-[9px] text-gray-400 w-8 text-right">
                {i % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>

          {/* Week Columns */}
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-0.5">
                {/* Pad with empty cells to align with Sunday start */}
                {week[0] && Array.from({ length: 7 - week.length }).map((_, i) => (
                  <div key={i} className="w-3.5 h-3.5" />
                ))}
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${getCellColor(day.hours)}`}
                    title={`${day.date}: ${getCellLabel(day.hours)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{showHindi ? 'कम' : 'Less'}</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-200" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-300" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-400" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-500" />
            <span>{showHindi ? 'अधिक' : 'More'}</span>
          </div>

          {hoveredDay && (
            <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
              {hoveredDay.date}: <span className="font-medium">{getCellLabel(hoveredDay.hours)}</span>
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {showHindi
                ? `पिछले 4 महीनों का डेटा • ${Math.round((totalDays / 120) * 100)}% निरंतरता`
                : `Last 4 months of data • ${Math.round((totalDays / 120) * 100)}% consistency`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}