/**
 * Quiz Generator Service - F1 Smart Onboarding
 *
 * Generates 10-question diagnostic quiz for UPSC aspirants.
 * Uses AI with SIMPLIFIED_LANGUAGE_PROMPT for question generation.
 *
 * Question Distribution (per Master Prompt v8.0):
 * - GS1 (History): 2 questions
 * - GS1 (Geography): 1 question
 * - GS2 (Polity): 2 questions
 * - GS3 (Economy): 2 questions
 * - GS3 (Environment): 1 question
 * - GS4 (Ethics): 1 question
 * - CSAT (Quant): 1 question
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withSimplifiedLanguage } from './simplified-language-prompt';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_sb)
    _sb = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  return _sb;
}

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  id: string;
  question_text: string;
  question_text_hi: string;
  options: string[];
  correct_answer: string; // "A", "B", "C", or "D"
  explanation: string;
  explanation_hi: string;
  subject: string; // "GS1", "GS2", "GS3", "GS4", "CSAT"
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  upsc_year?: number; // If from PYQ
}

/**
 * Quiz generation configuration
 */
export interface QuizConfig {
  user_id: string;
  target_year: number;
  attempt_number: number;
  is_working_professional: boolean;
  study_hours_per_day: number;
  optional_subject?: string;
}

/**
 * Question distribution for 10-question quiz
 */
const QUESTION_DISTRIBUTION = [
  { subject: 'GS1', topic: 'Modern India', difficulty: 'medium' as const },
  { subject: 'GS1', topic: 'Art and Culture', difficulty: 'medium' as const },
  { subject: 'GS1', topic: 'Physical Geography', difficulty: 'medium' as const },
  { subject: 'GS2', topic: 'Constitution', difficulty: 'medium' as const },
  { subject: 'GS2', topic: 'Fundamental Rights', difficulty: 'medium' as const },
  { subject: 'GS3', topic: 'Basic Economics', difficulty: 'medium' as const },
  { subject: 'GS3', topic: 'Union Budget', difficulty: 'medium' as const },
  { subject: 'GS3', topic: 'Ecology', difficulty: 'medium' as const },
  { subject: 'GS4', topic: 'Ethics Fundamentals', difficulty: 'medium' as const },
  { subject: 'CSAT', topic: 'Quantitative Aptitude', difficulty: 'medium' as const },
];

/**
 * AI prompt for quiz generation
 */
const QUIZ_GENERATION_PROMPT = `
Generate UPSC Prelims-style MCQs for diagnostic quiz.

RULES:
1. Each question has exactly 4 options (A, B, C, D)
2. Only ONE correct answer per question
3. Include clear explanation for each answer
4. Use simple language (10th-class level)
5. Include Hindi translation for all content
6. Tag with subject, topic, and difficulty
7. If based on PYQ, include the UPSC year

FORMAT: Return valid JSON only, no markdown.

{
  "questions": [
    {
      "question_text": "Question in English",
      "question_text_hi": "Question in Hindi",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "A",
      "explanation": "Why A is correct in simple English",
      "explanation_hi": "Why A is correct in simple Hindi",
      "subject": "GS1",
      "topic": "Modern India",
      "difficulty": "medium",
      "upsc_year": 2023
    }
  ]
}
`;

/**
 * Generate 10-question diagnostic quiz
 *
 * @param config - User configuration for personalized quiz
 * @returns Array of 10 quiz questions
 */
export async function generateDiagnosticQuiz(config: QuizConfig): Promise<QuizQuestion[]> {
  try {
    // Check if user already has a quiz (prevent regeneration)
    const { data: existingQuiz } = await getSupabase()
      .from('quiz_attempts')
      .select('id, questions' as any)
      .eq('user_id', config.user_id)
      .eq('quiz_type' as any, 'diagnostic')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingQuiz) {
      // Return existing quiz questions
      return (existingQuiz as any).questions as QuizQuestion[];
    }

    // Generate quiz using AI
    const prompt = withSimplifiedLanguage(`
      Generate 10 UPSC Prelims MCQs for a new aspirant.
      
      User Profile:
      - Target Year: ${config.target_year}
      - Attempt: ${config.attempt_number}${config.is_working_professional ? ' (Working Professional)' : ' (Full-time Student)'}
      - Study Hours: ${config.study_hours_per_day} hours/day
      ${config.optional_subject ? `- Optional Subject: ${config.optional_subject}` : ''}
      
      Question Distribution (exactly 10 questions):
      1. GS1 - Modern India
      2. GS1 - Art and Culture
      3. GS1 - Physical Geography
      4. GS2 - Constitution
      5. GS2 - Fundamental Rights
      6. GS3 - Basic Economics
      7. GS3 - Union Budget
      8. GS3 - Ecology
      9. GS4 - Ethics Fundamentals
      10. CSAT - Quantitative Aptitude
      
      ${QUIZ_GENERATION_PROMPT}
    `);

    // Call AI provider (9Router → Groq → Ollama fallback)
    const aiResponse = await callAIProvider(prompt);

    // Parse AI response
    const parsedResponse = JSON.parse(aiResponse);
    const questions: QuizQuestion[] = parsedResponse.questions.map((q: any, index: number) => ({
      id: `quiz-${config.user_id}-q${index + 1}`,
      ...q,
    }));

    // Validate questions
    if (questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${questions.length}`);
    }

    // Store questions in database for reuse
    await getSupabase()
      .from('questions')
      .upsert(
        questions.map((q) => ({
          question_type: 'mcq' as const,
          question_text: q.question_text,
          question_text_hi: q.question_text_hi,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          explanation_hi: q.explanation_hi,
          subject: q.subject,
          difficulty: q.difficulty,
          source: 'diagnostic_quiz',
        }))
      );

    return questions;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate diagnostic quiz. Please try again.');
  }
}

/**
 * Call AI provider with fallback chain (9Router → Groq → Ollama)
 */
async function callAIProvider(prompt: string): Promise<string> {
  // Use existing AI provider client
  const { callAI } = await import('../ai/ai-provider-client');

  const response = await callAI({
    messages: [
      { role: 'system', content: 'You are an expert UPSC exam question creator.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  return response;
}

/**
 * Calculate quiz score and subject-wise accuracy
 */
export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Array<{ question_id: string; selected_option: string; time_spent_sec: number }>
) {
  let correctCount = 0;
  const subjectStats: Record<string, { total: number; correct: number }> = {};

  answers.forEach((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    if (!question) return;

    // Initialize subject stats
    if (!subjectStats[question.subject]) {
      subjectStats[question.subject] = { total: 0, correct: 0 };
    }
    subjectStats[question.subject].total++;

    // Check if correct
    if (answer.selected_option === question.correct_answer) {
      correctCount++;
      subjectStats[question.subject].correct++;
    }
  });

  const totalQuestions = questions.length;
  const score = (correctCount / totalQuestions) * 100;

  // Calculate accuracy per subject
  const subjectAccuracy: Record<string, number> = {};
  Object.entries(subjectStats).forEach(([subject, stats]) => {
    subjectAccuracy[subject] = (stats.correct / stats.total) * 100;
  });

  return {
    score,
    correctCount,
    totalQuestions,
    subjectAccuracy,
    subjectStats,
  };
}

/**
 * Identify strengths and weaknesses from quiz performance
 */
export function identifyStrengthsWeaknesses(subjectAccuracy: Record<string, number>) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(subjectAccuracy).forEach(([subject, accuracy]) => {
    if (accuracy >= 70) {
      strengths.push(subject);
    } else if (accuracy < 40) {
      weaknesses.push(subject);
    }
  });

  return { strengths, weaknesses };
}

/**
 * Determine preparation stage based on quiz performance
 */
export function determinePreparationStage(
  score: number,
  attemptNumber: number,
  targetYear: number
): 'beginner' | 'intermediate' | 'advanced' | 'revision' {
  const currentYear = new Date().getFullYear();
  const yearsUntilExam = targetYear - currentYear;

  // Revision stage: Already attempted 3+ times
  if (attemptNumber >= 4) {
    return 'revision';
  }

  // Advanced stage: Score > 70% and attempting 2nd time
  if (score > 70 && attemptNumber >= 2) {
    return 'advanced';
  }

  // Intermediate stage: Score 40-70% or 2nd attempt
  if ((score >= 40 && score <= 70) || attemptNumber >= 2) {
    return 'intermediate';
  }

  // Default: Beginner
  return 'beginner';
}
