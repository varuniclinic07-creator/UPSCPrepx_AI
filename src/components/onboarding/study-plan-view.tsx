/**
 * Study Plan View Component - F1 Smart Onboarding Final Display
 * 
 * Displays AI-generated personalized study plan with strengths, weaknesses,
 * weekly schedule, and syllabus roadmap.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React from 'react';

export interface StrengthWeakness {
  subject: string;
  accuracy: number;
  level: 'strength' | 'moderate' | 'weakness';
  topics_mastered: string[];
  topics_need_work: string[];
}

export interface WeeklySchedule {
  day: string;
  day_hi: string;
  time_slots: Array<{
    time: string;
    activity: string;
    activity_hi: string;
    subject: string;
    duration_min: number;
  }>;
  total_hours: number;
}

export interface StudyPlan {
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
  weekly_schedule: WeeklySchedule[];
  recommended_resources: string[];
  milestone_targets: Array<{
    month: string;
    target: string;
    target_hi: string;
  }>;
}

interface StudyPlanViewProps {
  plan: StudyPlan;
  userProfile: {
    target_year: number;
    attempt_number: number;
    is_working_professional: boolean;
    study_hours_per_day: number;
    optional_subject: string;
  };
  trialExpiryDate: string;
  onStartJourney: () => void;
}

export function StudyPlanView({ plan, userProfile, trialExpiryDate, onStartJourney }: StudyPlanViewProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'strength': return 'green';
      case 'moderate': return 'yellow';
      case 'weakness': return 'red';
      default: return 'gray';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'strength': return '💪';
      case 'moderate': return '📈';
      case 'weakness': return '🎯';
      default: return '📊';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🎉 Your Personalized Study Plan is Ready!
        </h1>
        <p className="text-gray-600">
          आपकी व्यक्तिगत अध्ययन योजना तैयार है!
        </p>
        
        {/* Trial Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-saffron-50 to-orange-50 border border-saffron-200 rounded-full">
          <span className="text-xl">🎁</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-saffron-700">
              3-Day Free Trial Activated
            </p>
            <p className="text-xs text-saffron-600">
              Expires: {new Date(trialExpiryDate).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>👤</span> Your Profile
          <span className="text-gray-400 font-normal">| आपकी प्रोफ़ाइल</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Target Year</p>
            <p className="text-sm font-semibold text-gray-800">{userProfile.target_year}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Attempt</p>
            <p className="text-sm font-semibold text-gray-800">
              {userProfile.attempt_number === 1 ? '1st (Fresh)' : 
               userProfile.attempt_number === 2 ? '2nd (Experienced)' :
               userProfile.attempt_number === 3 ? '3rd (Determined)' : '4th+ (Veteran)'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Profile</p>
            <p className="text-sm font-semibold text-gray-800">
              {userProfile.is_working_professional ? 'Working Professional' : 'Full-time Aspirant'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Study Hours/Day</p>
            <p className="text-sm font-semibold text-saffron-600">{userProfile.study_hours_per_day} hours</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500">Optional Subject</p>
            <p className="text-sm font-semibold text-gray-800">{userProfile.optional_subject}</p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <span>💪</span> Your Strengths
            <span className="text-green-600 font-normal">| आपकी ताकत</span>
          </h3>
          <div className="space-y-3">
            {plan.strengths.map((sw, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">{sw.subject}</p>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {sw.accuracy}% Accuracy
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                    style={{ width: `${sw.accuracy}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {sw.topics_mastered.slice(0, 3).map((topic, i) => (
                    <p key={i} className="text-xs text-green-700 flex items-center gap-1">
                      <span>✓</span> {topic}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses (Areas to Improve) */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
            <span>🎯</span> Areas to Improve
            <span className="text-orange-600 font-normal">| सुधार के क्षेत्र</span>
          </h3>
          <div className="space-y-3">
            {plan.weaknesses.map((sw, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">{sw.subject}</p>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    {sw.accuracy}% Accuracy
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                    style={{ width: `${sw.accuracy}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {sw.topics_need_work.slice(0, 3).map((topic, i) => (
                    <p key={i} className="text-xs text-orange-700 flex items-center gap-1">
                      <span>📚</span> {topic}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📅</span> Your Weekly Schedule
          <span className="text-gray-400 font-normal">| साप्ताहिक कार्यक्रम</span>
        </h3>
        
        <div className="space-y-4">
          {plan.weekly_schedule.slice(0, 7).map((day, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <p className="font-semibold text-gray-800">{day.day}</p>
                <p className="text-sm text-gray-500">{day.day_hi}</p>
                <span className="text-xs text-saffron-600 font-medium">
                  {day.total_hours} hrs
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {day.time_slots.slice(0, 4).map((slot, slotIdx) => (
                  <div key={slotIdx} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                    <span className="text-xs font-medium text-gray-600 w-20">
                      {slot.time}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{slot.activity}</p>
                      <p className="text-xs text-gray-500">{slot.activity_hi}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {slot.duration_min} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Targets */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
          <span>🏆</span> Your Milestone Targets
          <span className="text-blue-600 font-normal">| लक्ष्य</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {plan.milestone_targets.map((milestone, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600 mb-1">{milestone.month}</p>
              <p className="text-sm font-medium text-gray-800">{milestone.target}</p>
              <p className="text-xs text-gray-500">{milestone.target_hi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Resources */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📚</span> Recommended Resources
          <span className="text-gray-400 font-normal">| अनुशंसित संसाधन</span>
        </h3>
        <ul className="space-y-2">
          {plan.recommended_resources.map((resource, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-saffron-500 mt-1">•</span>
              <span className="text-gray-700">{resource}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <button
        onClick={onStartJourney}
        className="w-full py-5 rounded-xl font-bold text-xl text-white bg-gradient-to-r from-saffron-500 to-orange-600 hover:shadow-xl hover:shadow-saffron-500/50 transform hover:-translate-y-1 transition-all duration-300"
      >
        🚀 Start Your UPSC Journey!
        <span className="block text-base font-normal mt-1">
          अपनी UPSC यात्रा शुरू करें!
        </span>
      </button>

      {/* Trial Reminder */}
      <p className="text-center text-xs text-gray-500 mt-4">
        You have full access during your 3-day trial. No payment required.
        <br />
        आपके 3-दिन के ट्रायल के दौरान पूर्ण एक्सेस है। कोई भुगतान आवश्यक नहीं।
      </p>
    </div>
  );
}
