/**
 * Mains Score Card Component
 * 
 * Displays 4-criteria scoring visualization with radar chart.
 * Shows Structure, Content, Analysis, Presentation scores.
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React from 'react';

interface MainsScoreCardProps {
  structure: number; // 0-10
  content: number; // 0-10
  analysis: number; // 0-10
  presentation: number; // 0-10
  overall: number; // 0-100
}

export function MainsScoreCard({
  structure,
  content,
  analysis,
  presentation,
  overall,
}: MainsScoreCardProps) {
  // Calculate average of 4 criteria
  const average = (structure + content + analysis + presentation) / 4;

  // Get grade based on overall percentage
  const getGrade = (percentage: number) => {
    if (percentage >= 80) return { grade: 'Excellent', color: 'text-green-600', bg: 'bg-green-500' };
    if (percentage >= 60) return { grade: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (percentage >= 40) return { grade: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    if (percentage >= 20) return { grade: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-500' };
    return { grade: 'Poor', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const gradeInfo = getGrade(overall);

  // Score bar component
  const ScoreBar = ({ label, score, icon, color }: { label: string; score: number; icon: string; color: string }) => (
    <div className="flex-1 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-gray-600 text-sm font-medium">{label}</span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full ${color} transition-all duration-500`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">0</span>
        <span className={`text-lg font-bold ${color.replace('bg-', 'text-')}`}>
          {score}/10
        </span>
        <span className="text-xs text-gray-500">10</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Overall Performance</h3>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${gradeInfo.color}`}>{overall}%</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${gradeInfo.bg}`}>
                {gradeInfo.grade}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm mb-1">Average Score</p>
            <p className="text-2xl font-bold text-gray-900">{average.toFixed(1)}/10</p>
          </div>
        </div>
      </div>

      {/* 4 Criteria Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreBar
          label="Structure"
          score={structure}
          icon="🏗️"
          color="bg-blue-500"
        />
        <ScoreBar
          label="Content"
          score={content}
          icon="📚"
          color="bg-green-500"
        />
        <ScoreBar
          label="Analysis"
          score={analysis}
          icon="🔍"
          color="bg-purple-500"
        />
        <ScoreBar
          label="Presentation"
          score={presentation}
          icon="✨"
          color="bg-orange-500"
        />
      </div>

      {/* Criteria Descriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">📊 What Each Criteria Means:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">🏗️ Structure:</span>
            <span className="text-gray-600">Introduction, body paragraphs, conclusion flow. Clear headings and logical organization.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">📚 Content:</span>
            <span className="text-gray-600">Factual accuracy, relevant examples, data, case studies, and constitutional articles.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">🔍 Analysis:</span>
            <span className="text-gray-600">Critical thinking, multiple perspectives, cause-effect relationships, balanced viewpoint.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">✨ Presentation:</span>
            <span className="text-gray-600">Clarity, language simplicity, grammar, spelling, word limit adherence, formatting.</span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-saffron-50 to-orange-50 rounded-xl border border-saffron-200 p-4">
        <h4 className="text-sm font-bold text-saffron-900 mb-2">💡 Quick Insights:</h4>
        <ul className="text-sm text-saffron-800 space-y-1.5">
          {structure >= 8 && (
            <li>✓ <strong>Excellent structure!</strong> Your introduction and conclusion are well-crafted.</li>
          )}
          {structure < 6 && (
            <li>→ <strong>Improve structure:</strong> Start with context, end with balanced conclusion.</li>
          )}
          {content >= 8 && (
            <li>✓ <strong>Rich content!</strong> Good use of examples and data.</li>
          )}
          {content < 6 && (
            <li>→ <strong>Add more content:</strong> Include relevant examples, articles, committee reports.</li>
          )}
          {analysis >= 8 && (
            <li>✓ <strong>Strong analysis!</strong> You show critical thinking and multiple perspectives.</li>
          )}
          {analysis < 6 && (
            <li>→ <strong>Deepen analysis:</strong> Discuss both sides, add cause-effect relationships.</li>
          )}
          {presentation >= 8 && (
            <li>✓ <strong>Great presentation!</strong> Clear, concise, and well-formatted.</li>
          )}
          {presentation < 6 && (
            <li>→ <strong>Improve presentation:</strong> Use shorter sentences, add headings, check word limit.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
