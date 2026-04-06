/**
 * Flashcard Review Component
 * 
 * Master Prompt v8.0 - Feature F14 (READ Mode)
 * - Interactive card for active recall
 * - Reveal answer and rate memory (SM-2)
 * - Bilingual support
 */

'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, Star } from 'lucide-react';

interface BookmarkData {
  id: string;
  content: string; // The text/snipet
  front_content?: string; // Optional question
  back_content?: string;  // Optional details/answer
  source_type: string;
  context_url?: string;
}

interface FlashcardProps {
  bookmark: BookmarkData;
  currentIndex: number;
  totalCount: number;
  showHindi: boolean;
  onRate: (quality: number) => void; // 0-5 scale
}

export function Flashcard({ bookmark, currentIndex, totalCount, showHindi, onRate }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const displayFront = bookmark.front_content || bookmark.content.substring(0, 100) + '...';
  const displayBack = bookmark.back_content || bookmark.content;

  if (!bookmark) return null;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      {/* Progress Header */}
      <div className="mb-4 text-center">
        <div className="text-xs font-semibold text-saffron-600 uppercase tracking-wide">
          {showHindi ? 'कार्ड रिव्यू' : 'Card Review'}
        </div>
        <div className="text-2xl font-bold text-gray-800 mt-1">
          {currentIndex + 1} <span className="text-gray-400 text-lg">/ {totalCount}</span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
          <div 
            className="bg-saffron-500 h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 perspective-1000 group cursor-pointer" onClick={() => !isRevealed && setIsRevealed(true)}>
        <div className={`relative w-full h-full transition-all duration-500 transform shadow-xl rounded-2xl overflow-hidden ${isRevealed ? '' : 'hover:scale-[1.02]'}`}>
          
          {/* Content Area */}
          <div className="bg-white p-8 flex flex-col items-center justify-center text-center h-full border border-gray-200">
             
             {/* Source Tag */}
            <span className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded">
              {bookmark.source_type}
            </span>

            {/* Front / Question */}
            <div className={`transition-opacity duration-300 ${isRevealed ? 'opacity-20 h-0 overflow-hidden' : 'opacity-100'}`}>
              <h3 className="text-2xl font-medium text-gray-800 mb-6 leading-relaxed">
                {displayFront}
              </h3>
              <p className="text-sm text-saffron-500 font-medium animate-pulse">
                {showHindi ? 'उत्तर देखने के लिए टैप करें' : 'Tap to reveal answer'}
              </p>
            </div>

            {/* Back / Answer (Overlay) */}
            <div className={`absolute inset-0 bg-gradient-to-br from-saffron-50 to-white p-8 flex-col items-center justify-center transition-opacity duration-300 ${isRevealed ? 'flex opacity-100' : 'hidden opacity-0'}`}>
              <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {displayBack}
                </p>
                {/* Context Link if available */}
                {bookmark.context_url && (
                  <a 
                    href={bookmark.context_url} 
                    target="_blank" 
                    className="text-xs text-saffron-600 hover:underline mt-4 inline-block flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookOpen className="w-3 h-3" /> {showHindi ? 'संदर्भ देखें' : 'View Source'}
                  </a>
                )}
              </div>
              
              {/* Rating Buttons */}
              <div className="w-full mt-4 pt-4 border-t border-saffron-100 grid grid-cols-4 gap-2">
                <button onClick={(e) => { e.stopPropagation(); onRate(0); }} className="flex flex-col items-center p-2 rounded-lg hover:bg-red-50 transition-colors group">
                  <XCircle className="w-5 h-5 text-red-400 group-hover:text-red-600 mb-1" />
                  <span className="text-xs font-medium text-gray-500">{showHindi ? 'फिर से' : 'Again'}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRate(3); }} className="flex flex-col items-center p-2 rounded-lg hover:bg-orange-50 transition-colors group">
                  <AlertTriangle className="w-5 h-5 text-orange-400 group-hover:text-orange-600 mb-1" />
                  <span className="text-xs font-medium text-gray-500">{showHindi ? 'कठिन' : 'Hard'}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRate(4); }} className="flex flex-col items-center p-2 rounded-lg hover:bg-green-50 transition-colors group">
                  <CheckCircle className="w-5 h-5 text-green-400 group-hover:text-green-600 mb-1" />
                  <span className="text-xs font-medium text-gray-500">{showHindi ? 'सही' : 'Good'}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRate(5); }} className="flex flex-col items-center p-2 rounded-lg hover:bg-blue-50 transition-colors group">
                  <Star className="w-5 h-5 text-blue-400 group-hover:text-blue-600 mb-1" />
                  <span className="text-xs font-medium text-gray-500">{showHindi ? 'आसान' : 'Easy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
