/**
 * AI Mentor Sidebar Component
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - Session navigation
 * - Quick goal view
 * - New session button
 */

'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Target, Calendar, ChevronLeft } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  last_message?: string;
  updated_at?: string;
}

interface SidebarProps {
  showHindi: boolean;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  currentSessionId: string | null;
}

export function MentorSidebar({ showHindi, onSelectSession, onNewSession, currentSessionId }: SidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', title: showHindi ? 'तैयारी रणनीति' : 'Preparation Strategy', last_message: 'Focus on GS2 this week' },
    { id: '2', title: showHindi ? 'कैरियर मार्गदर्शन' : 'Career Guidance', last_message: 'State services options...' },
  ]);

  return (
    <div className="flex flex-col h-full w-80 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          {showHindi ? 'सत्र' : 'Sessions'}
        </h2>
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-saffron-300 rounded-lg text-saffron-600 font-medium hover:bg-saffron-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showHindi ? 'नया सत्र शुरू करें' : 'Start New Session'}
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              currentSessionId === session.id
                ? 'bg-saffron-50 border border-saffron-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${currentSessionId === session.id ? 'bg-saffron-100 text-saffron-600' : 'bg-gray-100 text-gray-500'}`}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-saffron-900' : 'text-gray-900'}`}>
                  {session.title}
                </p>
                {session.last_message && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{session.last_message}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Goals Quick View */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-saffron-600" />
          <h3 className="text-sm font-bold text-gray-900">
            {showHindi ? 'आज के लक्ष्य' : 'Active Goals'}
          </h3>
        </div>
        <div className="space-y-2">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-800 mb-1">
              {showHindi ? 'GS2 के 5 मॉक टेस्ट' : '5 Mock Tests for GS2'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full w-[60%]" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">3/5 {showHindi ? 'पूर्ण' : 'done'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-800 mb-1">
              {showHindi ? 'करंट अफेयर्स रिविजन' : 'Current Affairs Revision'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full w-[40%]" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{showHindi ? 'आज बाकी' : 'Due today'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}