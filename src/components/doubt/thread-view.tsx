/**
 * ThreadView Component
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Conversation thread display
 * - Multiple Q&A exchanges
 * - Follow-up questions
 * - Thread metadata
 * - Export thread
 * - Print functionality
 * - Saffron theme design
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { AnswerCard } from './answer-card';
import { MessageSquare, Clock, Calendar, User, Download, Printer, ChevronDown, ChevronUp, Archive } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ThreadViewProps {
  thread: {
    id: string;
    title: { en: string; hi?: string };
    subject: string;
    topic?: string;
    createdAt: string;
    updatedAt: string;
    status: 'open' | 'resolved' | 'archived';
    question: {
      id: string;
      text: string;
      textHi?: string;
      attachments?: Array<{ type: 'image' | 'audio'; url: string }>;
      createdAt: string;
    };
    answers: Array<{
      id: string;
      text: string;
      textHi?: string;
      sources?: Array<{ title: string; url?: string; type: string; relevanceScore: number }>;
      followUpQuestions?: string[];
      keyPoints?: string[];
      wordCount?: number;
      createdAt: string;
      isFollowUp: boolean;
      followUpQuestion?: string;
    }>;
    rating?: {
      rating?: number;
      isHelpful?: boolean;
      isFlagged?: boolean;
    };
  };
  onRate?: (answerId: string, rating: { rating?: number; isHelpful?: boolean; isFlagged?: boolean }) => Promise<void>;
  onFollowUp?: (threadId: string, question: string) => Promise<void>;
  showHindi?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUBJECT_ICONS: Record<string, string> = {
  GS1: '📚',
  GS2: '⚖️',
  GS3: '💰',
  GS4: '🧭',
  Essay: '✍️',
  Optional: '🎯',
  CSAT: '📊',
  General: '💡',
};

// ============================================================================
// THREAD VIEW COMPONENT
// ============================================================================

export function ThreadView({
  thread,
  onRate,
  onFollowUp,
  showHindi = false,
}: ThreadViewProps) {
  // State
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({ 0: true });
  const [showHindiTitle, setShowHindiTitle] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Toggle answer expansion
  const toggleAnswer = useCallback((index: number) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  // Handle print
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    // Create printable content
    const content = `
${thread.title.en}
${thread.title.hi || ''}

Subject: ${thread.subject}
${thread.topic ? `Topic: ${thread.topic}` : ''}
Date: ${new Date(thread.createdAt).toLocaleDateString('en-IN')}

---

QUESTION:
${thread.question.text}
${thread.question.textHi || ''}

---

ANSWER:
${thread.answers[0]?.text || ''}
${thread.answers[0]?.textHi || ''}

${thread.answers[0]?.keyPoints ? `\nKEY POINTS:\n${thread.answers[0].keyPoints.map(p => `• ${p}`).join('\n')}` : ''}

${thread.answers[0]?.sources ? `\nSOURCES:\n${thread.answers[0].sources.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doubt-${thread.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [thread]);

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return showHindi ? 'हल किया गया' : 'Resolved';
      case 'archived':
        return showHindi ? 'आर्काइव्ड' : 'Archived';
      default:
        return showHindi ? 'खुला' : 'Open';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-saffron-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">
                  {showHindiTitle && thread.title.hi ? thread.title.hi : thread.title.en}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <span>{SUBJECT_ICONS[thread.subject] || '📖'}</span>
                    {thread.subject}
                  </span>
                  {thread.topic && (
                    <span className="flex items-center gap-1">
                      <span>•</span>
                      <span>{thread.topic}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {(thread.title.hi || showHindi) && (
                <button
                  onClick={() => setShowHindiTitle(!showHindiTitle)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm"
                >
                  {showHindiTitle ? 'English' : 'हिंदी'}
                </button>
              )}
              <button
                onClick={handleExport}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title={showHindi ? 'एक्सपोर्ट करें' : 'Export'}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                title={showHindi ? 'प्रिंट करें' : 'Print'}
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(thread.createdAt)}
              </span>
              {thread.updatedAt !== thread.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {showHindi ? 'अपडेटेड' : 'Updated'} {formatDate(thread.updatedAt)}
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(thread.status)}`}>
              {getStatusText(thread.status)}
            </span>
          </div>
        </div>

        {/* Original Question */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">
                {showHindi ? 'आपका प्रश्न:' : 'Your Question:'}
              </h3>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {thread.question.text}
              </p>
              {thread.question.textHi && showHindiTitle && (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mt-2 pt-2 border-t">
                  {thread.question.textHi}
                </p>
              )}

              {/* Attachments */}
              {thread.question.attachments && thread.question.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {showHindi ? 'अनुलग्नक:' : 'Attachments:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {thread.question.attachments.map((att, i) => (
                      <div key={i} className="relative">
                        {att.type === 'image' ? (
                          <img
                            src={att.url}
                            alt={`Attachment ${i + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-saffron-50 rounded-lg border flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-saffron-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-6">
        {thread.answers.map((answer, index) => (
          <div key={answer.id}>
            {/* Answer Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-saffron-100 rounded-full">
                  <MessageSquare className="w-4 h-4 text-saffron-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {answer.isFollowUp
                    ? showHindi ? `अनुवर्ती उत्तर ${index}` : `Follow-up Answer ${index}`
                    : showHindi ? 'मुख्य उत्तर' : 'Main Answer'
                  }
                </span>
              </div>
              {thread.answers.length > 1 && (
                <button
                  onClick={() => toggleAnswer(index)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-saffron-600 transition-colors"
                >
                  {expandedAnswers[index] ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      {showHindi ? 'छुपाएं' : 'Hide'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      {showHindi ? 'दिखाएं' : 'Show'}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Answer Card */}
            {expandedAnswers[index] !== false && (
              <AnswerCard
                answer={{
                  text: answer.text,
                  textHi: answer.textHi,
                  sources: answer.sources,
                  followUpQuestions: answer.followUpQuestions,
                  keyPoints: answer.keyPoints,
                  wordCount: answer.wordCount,
                }}
                answerId={answer.id}
                onRate={onRate ? (rating) => onRate(answer.id, rating) : undefined}
                onFollowUp={onFollowUp ? (question) => onFollowUp(thread.id, question) : undefined}
                showHindi={showHindi}
              />
            )}
          </div>
        ))}
      </div>

      {/* Thread Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {showHindi
                ? `कुल ${thread.answers.length} उत्तर`
                : `Total ${thread.answers.length} answer${thread.answers.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              {thread.rating?.isHelpful
                ? showHindi ? '✓ मददगार' : '✓ Helpful'
                : thread.rating?.rating
                ? `${thread.rating.rating}/5 ★`
                : showHindi ? 'रेटिंग दें' : 'Rate this thread'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      {isPrinting && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .thread-view-printable,
            .thread-view-printable * {
              visibility: visible;
            }
            .thread-view-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
      )}
    </div>
  );
}
