/**
 * AnswerCard Component
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Answer display with bilingual toggle
 * - Source citations
 * - Rating system (1-5 stars)
 * - Helpful/not helpful feedback
 * - Flag incorrect answers
 * - Follow-up questions suggestions
 * - Key points for revision
 * - Saffron theme design
 */

'use client';

import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, Copy, Check, BookOpen, Lightbulb, MessageCircle, Languages, ExternalLink } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnswerCardProps {
  answer: {
    text: string;
    textHi?: string;
    sources?: Array<{
      title: string;
      url?: string;
      type: string;
      relevanceScore: number;
    }>;
    followUpQuestions?: string[];
    keyPoints?: string[];
    wordCount?: number;
  };
  answerId?: string;
  onRate?: (rating: { rating?: number; isHelpful?: boolean; isFlagged?: boolean }) => Promise<void>;
  onFollowUp?: (question: string) => void;
  isLoading?: boolean;
  showHindi?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FOLLOW_UPS = 10;

// ============================================================================
// ANSWER CARD COMPONENT
// ============================================================================

export function AnswerCard({
  answer,
  answerId,
  onRate,
  onFollowUp,
  isLoading = false,
  showHindi = false,
}: AnswerCardProps) {
  // State
  const [showHindiAnswer, setShowHindiAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle copy
  const handleCopy = async () => {
    const text = showHindiAnswer && answer.textHi ? answer.textHi : answer.text;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle rating
  const handleRating = async (newRating: number) => {
    if (!onRate || !answerId) return;
    
    setRating(newRating);
    await onRate({ rating: newRating });
  };

  // Handle helpful
  const handleHelpful = async (helpful: boolean) => {
    if (!onRate || !answerId) return;
    
    setIsHelpful(helpful);
    await onRate({ isHelpful: helpful });
  };

  // Handle flag
  const handleFlag = async () => {
    if (!onRate || !answerId) return;
    
    const reason = prompt(
      showHindi
        ? 'कृपया कारण बताएं कि यह उत्तर क्यों गलत है:'
        : 'Please provide a reason why this answer is incorrect:'
    );
    
    if (reason) {
      setIsFlagged(true);
      await onRate({ isFlagged: true, flag_reason: reason });
    }
  };

  // Handle follow-up submit
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !onFollowUp) return;
    
    setIsSubmitting(true);
    try {
      await onFollowUp(followUpQuestion);
      setFollowUpQuestion('');
    } catch (err) {
      console.error('Follow-up failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current answer text
  const currentText = showHindiAnswer && answer.textHi ? answer.textHi : answer.text;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-saffron-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {showHindi ? 'AI उत्तर' : 'AI Answer'}
              </h3>
              <p className="text-white/80 text-sm">
                {answer.wordCount ? `${answer.wordCount} words` : ''}
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          {(answer.textHi || showHindi) && (
            <button
              onClick={() => setShowHindiAnswer(!showHindiAnswer)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm"
            >
              <Languages className="w-4 h-4" />
              {showHindiAnswer ? 'English' : 'हिंदी'}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ) : (
        <>
          {/* Answer Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {currentText}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={showHindi ? 'कॉपी करें' : 'Copy'}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? (showHindi ? 'कॉपी हुआ!' : 'Copied!') : ''}
              </button>
            </div>
          </div>

          {/* Key Points */}
          {answer.keyPoints && answer.keyPoints.length > 0 && (
            <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-2">
                    {showHindi ? 'मुख्य बिंदु' : 'Key Points for Revision'}
                  </h4>
                  <ul className="space-y-1">
                    {answer.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sources */}
          {answer.sources && answer.sources.length > 0 && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <div className="flex items-start gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {showHindi ? 'स्रोत' : 'Sources'}
                  </h4>
                  <div className="space-y-1">
                    {answer.sources.map((source, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
                        <span className="text-blue-600">{i + 1}.</span>
                        <span className="flex-1">{source.title}</span>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-xs text-blue-500">
                          {Math.round(source.relevanceScore * 100)}% relevant
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rating & Feedback */}
          {onRate && answerId && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="space-y-3">
                {/* Star Rating */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {showHindi ? 'रेटिंग दें' : 'Rate this answer'}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating && star <= rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helpful / Not Helpful */}
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-700">
                    {showHindi ? 'क्या यह मददगार था?' : 'Was this helpful?'}
                  </p>
                  <button
                    onClick={() => handleHelpful(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isHelpful === true
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {showHindi ? 'हाँ' : 'Yes'}
                  </button>
                  <button
                    onClick={() => handleHelpful(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isHelpful === false
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {showHindi ? 'नहीं' : 'No'}
                  </button>
                </div>

                {/* Flag */}
                <button
                  onClick={handleFlag}
                  disabled={isFlagged}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isFlagged
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  {isFlagged
                    ? showHindi ? 'फ्लैग किया गया' : 'Flagged'
                    : showHindi ? 'गलत उत्तर फ्लैग करें' : 'Flag incorrect answer'
                  }
                </button>
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {onFollowUp && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-start gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-saffron-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {showHindi ? 'अनुवर्ती प्रश्न पूछें' : 'Ask a Follow-up Question'}
                  </h4>
                  <form onSubmit={handleFollowUpSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder={
                        showHindi
                          ? 'अपना अनुवर्ती प्रश्न लिखें...'
                          : 'Type your follow-up question...'
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 text-sm"
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      disabled={!followUpQuestion.trim() || isSubmitting}
                      className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting
                        ? showHindi ? 'भेज रहे...' : 'Sending...'
                        : showHindi ? 'पूछें' : 'Ask'
                      }
                    </button>
                  </form>
                </div>
              </div>

              {/* Suggested Follow-ups */}
              {answer.followUpQuestions && answer.followUpQuestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">
                    {showHindi ? 'सुझाए गए प्रश्न:' : 'Suggested questions:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {answer.followUpQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setFollowUpQuestion(q);
                          onFollowUp(q);
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-saffron-500 hover:text-saffron-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
