/**
 * AI Mentor Chat Page
 * 
 * Master Prompt v8.0 - Feature F10 (READ Mode)
 * - 24/7 AI mentor with context
 * - Goal tracking
 * - Bilingual support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, BookOpen, Target, Settings, ChevronRight } from 'lucide-react';
import { MentorChatWindow } from '@/components/mentor/chat-window';
import { MentorSidebar } from '@/components/mentor/sidebar';

export default function MentorChatPage() {
  const [showHindi, setShowHindi] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Check for active session or create default
    if (!sessionId) {
      // In production, fetch active session from API
    }
  }, [sessionId]);

  const handleSessionSelect = (id: string) => {
    setSessionId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleNewSession = () => {
    // Create new session via API
    setSessionId(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white`}>
        <MentorSidebar
          showHindi={showHindi}
          onSelectSession={handleSessionSelect}
          onNewSession={handleNewSession}
          currentSessionId={sessionId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-saffron-100 rounded-full">
                <MessageCircle className="w-5 h-5 text-saffron-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {showHindi ? 'AI मेंटर' : 'AI Mentor'}
                </h1>
                <p className="text-xs text-gray-500">
                  {showHindi ? 'आपकी सफलता का साथी' : 'Your companion for success'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setShowHindi(!showHindi)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>

            {/* Capabilities */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span>{showHindi ? 'पाठ्यक्रम ज्ञान' : 'Syllabus aware'}</span>
              <Target className="w-4 h-4 ml-2" />
              <span>{showHindi ? 'गोल्स ट्रैकिंग' : 'Goal tracking'}</span>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <MentorChatWindow
            showHindi={showHindi}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
}
