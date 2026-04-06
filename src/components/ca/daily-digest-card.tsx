/**
 * Daily Digest Card Component
 * 
 * Displays a current affairs article card with:
 * - Importance stars (1-5)
 * - Bilingual title (EN+HI toggle)
 * - Summary preview
 * - Syllabus tags (GS1, GS2, GS3, GS4, Essay)
 * - Read time, word count
 * - Source badge
 * - MCQ indicator
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Design: Saffron Scholar theme, mobile-first (360px)
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Clock, FileText, BookOpen, ExternalLink, ChevronRight } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface SyllabusTag {
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  relevanceScore: number;
}

interface Article {
  id: string;
  title: {
    en: string;
    hi: string;
  };
  summary: {
    en: string;
    hi: string;
  };
  url: string;
  imageUrl?: string;
  category: string;
  importance: number; // 1-5
  wordCount: number;
  readTimeMin: number;
  publishedAt: string;
  syllabus: SyllabusTag[];
  mcqCount: number;
}

interface DailyDigestCardProps {
  article: Article;
  showHindi?: boolean;
  onToggleLanguage?: () => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Importance Stars (1-5)
 */
function ImportanceStars({ importance }: { importance: number }) {
  return (
    <div className="flex items-center gap-1" title={`Importance: ${importance}/5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= importance
              ? 'fill-amber-500 text-amber-500'
              : 'fill-gray-200 text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Syllabus Subject Badge
 */
function SubjectBadge({ subject }: { subject: string }) {
  const colors: Record<string, string> = {
    GS1: 'bg-blue-100 text-blue-800 border-blue-300',
    GS2: 'bg-green-100 text-green-800 border-green-300',
    GS3: 'bg-orange-100 text-orange-800 border-orange-300',
    GS4: 'bg-purple-100 text-purple-800 border-purple-300',
    Essay: 'bg-pink-100 text-pink-800 border-pink-300',
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded border ${
        colors[subject] || 'bg-gray-100 text-gray-800 border-gray-300'
      }`}
    >
      {subject}
    </span>
  );
}

/**
 * Category Badge
 */
function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded bg-saffron-100 text-saffron-800 border border-saffron-300">
      {category}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyDigestCard({
  article,
  showHindi = false,
  onToggleLanguage,
}: DailyDigestCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const title = showHindi ? article.title.hi : article.title.en;
  const summary = showHindi ? article.summary.hi : article.summary.en;

  // Get top 3 syllabus tags by relevance
  const topSyllabusTags = article.syllabus
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          {/* Importance Stars + Category */}
          <div className="flex items-center gap-2">
            <ImportanceStars importance={article.importance} />
            <CategoryBadge category={article.category} />
          </div>

          {/* Language Toggle */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              title={showHindi ? 'Switch to English' : 'हिंदी में देखें'}
            >
              {showHindi ? 'EN' : 'HI'}
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-3 text-lg font-semibold text-gray-900 line-clamp-2">
          {title}
        </h3>

        {/* Syllabus Tags */}
        {topSyllabusTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topSyllabusTags.map((tag, index) => (
              <SubjectBadge key={index} subject={tag.subject} />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {summary}
        </p>

        {/* Meta Information */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {/* Read Time */}
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTimeMin} min read</span>
          </div>

          {/* Word Count */}
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{article.wordCount} words</span>
          </div>

          {/* MCQ Count */}
          {article.mcqCount > 0 && (
            <div className="flex items-center gap-1 text-saffron-600">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{article.mcqCount} MCQs</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Source */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-saffron-600 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Original Source</span>
          </a>

          {/* Read More Link */}
          <Link
            href={`/daily-digest/${article.id}`}
            className="flex items-center gap-1 text-sm font-medium text-saffron-600 hover:text-saffron-700 transition-colors"
          >
            <span>Read Full</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
          </Link>
        </div>
      </div>

      {/* Image (if available) */}
      {article.imageUrl && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title.en}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
    </article>
  );
}

// ============================================================================
// CARD GRID COMPONENT
// ============================================================================

interface DailyDigestGridProps {
  articles: Article[];
  showHindi?: boolean;
  onToggleLanguage?: () => void;
}

export function DailyDigestGrid({
  articles,
  showHindi = false,
  onToggleLanguage,
}: DailyDigestGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Articles Available
        </h3>
        <p className="text-gray-600">
          Check back later for today's current affairs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <DailyDigestCard
          key={article.id}
          article={article}
          showHindi={showHindi}
          onToggleLanguage={onToggleLanguage}
        />
      ))}
    </div>
  );
}

export default DailyDigestCard;
