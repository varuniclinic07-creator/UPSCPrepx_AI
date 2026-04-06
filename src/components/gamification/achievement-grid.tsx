/**
 * Achievement Display Component
 * 
 * Master Prompt v8.0 - Feature F13 (READ Mode)
 * - Shows unlocked badges in a grid
 * - Highlights recent unlocks
 * - Tooltip hover for details
 */

import React from 'react';
import { Badge, Star, Lock, Check } from 'lucide-react';

interface Badge {
  id: string;
  code: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string };
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementGridProps {
  showHindi: boolean;
  badges: Badge[];
}

export function AchievementGrid({ showHindi, badges }: AchievementGridProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Badge className="w-5 h-5 text-saffron-600" />
        <h3 className="text-lg font-bold">
          {showHindi ? 'उपलब्धियां' : 'Achievements'}
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {badges.map((b) => {
          const isUnlocked = b.unlocked;
          return (
            <div
              key={b.id || b.code}
              className={`relative flex flex-col items-center group cursor-pointer p-2 rounded-lg transition-transform hover:scale-105 ${
                isUnlocked ? 'bg-saffron-50 border border-saffron-200' : 'bg-gray-50 border border-gray-200 opacity-60'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                isUnlocked ? 'bg-saffron-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}>
                {isUnlocked ? <Star className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              
              {/* Name */}
              <p className="text-[11px] font-medium text-center leading-tight line-clamp-2">
                {b.name[showHindi ? 'hi' : 'en']}
              </p>

              {/* Checkmark for unlocked */}
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 text-white shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}

              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <p className="font-bold mb-1">{b.name[showHindi ? 'hi' : 'en']}</p>
                <p className="text-gray-300 leading-snug">
                  {b.description[showHindi ? 'hi' : 'en']}
                </p>
                {b.unlockedAt && (
                  <p className="mt-1 text-[10px] text-saffron-400">
                    {showHindi ? 'अनलॉक:' : 'Unlocked:'} {new Date(b.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}