/**
 * Mains Answer Evaluator Service
 *
 * AI-powered UPSC Mains answer evaluation with 4-criteria scoring.
 * Response time target: <60 seconds
 *
 * Uses SIMPLIFIED_LANGUAGE_PROMPT (Rule 3) and 9Router → Groq → Ollama fallback.
 *
 * Master Prompt v8.0 Compliant
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '../onboarding/simplified-language-prompt';
import { callAI, AIProvider } from '../ai/ai-provider-client';
import { calculateScores, validateScore, generateImprovementSuggestions } from './scoring-rubric';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_sb) _sb = createClient(supabaseUrl, supabaseServiceKey);
  return _sb;
}

/**
 * Evaluation request interface
 */
export interface EvaluationRequest {
  question_id: string;
  answer_text: string;
  word_count: number;
  time_taken_sec: number;
  user_id: string;
}

/**
 * Evaluation response interface
 */
export interface EvaluationResponse {
  answer_id: string;
  evaluation: {
    structure_score: number;
    content_score: number;
    analysis_score: number;
    presentation_score: number;
    overall_score: number;
    overall_percentage: number;
    strengths: string[];
    improvements: string[];
    model_answer_points: string[];
    feedback_en: string;
    feedback_hi: string;
    exam_tip: string;
    evaluation_time_sec: number;
    ai_model_used: string;
  };
}

/**
 * AI Evaluation Prompt Template
 * Enforces SIMPLIFIED_LANGUAGE_PROMPT (Rule 3)
 */
const EVALUATION_PROMPT = `${SIMPLIFIED_LANGUAGE_PROMPT}

You are an expert UPSC Mains evaluator with 15+ years of experience.

QUESTION:
{question_text}

SUBJECT: {subject}
MARKS: {marks}
WORD LIMIT: {word_limit}

STUDENT ANSWER:
{answer_text}

WORD COUNT: {word_count}

EVALUATE ON 4 CRITERIA (0-10 each):

1. STRUCTURE (0-10):
   - Clear introduction with context?
   - Logical body with headings/sub-headings?
   - Balanced conclusion with way forward?
   Score: __

2. CONTENT (0-10):
   - Factual accuracy?
   - Relevant to question demand?
   - Coverage of all dimensions?
   Score: __

3. ANALYSIS (0-10):
   - Critical thinking shown?
   - Multiple perspectives (political, social, economic)?
   - Interlinking of concepts?
   Score: __

4. PRESENTATION (0-10):
   - Clarity of expression?
   - Examples (Indian context preferred)?
   - Mention of diagrams/flowcharts?
   Score: __

OVERALL SCORE: __/40 (__%)

STRENGTHS (3-5 points):
- ...

AREAS FOR IMPROVEMENT (3-5 points):
- ...

MODEL ANSWER POINTS (5-7 key points to include):
- ...

DETAILED FEEDBACK (English, 150-200 words):
...

DETAILED FEEDBACK (Hindi, 150-200 words):
...

EXAM TIP:
...

RESPONSE TIME TARGET: <30 seconds

Return your evaluation in this exact JSON format:
{
  "structure_score": 8,
  "content_score": 7,
  "analysis_score": 6,
  "presentation_score": 8,
  "overall_score": 29,
  "overall_percentage": 73,
  "strengths": ["point1", "point2", "point3"],
  "improvements": ["point1", "point2", "point3"],
  "model_answer_points": ["point1", "point2", "point3", "point4", "point5"],
  "feedback_en": "detailed feedback in English",
  "feedback_hi": "विस्तृत प्रतिक्रिया हिंदी में",
  "exam_tip": "EXAM TIP: This was asked in UPSC 2023..."
}
`;

/**
 * Main evaluation function
 * Evaluates a UPSC Mains answer and returns scores + feedback
 */
export async function evaluateAnswer(request: EvaluationRequest): Promise<EvaluationResponse> {
  const startTime = Date.now();

  // Step 1: Fetch question details
  const question = await fetchQuestion(request.question_id);
  if (!question) {
    throw new Error('Question not found');
  }

  // Step 2: Build AI prompt
  const prompt = buildEvaluationPrompt(question, request);

  // Step 3: Call AI with fallback chain (9Router → Groq → Ollama)
  const aiStartTime = Date.now();
  const aiResponse = await callAI({
    prompt,
    temperature: 0.3, // Lower temperature for consistent evaluation
    maxTokens: 2000,
  });
  const aiEndTime = Date.now();

  // Step 4: Parse AI response
  const evaluation = parseAIResponse(aiResponse, aiEndTime - aiStartTime);

  // Step 5: Validate scores
  validateEvaluation(evaluation);

  // Step 6: Save answer to database
  const answerId = await saveAnswer(request);

  // Step 7: Save evaluation to database
  await saveEvaluation(answerId, evaluation);

  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;

  console.debug(
    `Evaluation completed in ${totalTime.toFixed(2)}s (AI: ${((aiEndTime - aiStartTime) / 1000).toFixed(2)}s)`
  );

  // Check if we met the <60s target
  if (totalTime > 60) {
    console.warn(`WARNING: Evaluation took ${totalTime.toFixed(2)}s (target: <60s)`);
  }

  return {
    answer_id: answerId,
    evaluation: {
      ...evaluation,
      evaluation_time_sec: Math.round(totalTime),
      ai_model_used: (evaluation as any).ai_model_used || 'ai-provider',
    },
  };
}

/**
 * Fetch question details from database
 */
async function fetchQuestion(questionId: string) {
  const { data, error } = await getSupabase()
    .from('mains_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error || !data) {
    console.error('Error fetching question:', error);
    return null;
  }

  return data;
}

/**
 * Build evaluation prompt with question and answer details
 */
function buildEvaluationPrompt(question: any, request: EvaluationRequest): string {
  return EVALUATION_PROMPT.replace('{question_text}', question.question_text)
    .replace('{subject}', question.subject)
    .replace('{marks}', question.marks.toString())
    .replace('{word_limit}', question.word_limit.toString())
    .replace('{answer_text}', request.answer_text)
    .replace('{word_count}', request.word_count.toString());
}

/**
 * Parse AI response into structured evaluation
 */
function parseAIResponse(aiResponse: string, aiTimeMs: number) {
  try {
    // Extract JSON from AI response (handle markdown code blocks)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      structure_score: validateScore(parsed.structure_score || 5),
      content_score: validateScore(parsed.content_score || 5),
      analysis_score: validateScore(parsed.analysis_score || 5),
      presentation_score: validateScore(parsed.presentation_score || 5),
      overall_score: validateScore(parsed.overall_score || 20),
      overall_percentage: Math.min(100, Math.max(0, parsed.overall_percentage || 50)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      model_answer_points: Array.isArray(parsed.model_answer_points)
        ? parsed.model_answer_points
        : [],
      feedback_en: parsed.feedback_en || 'Feedback not available',
      feedback_hi: parsed.feedback_hi || 'प्रतिक्रिया उपलब्ध नहीं है',
      exam_tip: parsed.exam_tip || 'EXAM TIP: Practice more answers on this topic.',
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);

    // Return default evaluation on parse error
    return {
      structure_score: 5,
      content_score: 5,
      analysis_score: 5,
      presentation_score: 5,
      overall_score: 20,
      overall_percentage: 50,
      strengths: ['Attempted the answer'],
      improvements: ['Work on structure and content'],
      model_answer_points: ['Review the topic'],
      feedback_en: 'Unable to generate detailed feedback. Please try again.',
      feedback_hi: 'विस्तृत प्रतिक्रिया उत्पन्न करने में असमर्थ। कृपया पुनः प्रयास करें।',
      exam_tip: 'EXAM TIP: Practice more answers on this topic.',
    };
  }
}

/**
 * Validate evaluation scores are within expected ranges
 */
function validateEvaluation(evaluation: any) {
  const { structure_score, content_score, analysis_score, presentation_score, overall_score } =
    evaluation;

  // Check individual scores
  [structure_score, content_score, analysis_score, presentation_score].forEach((score) => {
    if (score < 0 || score > 10) {
      throw new Error(`Invalid score: ${score}`);
    }
  });

  // Check overall score matches sum of individual scores
  const expectedOverall = structure_score + content_score + analysis_score + presentation_score;
  if (Math.abs(overall_score - expectedOverall) > 1) {
    console.warn(`Overall score mismatch: ${overall_score} vs expected ${expectedOverall}`);
    evaluation.overall_score = expectedOverall;
    evaluation.overall_percentage = Math.round((expectedOverall / 40) * 100);
  }
}

/**
 * Save answer to database
 */
async function saveAnswer(request: EvaluationRequest): Promise<string> {
  const { data, error } = await getSupabase()
    .from('mains_answers')
    .insert({
      user_id: request.user_id,
      question_id: request.question_id,
      answer_text: request.answer_text,
      word_count: request.word_count,
      time_taken_sec: request.time_taken_sec,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error saving answer:', error);
    throw new Error('Failed to save answer');
  }

  return data.id;
}

/**
 * Save evaluation to database
 */
async function saveEvaluation(answerId: string, evaluation: any) {
  const { error } = await getSupabase().from('mains_evaluations').insert({
    answer_id: answerId,
    structure_score: evaluation.structure_score,
    content_score: evaluation.content_score,
    analysis_score: evaluation.analysis_score,
    presentation_score: evaluation.presentation_score,
    overall_score: evaluation.overall_score,
    overall_percentage: evaluation.overall_percentage,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    model_answer_points: evaluation.model_answer_points,
    feedback_en: evaluation.feedback_en,
    feedback_hi: evaluation.feedback_hi,
    exam_tip: evaluation.exam_tip,
    evaluation_time_sec: evaluation.evaluation_time_sec,
    ai_model_used: '9Router/Groq/Ollama',
  });

  if (error) {
    console.error('Error saving evaluation:', error);
    throw new Error('Failed to save evaluation');
  }
}

/**
 * Get evaluation history for a user
 */
export async function getEvaluationHistory(
  userId: string,
  filters?: {
    subject?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let query = getSupabase()
    .from('mains_evaluations')
    .select(
      `
      *,
      mains_answers (
        question_id,
        time_taken_sec,
        word_count
      ),
      mains_questions (
        subject,
        topic,
        marks,
        is_pyq,
        year
      )
    `
    )
    .eq('mains_answers.user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (filters?.subject) {
    query = query.eq('mains_questions.subject', filters.subject as any);
  }
  if (filters?.fromDate) {
    query = query.gte('created_at', filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte('created_at', filters.toDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching evaluation history:', error);
    return { evaluations: [], pagination: { page, total: 0, hasMore: false }, stats: null };
  }

  // Calculate stats
  const stats = calculateStats(data);

  return {
    evaluations: data || [],
    pagination: {
      page,
      total: data?.length || 0,
      hasMore: data?.length === limit,
    },
    stats,
  };
}

/**
 * Calculate statistics from evaluation history
 */
function calculateStats(evaluations: any[]) {
  if (!evaluations || evaluations.length === 0) {
    return {
      average_score: 0,
      total_answered: 0,
      trend: 'stable',
    };
  }

  const scores = evaluations.map((e) => e.overall_percentage);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Calculate trend (compare last 5 vs previous 5)
  let trend = 'stable';
  if (evaluations.length >= 10) {
    const recent5 = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const previous5 = scores.slice(5, 10).reduce((a, b) => a + b, 0) / 5;

    if (recent5 > previous5 + 5) trend = 'improving';
    else if (recent5 < previous5 - 5) trend = 'declining';
  }

  return {
    average_score: averageScore,
    total_answered: evaluations.length,
    trend,
  };
}

/**
 * Get single evaluation by ID
 */
export async function getEvaluationById(evaluationId: string) {
  const { data, error } = await getSupabase()
    .from('mains_evaluations')
    .select(
      `
      *,
      mains_answers (
        question_id,
        answer_text,
        time_taken_sec,
        word_count,
        mains_questions (
          question_text,
          question_text_hi,
          subject,
          topic,
          marks,
          word_limit
        )
      )
    `
    )
    .eq('id', evaluationId)
    .single();

  if (error || !data) {
    console.error('Error fetching evaluation:', error);
    return null;
  }

  return data;
}

/**
 * Submit feedback on evaluation
 */
export async function submitFeedback(
  evaluationId: string,
  userId: string,
  feedback: {
    rating?: number;
    was_helpful?: boolean;
    feedback_text?: string;
  }
) {
  const { error } = await getSupabase().from('mains_feedback').insert({
    evaluation_id: evaluationId,
    user_id: userId,
    rating: feedback.rating,
    was_helpful: feedback.was_helpful,
    feedback_text: feedback.feedback_text,
  });

  if (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback');
  }
}
