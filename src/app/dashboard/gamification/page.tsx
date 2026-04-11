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

interface UserStats {
  id: string;
  username: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  xp: number;
  change: number;
}

interface Badge {
  id: string;
  code: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string };
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function GamificationPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>('leaderboard');
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({ id: '', username: '', xp: 0, level: 0, rank: 0, streak: 0 });
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch leaderboard and user stats
        const lbRes = await fetch('/api/leaderboard');
        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          const entries: LeaderboardEntry[] = (lbJson.leaderboard || []).map((u: any, i: number) => ({
            rank: i + 1,
            userId: u.id,
            username: u.name || `User ${i + 1}`,
            xp: u.points || 0,
            change: 0,
          }));
          setLeaderboardData(entries);

          // Derive current user stats from leaderboard response
          const userRank = lbJson.userRank || 0;
          const currentUser = entries.find((_: LeaderboardEntry, i: number) => i + 1 === userRank);
          if (currentUser) {
            setUserStats({
              id: currentUser.userId,
              username: currentUser.username,
              xp: currentUser.xp,
              level: Math.floor(currentUser.xp / 500) + 1,
              rank: userRank,
              streak: 0,
            });
          }
        }

        // Fetch achievements/badges
        const badgeRes = await fetch('/api/achievements');
        if (badgeRes.ok) {
          const badgeJson = await badgeRes.json();
          setBadges(badgeJson.badges || badgeJson || []);
        }
      } catch (err) {
        console.error('Failed to fetch gamification data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with XP & Streak */}
      <header className="bg-gradient-to-br from-saffron-600 to-orange-700 text-white pb-16 pt-8">
        <div className="px-4 md:px-8">
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
              <div className="text-2xl font-bold">{userStats.xp.toLocaleString()}</div>
            </div>

            {/* Level Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-sm opacity-90">{showHindi ? 'स्तर' : 'Level'}</span>
              </div>
              <div className="text-2xl font-bold">Level {userStats.level}</div>
            </div>

            {/* Streak Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm opacity-90">{showHindi ? 'स्ट्रीक' : 'Streak'}</span>
              </div>
              <div className="text-2xl font-bold">{userStats.streak} {showHindi ? 'दिन' : 'Days'}</div>
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
                currentUserId={userStats.id}
                data={leaderboardData}
              />
            ) : (
              <AchievementGrid
                showHindi={showHindi}
                badges={badges}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}
