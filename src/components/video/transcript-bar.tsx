/**
 * Transcript Bar Component
 * 
 * Master Prompt v8.0 - Feature F16 (WATCH Mode)
 * - Scrolling list of timestamped transcript segments
 * - Highlights active segment based on current time
 * - Click to seek video
 * - Bilingual support
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Search, Bookmark, ChevronRight } from 'lucide-react';

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptBarProps {
  segments: Segment[];
  currentTime: number;
  onSeek: (time: number) => void;
  showHindi?: boolean;
  isCollapsed: boolean;
}

export function TranscriptBar({ segments, currentTime, onSeek, showHindi = false, isCollapsed }: TranscriptBarProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  if (isCollapsed) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeIndex = segments.findIndex(s => currentTime >= s.start && currentTime < s.end);

  return (
    <div className="bg-white border-l border-gray-200 h-full flex flex-col w-80 flex-shrink-0">
      {/* Header */
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          {showHindi ? 'प्रतिलेख' : 'Transcript'}
        </h3>
        <div className="flex gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {segments.map((seg, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              ref={isActive ? activeRef : null}
              onClick={() => onSeek(seg.start)}
              className={`group p-2 rounded-lg cursor-pointer border transition-all ${
                isActive 
                  ? 'bg-saffron-50 border-saffron-300 shadow-sm' 
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-mono font-medium ${isActive ? 'text-saffron-700' : 'text-gray-500'}`}>
                  {formatTime(seg.start)}
                </span>
                {isActive && (
                  <div className="flex gap-1 text-[10px] text-saffron-600".
                    <span className="hover:bg-saffron-200 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1">
                      <Bookmark className="w-3 h-3"/> {showHindi ? 'Note' : 'Add Note'}
                    </span>
                  </div>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${isActive ? 'text-saffron-900 font-medium' : 'text-gray-600'}`}>
                {seg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
