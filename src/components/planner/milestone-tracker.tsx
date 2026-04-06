/**
 * Milestone Tracker Component
 * 
 * Master Prompt v8.0 - Feature F8 (READ Mode)
 * - Progress bars for milestones
 * - Celebration animations
 * - Bilingual support
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Milestone {
  id: string;
  type: string;
  title: { en: string; hi: string };
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercentage: number;
  isAchieved: boolean;
  achievedAt: string | null;
  estimatedDate: string | null;
}

interface MilestoneTrackerProps {
  showHindi: boolean;
  planId?: string;
  onMilestoneClick?: (milestone: Milestone) => void;
}

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  syllabus_25: <Star className="w-5 h-5" />,
  syllabus_50: <Star className="w-5 h-5" />,
  syllabus_75: <Star className="w-5 h-5" />,
  syllabus_100: <Trophy className="w-5 h-5" />,
  mock_5: <Target className="w-5 h-5" />,
  mock_10: <Target className="w-5 h-5" />,
  mock_20: <Trophy className="w-5 h-5" />,
  revision_1: <Sparkles className="w-5 h-5" />,
  revision_2: <Sparkles className="w-5 h-5" />,
  revision_3: <Trophy className="w-5 h-5" />,
};

const MILESTONE_COLORS: Record<string, string> = {
  syllabus_25: 'from-green-500 to-emerald-500',
  syllabus_50: 'from-blue-500 to-cyan-500',
  syllabus_75: 'from-purple-500 to-violet-500',
  syllabus_100: 'from-yellow-500 to-amber-500',
  mock_5: 'from-green-500 to-teal-500',
  mock_10: 'from-blue-500 to-indigo-500',
  mock_20: 'from-orange-500 to-red-500',
  revision_1: 'from-cyan-500 to-blue-500',
  revision_2: 'from-violet-500 to-purple-500',
  revision_3: 'from-amber-500 to-yellow-500',
};

export function MilestoneTracker({ showHindi, planId, onMilestoneClick }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, [planId]);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const url = `/api/planner/milestones${planId ? `?plan_id=${planId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMilestones(data.data.allMilestones || []);
      }
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const achievementGroups = {
    syllabus: milestones.filter((m) => m.type.startsWith('syllabus_')),
    mocks: milestones.filter((m) => m.type.startsWith('mock_')),
    revision: milestones.filter((m) => m.type.startsWith('revision_')),
  };

  const renderMilestone = (milestone: Milestone) => {
    const isExpanded = expandedId === milestone.id;
    const colorClass = MILESTONE_COLORS[milestone.type] || 'from-saffron-500 to-orange-500';
    const icon = MILESTONE_ICONS[milestone.type] || <Star className="w-5 h-5" />;

    return (
      <div
        key={milestone.id}
        onClick={() => {
          setExpandedId(isExpanded ? null : milestone.id);
          onMilestoneClick?.(milestone);
        }}
        className={`p-3 rounded-lg border transition-all cursor-pointer ${
          milestone.isAchieved
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-white border-gray-200 hover:border-saffron-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              milestone.isAchieved
                ? `bg-gradient-to-r ${colorClass} text-white`
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {milestone.isAchieved ? <CheckCircle2 className="w-5 h-5" /> : icon}
          </div>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`text-sm font-medium truncate ${
                milestone.isAchieved ? 'text-green-700' : 'text-gray-900'
              }`}>
                {milestone.title[showHindi ? 'hi' : 'en'] || milestone.title.en}
              </h4>
              <span className={`text-xs font-medium ${
                milestone.isAchieved ? 'text-green-600' : 'text-saffron-600'
              }`}>
                {milestone.progressPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  milestone.isAchieved
                    ? 'bg-green-500'
                    : `bg-gradient-to-r ${colorClass}`
                }`}
                style={{ width: `${Math.min(milestone.progressPercentage, 100)}%` }}
              />
            </div>

            {/* Details */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {milestone.currentValue}/{milestone.targetValue} {milestone.unit}
              </span>
              {milestone.estimatedDate && !milestone.isAchieved && (
                <span className="text-xs text-gray-400">
                  {showHindi ? 'अनुमानित:' : 'ETA:'} {new Date(milestone.estimatedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && milestone.isAchieved && milestone.achievedAt && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Sparkles className="w-4 h-4" />
              <span>
                {showHindi ? 'प्राप्त किया:' : 'Achieved:'}{' '}
                {new Date(milestone.achievedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (title: { en: string; hi: string }, items: Milestone[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {title[showHindi ? 'hi' : 'en']}
        </h3>
        <div className="space-y-2">
          {items.map(renderMilestone)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-saffron-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'मील के पत्थर' : 'Milestones'}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {showHindi ? 'कोई मील का पत्थर नहीं मिला' : 'No milestones found'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {showHindi ? 'एक अध्ययन योजना बनाएं शुरू करने के लिए' : 'Create a study plan to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Syllabus Milestones */}
            {renderGroup(
              { en: '📚 Syllabus Coverage', hi: '📚 पाठ्यक्रम कवरेज' },
              achievementGroups.syllabus
            )}

            {/* Mock Test Milestones */}
            {renderGroup(
              { en: '📝 Mock Tests', hi: '📝 मॉक टेस्ट' },
              achievementGroups.mocks
            )}

            {/* Revision Milestones */}
            {renderGroup(
              { en: '🔄 Revision Rounds', hi: '🔄 रिविजन राउंड' },
              achievementGroups.revision
            )}
          </>
        )}
      </div>
    </div>
  );
}
