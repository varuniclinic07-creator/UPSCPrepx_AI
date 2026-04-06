/**
 * Syllabus Tags Component
 * 
 * Displays UPSC syllabus subject badges with:
 * - Color-coded subjects (GS1, GS2, GS3, GS4, Essay)
 * - Topic names with relevance scores
 * - Clickable filtering
 * - Bilingual labels (EN+HI)
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Design: Saffron Scholar theme, mobile-first (360px)
 */

'use client';

import React from 'react';
import { BookOpen, Target, TrendingUp } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SyllabusTag {
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay';
  topic: string;
  topicHindi?: string;
  relevanceScore: number; // 0-100
}

interface SyllabusTagsProps {
  tags: SyllabusTag[];
  showHindi?: boolean;
  onTagClick?: (subject: string) => void;
  maxTags?: number;
  showRelevance?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUBJECT_CONFIG: Record<string, {
  label: string;
  labelHindi: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  GS1: {
    label: 'GS1',
    labelHindi: 'सामान्य अध्ययन 1',
    color: 'text-blue-800',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    icon: <BookOpen className="w-3 h-3" />,
  },
  GS2: {
    label: 'GS2',
    labelHindi: 'सामान्य अध्ययन 2',
    color: 'text-green-800',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    icon: <Target className="w-3 h-3" />,
  },
  GS3: {
    label: 'GS3',
    labelHindi: 'सामान्य अध्ययन 3',
    color: 'text-orange-800',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: <TrendingUp className="w-3 h-3" />,
  },
  GS4: {
    label: 'GS4',
    labelHindi: 'सामान्य अध्ययन 4',
    color: 'text-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    icon: <BookOpen className="w-3 h-3" />,
  },
  Essay: {
    label: 'Essay',
    labelHindi: 'निबंध',
    color: 'text-pink-800',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    icon: <BookOpen className="w-3 h-3" />,
  },
};

// ============================================================================
// RELEVANCE BADGE COMPONENT
// ============================================================================

interface RelevanceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function RelevanceBadge({ score, size = 'sm' }: RelevanceBadgeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1',
  };

  return (
    <span className={`${sizeClasses[size]} ${getColor(score)} rounded font-medium`}>
      {getLabel(score)} ({score}%)
    </span>
  );
}

// ============================================================================
// SINGLE TAG COMPONENT
// ============================================================================

interface SyllabusTagItemProps {
  tag: SyllabusTag;
  showHindi?: boolean;
  onClick?: () => void;
  showRelevance?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function SyllabusTagItem({
  tag,
  showHindi = false,
  onClick,
  showRelevance = true,
  size = 'md',
}: SyllabusTagItemProps) {
  const config = SUBJECT_CONFIG[tag.subject];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-lg border ${config.bgColor} ${config.borderColor}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
    >
      {/* Subject Icon + Label */}
      <div className={`flex items-center gap-1.5 ${config.color}`}>
        {config.icon}
        <span className="font-semibold">
          {showHindi && config.labelHindi ? config.labelHindi : config.label}
        </span>
      </div>

      {/* Divider */}
      <span className={`w-px h-4 ${config.borderColor}`} />

      {/* Topic */}
      <span className="text-gray-700">
        {showHindi && tag.topicHindi ? tag.topicHindi : tag.topic}
      </span>

      {/* Relevance Score */}
      {showRelevance && (
        <RelevanceBadge score={tag.relevanceScore} size={size} />
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SyllabusTags({
  tags,
  showHindi = false,
  onTagClick,
  maxTags = 5,
  showRelevance = true,
  size = 'md',
}: SyllabusTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Sort by relevance score (highest first)
  const sortedTags = [...tags].sort((a, b) => 
    b.relevanceScore - a.relevanceScore
  );

  // Limit displayed tags
  const displayedTags = sortedTags.slice(0, maxTags);
  const remainingCount = sortedTags.length - maxTags;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <BookOpen className="w-3.5 h-3.5" />
        <span>
          {showHindi ? 'पाठ्यक्रम से संबंधित' : 'Syllabus Mapping'}
          {tags.length > 0 && ` (${tags.length} topics)`}
        </span>
      </div>

      {/* Tags Grid */}
      <div className="flex flex-wrap gap-2">
        {displayedTags.map((tag, index) => (
          <SyllabusTagItem
            key={index}
            tag={tag}
            showHindi={showHindi}
            onClick={() => onTagClick?.(tag.subject)}
            showRelevance={showRelevance}
            size={size}
          />
        ))}

        {/* Remaining Count */}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg">
            +{remainingCount} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

interface SyllabusFilterBarProps {
  selectedSubject?: string | null;
  onSubjectSelect?: (subject: string | null) => void;
  showHindi?: boolean;
  className?: string;
}

export function SyllabusFilterBar({
  selectedSubject,
  onSubjectSelect,
  showHindi = false,
  className = '',
}: SyllabusFilterBarProps) {
  const subjects: Array<'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay'> = 
    ['GS1', 'GS2', 'GS3', 'GS4', 'Essay'];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* All Subjects Button */}
      <button
        onClick={() => onSubjectSelect?.(null)}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
          ${
            selectedSubject === null
              ? 'bg-saffron-600 text-white border-saffron-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        {showHindi ? 'सभी' : 'All'}
      </button>

      {/* Subject Filters */}
      {subjects.map((subject) => {
        const config = SUBJECT_CONFIG[subject];
        const isSelected = selectedSubject === subject;

        return (
          <button
            key={subject}
            onClick={() => onSubjectSelect?.(subject)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
              ${config.bgColor} ${config.borderColor}
              ${
                isSelected
                  ? `${config.color} ring-2 ring-offset-1 ring-${config.color.split('-')[1]}-400`
                  : `${config.color} hover:shadow-sm`
              }
            `}
          >
            {showHindi ? config.labelHindi : config.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SUBJECT DISTRIBUTION COMPONENT
// ============================================================================

interface SubjectDistributionProps {
  distribution: {
    GS1: number;
    GS2: number;
    GS3: number;
    GS4: number;
    Essay: number;
  };
  showHindi?: boolean;
}

export function SubjectDistribution({
  distribution,
  showHindi = false,
}: SubjectDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          {showHindi ? 'विषय वितरण' : 'Subject Distribution'}
        </h4>
        <span className="text-xs text-gray-500">({total} articles)</span>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-2">
        {Object.entries(distribution).map(([subject, count]) => {
          if (count === 0) return null;
          
          const config = SUBJECT_CONFIG[subject];
          const percentage = Math.round((count / total) * 100);

          return (
            <div key={subject} className="flex items-center gap-3">
              {/* Subject Label */}
              <span className={`text-xs font-medium w-16 ${config.color}`}>
                {showHindi ? config.labelHindi : config.label}
              </span>

              {/* Progress Bar */}
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.bgColor.replace('50', '500')}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <span className="text-xs text-gray-600 w-8 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SyllabusTags;
