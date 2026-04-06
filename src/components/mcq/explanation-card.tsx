/**
 * MCQ Explanation Card Component
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Answer explanation display
 * - Bilingual support (EN+HI)
 * - Key points breakdown
 * - Related concepts
 * - Source references
 * - Copy functionality
 */

'use client';

import React, { useState } from 'react';
import { BookOpen, Lightbulb, Link, Copy, Check, ExternalLink } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Explanation {
  correctOption: number;
  explanation: {
    en: string;
    hi: string;
  };
  keyPoints: Array<{
    en: string;
    hi: string;
  }>;
  relatedConcepts?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
  timeToReadSec?: number;
}

interface ExplanationCardProps {
  explanation: Explanation;
  showHindi: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExplanationCard({
  explanation,
  showHindi,
  isExpanded = true,
  onToggleExpand,
}: ExplanationCardProps) {
  const [copied, setCopied] = useState(false);

  const explanationText = showHindi ? explanation.explanation.hi : explanation.explanation.en;
  const keyPoints = explanation.keyPoints.map((kp) =>
    showHindi ? kp.hi : kp.en
  );

  const handleCopy = async () => {
    const textToCopy = `${explanationText}\n\nKey Points:\n${keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">
              {showHindi ? 'व्याख्या' : 'Explanation'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand/Collapse */}
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="text-white/80 hover:text-white text-sm font-medium"
              >
                {isExpanded ? (showHindi ? 'छोटा करें' : 'Collapse') : (showHindi ? 'पूरा देखें' : 'Expand')}
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title={showHindi ? 'कॉपी करें' : 'Copy'}
            >
              {copied ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Correct Answer Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
              {showHindi ? 'सही उत्तर' : 'Correct Answer'}: Option {String.fromCharCode(64 + explanation.correctOption)}
            </span>
          </div>

          {/* Main Explanation */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 leading-relaxed text-base">
              {explanationText}
            </p>
          </div>

          {/* Key Points */}
          {keyPoints.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-blue-900">
                  {showHindi ? 'मुख्य बिंदु' : 'Key Points'}
                </h4>
              </div>
              <ul className="space-y-2">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-blue-900 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Concepts */}
          {explanation.relatedConcepts && explanation.relatedConcepts.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-purple-900">
                  {showHindi ? 'संबंधित अवधारणाएँ' : 'Related Concepts'}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {explanation.relatedConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs font-medium text-purple-800"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {explanation.sources && explanation.sources.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-gray-600" />
                <h4 className="font-bold text-gray-900">
                  {showHindi ? 'स्रोत' : 'Sources'}
                </h4>
              </div>
              <ul className="space-y-2">
                {explanation.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-saffron-600 hover:text-saffron-700 transition-colors"
                    >
                      <span>{source.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reading Time */}
          {explanation.timeToReadSec && (
            <p className="text-xs text-gray-500 text-center">
              {showHindi
                ? `पढ़ने का समय: ~${explanation.timeToReadSec} सेकंड`
                : `Reading time: ~${explanation.timeToReadSec} seconds`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
