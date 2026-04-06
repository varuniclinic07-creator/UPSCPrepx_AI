/**
 * Word Counter - User Content Studio (Feature F4)
 * 
 * Real-time word and character count display
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - Word count display
 * - Character count display
 * - Progress bar toward word limit
 * - Color-coded warnings
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React from 'react';
import { FileText, Hash, AlertTriangle, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface WordCounterProps {
  wordCount: number;
  characterCount: number;
  wordLimit?: number;
  showHindi?: boolean;
  compact?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WordCounter({
  wordCount,
  characterCount,
  wordLimit = 1000,
  showHindi = false,
  compact = false,
}: WordCounterProps): JSX.Element {
  // Calculate percentage
  const percentage = Math.min((wordCount / wordLimit) * 100, 100);
  const isOverLimit = wordCount > wordLimit;
  const isNearLimit = percentage >= 80 && !isOverLimit;
  const isSafe = percentage < 80;

  // Determine color based on status
  const getStatusColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (isNearLimit) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-saffron-500';
  };

  const getIcon = () => {
    if (isOverLimit) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (isSafe && wordCount > 0) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  // Translations
  const t = {
    words: showHindi ? 'शब्द' : 'Words',
    characters: showHindi ? 'वर्ण' : 'Characters',
    limit: showHindi ? 'सीमा' : 'Limit',
    remaining: showHindi ? 'शेष' : 'Remaining',
    overLimit: showHindi ? 'सीमा पार हो गई' : 'Over limit',
    of: showHindi ? 'का' : 'of',
  };

  const remaining = Math.max(0, wordLimit - wordCount);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-sm ${getStatusColor()}`}>
        {getIcon()}
        <div className="flex items-center gap-1">
          <span className="font-semibold">{wordCount}</span>
          <span className="text-gray-500">/</span>
          <span>{wordLimit}</span>
          <span className="text-gray-500">{t.words}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Hash className="w-3 h-3" />
          <span>{characterCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        {/* Word count */}
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getIcon()}
          <div>
            <span className="text-lg font-bold">{wordCount}</span>
            <span className="text-sm text-gray-500 ml-1">{t.words}</span>
          </div>
        </div>

        {/* Character count */}
        <div className="flex items-center gap-2 text-gray-600">
          <Hash className="w-4 h-4" />
          <div>
            <span className="text-lg font-semibold">{characterCount}</span>
            <span className="text-sm text-gray-500 ml-1">{t.characters}</span>
          </div>
        </div>

        {/* Remaining */}
        {!isOverLimit && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4" />
            <div>
              <span className="text-lg font-semibold">{remaining}</span>
              <span className="text-sm text-gray-500 ml-1">{t.remaining}</span>
            </div>
          </div>
        )}

        {/* Over limit warning */}
        {isOverLimit && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">{t.overLimit}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span className={getStatusColor()}>
            {Math.round(percentage)}% {t.of} {wordLimit}
          </span>
          <span>{wordLimit}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENHANCED VERSION WITH TIME ESTIMATE
// ============================================================================

export interface EnhancedWordCounterProps extends WordCounterProps {
  showReadTime?: boolean;
  showWriteTime?: boolean;
}

export function EnhancedWordCounter({
  wordCount,
  characterCount,
  wordLimit = 1000,
  showHindi = false,
  showReadTime = false,
  showWriteTime = false,
}: EnhancedWordCounterProps): JSX.Element {
  // Calculate reading time (200 words per minute)
  const readTimeMinutes = Math.ceil(wordCount / 200);
  const readTimeText = showHindi
    ? `${readTimeMinutes} मिनट का पठन`
    : `${readTimeMinutes} min read`;

  // Calculate writing time (30 words per minute)
  const writeTimeMinutes = Math.ceil(wordCount / 30);
  const writeTimeText = showHindi
    ? `${writeTimeMinutes} मिनट का लेखन`
    : `${writeTimeMinutes} min write`;

  return (
    <div className="space-y-3">
      {/* Basic counter */}
      <WordCounter
        wordCount={wordCount}
        characterCount={characterCount}
        wordLimit={wordLimit}
        showHindi={showHindi}
      />

      {/* Time estimates */}
      {(showReadTime || showWriteTime) && wordCount > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {showReadTime && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{readTimeText}</span>
            </div>
          )}
          {showWriteTime && (
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{writeTimeText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINI VERSION FOR TOOLBAR
// ============================================================================

export interface MiniWordCounterProps {
  wordCount: number;
  wordLimit?: number;
  showHindi?: boolean;
}

export function MiniWordCounter({
  wordCount,
  wordLimit = 1000,
  showHindi = false,
}: MiniWordCounterProps): JSX.Element {
  const percentage = (wordCount / wordLimit) * 100;
  const isOverLimit = wordCount > wordLimit;

  return (
    <div className={`text-xs font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
      {wordCount} / {wordLimit}
      {showHindi ? ' शब्द' : ' words'}
      {percentage >= 90 && (
        <span className="ml-2 text-amber-600">⚠️</span>
      )}
    </div>
  );
}
