/**
 * Goal Progress Component
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Overall progress dashboard
 * - Stats cards with trends
 * - Streak display
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, Award, Flame, BookOpen, CheckCircle, CalendarDays } from 'lucide-react';

interface GoalProgressProps {
  showHindi: boolean;
  planId?: string;
}

interface ProgressStats {
  totalTasksCompleted: number;
  totalStudyMinutes: number;
  totalXpEarned: number;
  currentStreak: number;
  longestStreak: number;
  syllabusCoverage: number;
  mockTestsCompleted: number;
  dailyGoal: number;
  dailyCompleted: number;
  weeklyHours: number;
  weeklyGoal: number;
}

const STATS_CONFIG = [
  {
    key: 'syllabusCoverage',
    icon: Target,
    title: { en: 'Syllabus Coverage', hi: 'पाठ्यक्रम कवरेज' },
    format: (val: number) => `${val}%`,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'currentStreak',
    icon: Flame,
    title: { en: 'Day Streak', hi: 'दिन की स्ट्रीक' },
    format: (val: number) => `${val} days`,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    key: 'totalStudyMinutes',
    icon: Clock,
    title: { en: 'Total Study', hi: 'कुल अध्ययन' },
    format: (val: number) => `${Math.round(val / 60)}h`,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'totalXpEarned',
    icon: Award,
    title: { en: 'XP Earned', hi: 'XP अर्जित' },
    format: (val: number) => `${val} XP`,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    key: 'mockTestsCompleted',
    icon: CheckCircle,
    title: { en: 'Mock Tests', hi: 'मॉक टेस्ट' },
    format: (val: number) => `${val}`,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    key: 'weeklyHours',
    icon: CalendarDays,
    title: { en: 'This Week', hi: 'इस सप्ताह' },
    format: (val: number) => `${val}h`,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

export function GoalProgress({ showHindi, planId }: GoalProgressProps) {
  const [stats, setStats] = useState<ProgressStats>({
    totalTasksCompleted: 0,
    totalStudyMinutes: 0,
    totalXpEarned: 0,
    currentStreak: 0,
    longestStreak: 0,
    syllabusCoverage: 0,
    mockTestsCompleted: 0,
    dailyGoal: 6,
    dailyCompleted: 0,
    weeklyHours: 0,
    weeklyGoal: 42,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [planId]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // For now, use sample data
      setStats({
        totalTasksCompleted: 156,
        totalStudyMinutes: 4680,
        totalXpEarned: 2340,
        currentStreak: 12,
        longestStreak: 28,
        syllabusCoverage: 34,
        mockTestsCompleted: 5,
        dailyGoal: 6,
        dailyCompleted: 4,
        weeklyHours: 28,
        weeklyGoal: 42,
      });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const dailyProgress = stats.dailyGoal > 0
    ? Math.round((stats.dailyCompleted / stats.dailyGoal) * 100)
    : 0;

  const weeklyProgress = stats.weeklyGoal > 0
    ? Math.round((stats.weeklyHours / stats.weeklyGoal) * 100)
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'प्रगति डैशबोर्ड' : 'Progress Dashboard'}
          </h3>
        </div>
      </div>

      {/* Daily & Weekly Goals */}
      <div className="px-4 py-4 border-b border-gray-200 grid grid-cols-2 gap-4">
        {/* Daily Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {showHindi ? 'दैनिक लक्ष्य' : 'Daily Goal'}
            </span>
            <span className="text-sm font-bold text-saffron-600">
              {stats.dailyCompleted}/{stats.dailyGoal}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-saffron-500 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{dailyProgress}%</p>
        </div>

        {/* Weekly Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {showHindi ? 'साप्ताहिक लक्ष्य' : 'Weekly Goal'}
            </span>
            <span className="text-sm font-bold text-blue-600">
              {stats.weeklyHours}/{stats.weeklyGoal}h
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{weeklyProgress}%</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {STATS_CONFIG.map(({ key, icon: Icon, title, format, color, bgColor }) => (
            <div key={key} className={`p-3 rounded-lg ${bgColor} border border-gray-100`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-xs font-medium text-gray-600">
                  {title[showHindi ? 'hi' : 'en']}
                </span>
              </div>
              <p className={`text-xl font-bold ${color}`}>
                {format(stats[key as keyof ProgressStats] as number)}
              </p>
              {key === 'currentStreak' && stats.longestStreak > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {showHindi ? 'सर्वश्रेष्ठ:' : 'Best:'} {stats.longestStreak} {showHindi ? 'दिन' : 'days'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="px-4 py-3 bg-gradient-to-r from-saffron-50 to-orange-50 border-t border-saffron-100">
        <div className="flex items-center gap-2 text-sm text-saffron-700">
          <BookOpen className="w-4 h-4" />
          <span>
            {stats.currentStreak >= 7
              ? showHindi
                ? `🔥 ${stats.currentStreak} दिन की शानदार स्ट्रीक! जारी रखें!`
                : `🔥 Amazing ${stats.currentStreak}-day streak! Keep it up!`
              : stats.totalTasksCompleted > 0
              ? showHindi
                ? `अब तक ${stats.totalTasksCompleted} कार्य पूर्ण! बढ़िया!`
                : `${stats.totalTasksCompleted} tasks completed so far! Great job!`
              : showHindi
              ? 'आपकी यात्रा शुरू करें - पहला कार्य पूरा करें!'
              : 'Start your journey - complete your first task!'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
