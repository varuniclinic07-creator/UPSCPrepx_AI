/**
 * Weekly Comparison Card Component
 * 
 * Master Prompt v8.0 - Feature F9 (READ Mode)
 * - Side-by-side current vs previous week
 * - Green/red delta indicators
 * - Key metrics comparison
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus, Calendar, Clock, CheckCircle, Target } from 'lucide-react';

interface WeeklyComparisonCardProps {
  showHindi: boolean;
}

interface WeekData {
  label: string;
  hours: number;
  tasks: number;
  accuracy: number;
  streak: number;
  mockTests: number;
}

export function WeeklyComparisonCard({ showHindi }: WeeklyComparisonCardProps) {
  const [currentWeek, setCurrentWeek] = useState<WeekData>({ label: 'This Week', hours: 0, tasks: 0, accuracy: 0, streak: 0, mockTests: 0 });
  const [prevWeek, setPrevWeek] = useState<WeekData>({ label: 'Last Week', hours: 0, tasks: 0, accuracy: 0, streak: 0, mockTests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setCurrentWeek({ label: showHindi ? 'इस सप्ताह' : 'This Week', hours: 28, tasks: 32, accuracy: 64, streak: 5, mockTests: 2 });
      setPrevWeek({ label: showHindi ? 'पिछला सप्ताह' : 'Last Week', hours: 24, tasks: 28, accuracy: 61, streak: 4, mockTests: 1 });
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDelta = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return { value: `+${diff}`, icon: ArrowUp, color: 'text-green-600' };
    if (diff < 0) return { value: `${diff}`, icon: ArrowDown, color: 'text-red-600' };
    return { value: '0', icon: Minus, color: 'text-gray-400' };
  };

  const metrics = [
    { key: 'hours', label: { en: 'Study Hours', hi: 'अध्ययन घंटे' }, icon: Clock, current: currentWeek.hours, previous: prevWeek.hours, unit: 'h', higher: true },
    { key: 'tasks', label: { en: 'Tasks Completed', hi: 'कार्य पूर्ण' }, icon: CheckCircle, current: currentWeek.tasks, previous: prevWeek.tasks, unit: '', higher: true },
    { key: 'accuracy', label: { en: 'Accuracy', hi: 'सटीकता' }, icon: Target, current: currentWeek.accuracy, previous: prevWeek.accuracy, unit: '%', higher: true },
    { key: 'streak', label: { en: 'Day Streak', hi: 'दिन स्ट्रीक' }, icon: Calendar, current: currentWeek.streak, previous: prevWeek.streak, unit: 'd', higher: true },
    { key: 'mockTests', label: { en: 'Mock Tests', hi: 'मॉक टेस्ट' }, icon: Calendar, current: currentWeek.mockTests, previous: prevWeek.mockTests, unit: '', higher: true },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'साप्ताहिक तुलना' : 'Weekly Comparison'}
          </h3>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-3">
          {metrics.map(({ key, label, icon: Icon, current, previous, unit, higher }) => {
            const { value, icon: DeltaIcon, color } = getDelta(current, previous);
            const isBetter = higher ? current >= previous : current <= previous;

            return (
              <div key={key} className={`p-3 rounded-lg border text-center transition-colors ${
                isBetter ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <Icon className={`w-5 h-5 mx-auto mb-2 ${isBetter ? 'text-green-600' : 'text-red-600'}`} />
                <p className="text-xs text-gray-500 mb-1">{label[showHindi ? 'hi' : 'en']}</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">{current}{unit}</p>
                  <div className={`flex items-center justify-center gap-0.5 text-xs font-medium ${color}`}>
                    <DeltaIcon className="w-3 h-3" />
                    <span>{value}{unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-center">
            {currentWeek.hours > prevWeek.hours
              ? showHindi
                ? `🎉 बहुत बढ़िया! पिछले सप्ताह से ${currentWeek.hours - prevWeek.hours} घंटे अधिक पढ़ाई!`
                : `🎉 Great job! Studied ${currentWeek.hours - prevWeek.hours} more hours than last week!`
              : currentWeek.hours < prevWeek.hours
              ? showHindi
                ? `⚠️ पिछले सप्ताह से ${prevWeek.hours - currentWeek.hours} घंटे कम। और मेहनत करें!`
                : `⚠️ Studied ${prevWeek.hours - currentWeek.hours} fewer hours than last week. Push harder!`
              : showHindi
              ? '= पिछले सप्ताह जितना ही। अच्छा है, बढ़ाएं!'
              : '= Same hours as last week. Good, but try to increase!'
            }
          </p>
        </div>
      </div>
    </div>
  );
}