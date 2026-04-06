/**
 * Onboarding Wizard Orchestrator - F1 Smart Onboarding
 * 
 * Main orchestrator component that manages all 6 steps of the onboarding flow.
 * Handles state, API calls, and step transitions.
 * Mobile-responsive, bilingual (EN+HI).
 * 
 * Master Prompt v8.0 - Rule 3: SIMPLIFIED_LANGUAGE_PROMPT
 */

'use client';

import React, { useState, useCallback } from 'react';
import { StepIndicator, OnboardingStep } from './step-indicator';
import { TargetYearStep } from './target-year-step';
import { AttemptsStep } from './attempts-step';
import { ProfessionalStep } from './professional-step';
import { OptionalSubjectStep } from './optional-subject-step';
import { QuizStep, QuizQuestion } from './quiz-step';
import { AnalysisLoading } from './analysis-loading';
import { StudyPlanView, StudyPlan } from './study-plan-view';

// API Types
interface UserProfile {
  target_year: number;
  attempt_number: number;
  is_working_professional: boolean;
  study_hours_per_day: number;
  optional_subject: string;
}

interface QuizAnswer {
  question_id: string;
  selected_option: string;
  time_spent_sec: number;
}

interface StudyPlanResponse {
  plan: StudyPlan;
  trial_expiry_date: string;
  strengths: Array<{ subject: string; accuracy: number }>;
  weaknesses: Array<{ subject: string; accuracy: number }>;
}

export function OnboardingWizard() {
  // Step State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('target');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    target_year: new Date().getFullYear(),
    attempt_number: 1,
    is_working_professional: false,
    study_hours_per_day: 4,
    optional_subject: '',
  });

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [trialExpiryDate, setTrialExpiryDate] = useState('');

  // Error State
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Target Year
  const handleTargetYearSelect = useCallback((year: number) => {
    setUserProfile(prev => ({ ...prev, target_year: year }));
  }, []);

  const handleTargetYearNext = async () => {
    setCurrentStep('attempts');
    setCompletedSteps(prev => [...prev, 'target']);
  };

  // Step 2: Attempts
  const handleAttemptSelect = useCallback((attempt: number) => {
    setUserProfile(prev => ({ ...prev, attempt_number: attempt }));
  }, []);

  const handleAttemptsNext = () => {
    setCurrentStep('professional');
    setCompletedSteps(prev => [...prev, 'attempts']);
  };

  const handleAttemptsBack = () => {
    setCurrentStep('target');
    setCompletedSteps(prev => prev.filter(s => s !== 'attempts'));
  };

  // Step 3: Professional
  const handleProfessionalToggle = useCallback((value: boolean) => {
    setUserProfile(prev => ({ ...prev, is_working_professional: value }));
  }, []);

  const handleStudyHoursChange = useCallback((hours: number) => {
    setUserProfile(prev => ({ ...prev, study_hours_per_day: hours }));
  }, []);

  const handleProfessionalNext = () => {
    setCurrentStep('subject');
    setCompletedSteps(prev => [...prev, 'professional']);
  };

  const handleProfessionalBack = () => {
    setCurrentStep('attempts');
    setCompletedSteps(prev => prev.filter(s => s !== 'professional'));
  };

  // Step 4: Optional Subject
  const handleSubjectSelect = useCallback((subject: string) => {
    setUserProfile(prev => ({ ...prev, optional_subject: subject }));
  }, []);

  const handleSubjectNext = async () => {
    setIsQuizLoading(true);
    setError(null);

    try {
      // Generate quiz
      const response = await fetch('/api/onboarding/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) throw new Error('Failed to generate quiz');

      const data = await response.json();
      setQuizQuestions(data.questions);
      setCurrentStep('quiz');
      setCompletedSteps(prev => [...prev, 'subject']);
    } catch (err) {
      setError('Failed to load quiz. Please try again.');
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleSubjectBack = () => {
    setCurrentStep('professional');
    setCompletedSteps(prev => prev.filter(s => s !== 'subject'));
  };

  // Step 5: Quiz
  const handleQuizAnswerChange = useCallback((answers: QuizAnswer[]) => {
    setQuizAnswers(answers);
  }, []);

  const handleQuizSubmit = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userProfile,
          answers: quizAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete onboarding');
      }

      const data: StudyPlanResponse = await response.json();
      setStudyPlan(data.plan);
      setTrialExpiryDate(data.trial_expiry_date);
      setAnalysisComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setIsAnalyzing(false);
    }
  };

  const handleQuizBack = () => {
    setCurrentStep('subject');
    setCompletedSteps(prev => prev.filter(s => s !== 'quiz'));
  };

  // Step 6: Analysis Complete
  const handleAnalysisComplete = () => {
    setCurrentStep('analysis');
    setCompletedSteps(prev => [...prev, 'quiz']);
  };

  const handleStartJourney = () => {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  // Render current step
  const renderStep = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-saffron-500 text-white rounded-xl hover:bg-saffron-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 'target':
        return (
          <TargetYearStep
            selectedYear={userProfile.target_year}
            onSelectYear={handleTargetYearSelect}
            onNext={handleTargetYearNext}
            canProceed={userProfile.target_year !== null}
          />
        );

      case 'attempts':
        return (
          <AttemptsStep
            selectedAttempt={userProfile.attempt_number}
            onSelectAttempt={handleAttemptSelect}
            onNext={handleAttemptsNext}
            onBack={handleAttemptsBack}
            canProceed={userProfile.attempt_number !== null}
          />
        );

      case 'professional':
        return (
          <ProfessionalStep
            isWorkingProfessional={userProfile.is_working_professional}
            studyHoursPerDay={userProfile.study_hours_per_day}
            onToggleProfessional={handleProfessionalToggle}
            onStudyHoursChange={handleStudyHoursChange}
            onNext={handleProfessionalNext}
            onBack={handleProfessionalBack}
            canProceed={userProfile.study_hours_per_day > 0}
          />
        );

      case 'subject':
        return (
          <OptionalSubjectStep
            selectedSubject={userProfile.optional_subject || null}
            onSelectSubject={handleSubjectSelect}
            onNext={handleSubjectNext}
            onBack={handleSubjectBack}
            canProceed={!!userProfile.optional_subject}
          />
        );

      case 'quiz':
        if (isQuizLoading || quizQuestions.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-pulse">⏳</div>
              <p className="text-gray-600">Generating your quiz...</p>
            </div>
          );
        }
        return (
          <QuizStep
            questions={quizQuestions}
            answers={quizAnswers}
            onAnswerChange={handleQuizAnswerChange}
            onSubmit={handleQuizSubmit}
            isLoading={isAnalyzing}
          />
        );

      case 'analysis':
        if (!analysisComplete) {
          return (
            <AnalysisLoading
              isComplete={analysisComplete}
              onComplete={handleAnalysisComplete}
            />
          );
        }
        if (studyPlan && userProfile) {
          return (
            <StudyPlanView
              plan={studyPlan}
              userProfile={userProfile}
              trialExpiryDate={trialExpiryDate}
              onStartJourney={handleStartJourney}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-orange-50 to-yellow-50 py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🎯 Welcome to UPSC PrepX-AI!
        </h1>
        <p className="text-gray-600">
          Let's create your personalized study plan
        </p>
        <p className="text-gray-500 text-sm">
          आपकी व्यक्तिगत अध्ययन योजना बनाते हैं
        </p>
      </div>

      {/* Step Indicator (only show before quiz) */}
      {currentStep !== 'quiz' && currentStep !== 'analysis' && (
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-saffron-500/10 p-6 md:p-8">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-gray-500">
        <p>This will take about 5-7 minutes</p>
        <p>यह लगभग 5-7 मिनट लेगा</p>
      </div>
    </div>
  );
}
