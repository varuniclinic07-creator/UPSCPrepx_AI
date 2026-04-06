/**
 * Leaderboard Display Component
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Shows Top 10 users with rank, avatar, and XP
 * - Highlights current user's position
 * - Bilingual support
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, ArrowUp, ArrowDown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  xp: number;
  change?: number; // Rank change
}

interface LeaderboardDisplayProps {
  showHindi: boolean;
  currentUserId: string;
  data: LeaderboardEntry[];
}

export function LeaderboardDisplay({ showHindi, currentUserId, data }: LeaderboardDisplayProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-600 to-orange-600 px-4 py-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h3 className="text-lg font-bold">
              {showHindi ? 'लीडरबोर्ड' : 'Leaderboard'}
            </h3>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {showHindi ? 'इस सप्ताह' : 'This Week'}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {data.map((entry) => {
          const isMe = entry.userId === currentUserId;
          const isTop3 = entry.rank <= 3;
          
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 transition-all ${
                isMe ? 'bg-saffron-50 border-l-4 border-saffron-500' : 'hover:bg-gray-50'
              } ${isTop3 ? 'font-medium' : ''}`}
            >
              {/* Rank Badge */}
              <div className="w-8 flex justify-center">
                {entry.rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                {entry.rank === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                {entry.rank === 3 && <Medal className="w-6 h-6 text-amber-700" />}
                {entry.rank > 3 && <span className="text-gray-500 font-bold text-sm">#{entry.rank}</span>}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border border-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-600">
                  {entry.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm truncate ${isMe ? 'text-saffron-700 font-bold' : 'text-gray-800'}`}>
                    {entry.username}
                    {isMe && <span className="text-[10px] ml-1 text-saffron-500">(You)</span>}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{entry.xp.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">XP</p>
                </div>
                {entry.change && entry.change !== 0 && (
                  <div className={`flex items-center ${entry.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {entry.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span className="text-xs font-medium">{Math.abs(entry.change)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
