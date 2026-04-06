import { createClient } from '@/lib/supabase/server';
import { generateWithThinking, parseAIJson } from '@/lib/ai/generate';
import type { Quiz, QuizQuestion, QuizAttempt, Json } from '@/types';

export interface GenerateQuizInput {
  topic: string;
  subject: string;
  userId: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

/**
 * Generate UPSC-style quiz questions on a topic
 * Uses AI with thinking model for quality questions
 */
export async function generateQuiz(input: GenerateQuizInput): Promise<Quiz> {
  const { topic, subject, userId, questionCount = 10, difficulty = 'mixed' } = input;

  const systemPrompt = `You are an expert UPSC Civil Services Examination paper setter.
Your task is to create high-quality MCQ questions that test conceptual understanding.

IMPORTANT RULES:
1. Questions should match UPSC Prelims/Mains standard
2. Include a mix of factual and analytical questions
3. Options should be plausible - no obvious wrong answers
4. Explanations must cite sources and clarify concepts
5. Output ONLY valid JSON - no other text`;

  const prompt = `Generate ${questionCount} UPSC-style MCQ questions on:

TOPIC: ${topic}
SUBJECT: ${subject}
DIFFICULTY: ${difficulty}

Output this EXACT JSON structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Clear, well-framed question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation with source reference",
      "difficulty": "medium",
      "tags": ["relevant", "topic", "tags"]
    }
  ],
  "metadata": {
    "estimatedTime": ${questionCount * 2},
    "passingScore": ${Math.floor(questionCount * 0.6)},
    "totalMarks": ${questionCount}
  }
}

Create exactly ${questionCount} questions with varying difficulty.
Each question should test a different aspect of the topic.`;

  try {
    const response = await generateWithThinking(prompt, {
      systemPrompt,
      maxTokens: 4000,
      userId,
    });

    // Parse AI response
    const parsed = parseAIJson<{
      questions: QuizQuestion[];
      metadata: { estimatedTime: number; passingScore: number; totalMarks: number };
    }>(response);

    if (!parsed || !parsed.questions || parsed.questions.length === 0) {
      throw new Error('Failed to parse quiz questions');
    }

    // Validate and clean questions
    const validatedQuestions: QuizQuestion[] = parsed.questions.map((q, index) => ({
      id: q.id || `q${index + 1}`,
      question: q.question || 'Question not available',
      options: q.options?.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: q.explanation || 'Explanation not available',
      difficulty: q.difficulty || 'medium',
      tags: q.tags || [],
    }));

    // Save to database
    const supabase = await createClient();

    const { data: quiz, error } = await (supabase
      .from('quizzes') as any)
      .insert({
        user_id: userId,
        topic,
        subject,
        questions: validatedQuestions,
        total_questions: validatedQuestions.length,
        time_limit: parsed.metadata?.estimatedTime || questionCount * 2,
        passing_score: parsed.metadata?.passingScore || Math.floor(questionCount * 0.6),
      })
      .select()
      .single();

    if (error) {
      console.error('[Quiz Service] Database error:', error);
      throw new Error(`Failed to save quiz: ${error.message}`);
    }

    return {
      id: quiz.id,
      userId: quiz.user_id,
      topic: quiz.topic,
      subject: quiz.subject,
      questions: quiz.questions as unknown as QuizQuestion[],
      totalQuestions: quiz.total_questions,
      timeLimit: quiz.time_limit,
      passingScore: quiz.passing_score,
      createdAt: new Date(quiz.created_at),
    };
  } catch (error) {
    console.error('[Quiz Service] Error generating quiz:', error);
    throw error;
  }
}

/**
 * Get all quizzes for a user
 */
export async function getUserQuizzes(userId: string): Promise<Quiz[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('quizzes') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quizzes: ${error.message}`);
  }

  return data.map((quiz: any) => ({
    id: quiz.id,
    userId: quiz.user_id,
    topic: quiz.topic,
    subject: quiz.subject,
    questions: quiz.questions as unknown as QuizQuestion[],
    totalQuestions: quiz.total_questions,
    timeLimit: quiz.time_limit,
    passingScore: quiz.passing_score,
    createdAt: new Date(quiz.created_at),
  }));
}

/**
 * Get a single quiz by ID
 */
export async function getQuizById(quizId: string, userId: string): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('quizzes') as any)
    .select('*')
    .eq('id', quizId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    topic: data.topic,
    subject: data.subject,
    questions: data.questions as unknown as QuizQuestion[],
    totalQuestions: data.total_questions,
    timeLimit: data.time_limit,
    passingScore: data.passing_score,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Submit quiz answers and calculate score
 */
export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: Record<string, number>,
  timeTaken: number
): Promise<QuizAttempt> {
  const supabase = await createClient();

  // Get the quiz
  const quiz = await getQuizById(quizId, userId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Calculate score
  let correctCount = 0;
  const questionResults: { questionId: string; correct: boolean; userAnswer: number }[] = [];

  for (const question of quiz.questions) {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      correctCount++;
    }

    questionResults.push({
      questionId: question.id,
      correct: isCorrect,
      userAnswer: userAnswer ?? -1,
    });
  }

  const score = correctCount;
  const percentage = Math.round((correctCount / quiz.totalQuestions) * 100);
  const passed = score >= quiz.passingScore;

  // Save attempt
  const { data: attempt, error } = await (supabase
    .from('quiz_attempts') as any)
    .insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total_questions: quiz.totalQuestions,
      time_taken: timeTaken,
      answers: answers,
      passed,
    })
    .select()
    .single();

  if (error) {
    console.error('[Quiz Service] Error saving attempt:', error);
    throw new Error(`Failed to save quiz attempt: ${error.message}`);
  }

  return {
    id: attempt.id,
    quizId: attempt.quiz_id,
    userId: attempt.user_id,
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    percentage,
    timeTaken: attempt.time_taken,
    passed: attempt.passed,
    answers: attempt.answers as unknown as Record<string, number>,
    questionResults,
    completedAt: new Date(attempt.created_at),
  };
}

/**
 * Get quiz attempts for a user
 */
export async function getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase
    .from('quiz_attempts') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quiz attempts: ${error.message}`);
  }

  return data.map((attempt: any) => ({
    id: attempt.id,
    quizId: attempt.quiz_id,
    userId: attempt.user_id,
    score: attempt.score,
    totalQuestions: attempt.total_questions,
    percentage: Math.round((attempt.score / attempt.total_questions) * 100),
    timeTaken: attempt.time_taken,
    passed: attempt.passed,
    answers: attempt.answers as unknown as Record<string, number>,
    questionResults: [],
    completedAt: new Date(attempt.created_at),
  }));
}

/**
 * Get quiz statistics for a user
 */
export async function getUserQuizStats(userId: string): Promise<{
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  totalTimeTaken: number;
}> {
  const attempts = await getUserQuizAttempts(userId);

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      totalTimeTaken: 0,
    };
  }

  const totalAttempts = attempts.length;
  const averageScore = Math.round(
    attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
  );
  const passRate = Math.round(
    (attempts.filter((a) => a.passed).length / totalAttempts) * 100
  );
  const totalTimeTaken = attempts.reduce((sum, a) => sum + a.timeTaken, 0);

  return {
    totalAttempts,
    averageScore,
    passRate,
    totalTimeTaken,
  };
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete quiz: ${error.message}`);
  }
}

// Alias for convenience
export const getQuizzesByUser = getUserQuizzes;