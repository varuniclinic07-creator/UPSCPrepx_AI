/**
 * Gamification Dashboard Page
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Main hub for XP, Leaderboard, and Achievements
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Award, Crown, TrendingUp, Flame } from 'lucide-react';
import { LeaderboardDisplay } from '@/components/gamification/leaderboard-display';
import { AchievementGrid } from '@/components/gamification/achievement-grid';

// TODO: Replace with real API calls to services
const MOCK_USER = {
  id: 'user-1',
  username: 'Rahul_99',
  xp: 1250,
  level: 3,
  rank: 42,
  streak: 7
};

export default function GamificationPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>('leaderboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with XP & Streak */}
      <header className="bg-gradient-to-br from-saffron-600 to-orange-700 text-white pb-16 pt-8">n        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {showHindi ? 'गतिविधि केंद्र' : 'Activity Center'}
            </h1>
            <button
              onClick={() => setShowHindi(!showHindi)}
              className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/30 transition-colors"
            >
              {showHindi ? 'EN' : 'हिंदी'}
            </button>
          </div>

          {/* User Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* XP Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm opacity-90">{showHindi ? 'कुल XP' : 'Total XP'}</span>
              </div>
              <div className="text-2xl font-bold">1,250</div>
            </div>

            {/* Level Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-sm opacity-90">{showHindi ? 'स्तर' : 'Level'}</span>
              </div>
              <div className="text-2xl font-bold">Level 3</div>
            </div>

            {/* Streak Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm opacity-90">{showHindi ? 'स्ट्रीक' : 'Streak'}</span>
              </div>
              <div className="text-2xl font-bold">7 {showHindi ? 'दिन' : 'Days'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Overlapping Header */}
      <main className="flex-1 -mt-12 px-4 md:px-8 relative z-10 pb-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white rounded-lg border border-gray-200 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'leaderboard' 
                ? 'bg-saffron-500 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {showHindi ? 'लीडरबोर्ड' : 'Leaderboard'}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'achievements' 
                ? 'bg-saffron-500 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {showHindi ? 'उपलब्धियां' : 'Achievements'}
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ) : (
            activeTab === 'leaderboard' ? (
              <LeaderboardDisplay
                showHindi={showHindi}
                currentUserId={MOCK_USER.id}
                data={[
                  { rank: 1, userId: 'u1', username: 'Anjali_Topper', xp: 5400, change: 2 },
                  { rank: 2, userId: 'u2', username: 'Vikram_12', xp: 4900, change: -1 },
                  { rank: 3, userId: 'u3', username: 'Soni_Study', xp: 4100, change: 0 },
                  { rank: 4, userId: 'u4', username: 'Deepak_99', xp: 3500, change: 5 },
                  { rank: 42, userId: 'user-1', username: 'Rahul_99', xp: 1250, change: 1 },
                ]}
              />
            ) : (
              <AchievementGrid
                showHindi={showHindi}
                badges={[
                  { id: '1', code: 'FIRST_LOGIN', name: { en: 'Welcome', hi: 'स्वागत' }, description: { en: 'Logged in', hi: 'लॉगिन किया' }, icon: '👋', unlocked: true, unlockedAt: '2025-10-01' },
                  { id: '2', code: 'STREAK_7', name: { en: 'Week Warrior', hi: 'सप्ताह योद्धा' }, description: { en: '7 day streak', hi: '7 दिन स्ट्रीक' }, icon: '🔥', unlocked: true, unlockedAt: '2025-11-01' },
                  { id: '3', code: 'MCQ_100', name: { en: 'Sharpshooter', hi: 'शार्पशूटर' }, description: { en: '100 MCQs', hi: '100 MCQs' }, icon: '🎯', unlocked: false },
                  { id: '4', code: 'TOP_10', name: { en: 'Top 10', hi: 'शीर्ष 10' }, description: { en: 'Top 10 rank', hi: 'शीर्ष 10 रैंक' }, icon: '🏆', unlocked: false },
                ]}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}
