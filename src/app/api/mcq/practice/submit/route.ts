/**
 * MCQ Practice Submit API
 * 
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - Submit practice answers
 * - Auto-scoring with negative marks
 * - AI explanation generation
 * - Performance tracking
 * - XP rewards (Gamification F13)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { explanationGenerator } from '@/lib/mcq/explanation-generator';
import { updateMastery } from '@/lib/mastery/mastery-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const practiceSubmitSchema = z.object({
  sessionId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOption: z.number().min(1).max(4),
    timeSpent: z.number().min(0),
    markedForReview: z.boolean().optional(),
  })),
});

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = practiceSubmitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error?.issues },
        { status: 400 }
      );
    }

    const { sessionId, answers } = validation.data;

    // Get attempt details
    const { data: attempt, error: attemptError } = await supabase
      .from('mcq_attempts')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get questions with correct answers
    const questionIds = answers.map(a => a.questionId);
    const { data: questions } = await supabase
      .from('mcq_questions')
      .select('id, correct_option, options, explanation, subject, topic, difficulty, marks, negative_marks')
      .in('id', questionIds);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Questions not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalMarks = 0;
    let negativeMarks = 0;
    const explanations = [];

    // Insert answers and calculate score
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = answer.selectedOption === question.correct_option;
      const isSkipped = !answer.selectedOption;

      // Insert answer record
      await supabase
        .from('mcq_answers')
        .insert({
          attempt_id: sessionId,
          question_id: answer.questionId,
          selected_option: answer.selectedOption,
          is_correct: isCorrect,
          is_skipped: isSkipped,
          time_spent_sec: answer.timeSpent,
          marked_for_review: answer.markedForReview || false,
        });

      // Calculate marks
      if (isCorrect) {
        correctAnswers++;
        totalMarks += question.marks || 2;
      } else if (!isSkipped) {
        incorrectAnswers++;
        negativeMarks += question.negative_marks || 0.66;
      }

      // Generate explanation for this question
      const explanation = await explanationGenerator.generateExplanation({
        question: {
          id: question.id,
          questionText: question.options[0]?.text || { en: '', hi: '' },
          options: question.options,
          correctOption: question.correct_option,
          explanation: question.explanation,
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty,
          timeEstimateSec: 90,
          marks: question.marks || 2,
          negativeMarks: question.negative_marks || 0.66,
          isPyy: false,
          tags: [],
        },
        selectedOption: answer.selectedOption,
        isCorrect,
        userId: user.id,
      });

      explanations.push({
        questionId: question.id,
        explanation,
      });
    }

    const unattempted = attempt.total_questions - answers.length;
    const netMarks = totalMarks - negativeMarks;
    const accuracy = answers.length > 0 
      ? Math.round((correctAnswers / answers.length) * 100) 
      : 0;
    const timeTakenSec = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const avgTimePerQuestion = answers.length > 0 
      ? Math.round(timeTakenSec / answers.length) 
      : 0;

    // Update attempt with final stats
    await supabase
      .from('mcq_attempts')
      .update({
        completed_at: new Date().toISOString(),
        attempted_questions: answers.length,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        unattempted,
        total_marks: totalMarks,
        negative_marks: negativeMarks,
        net_marks: netMarks,
        accuracy_percent: accuracy,
        time_taken_sec: timeTakenSec,
        avg_time_per_question: avgTimePerQuestion,
      })
      .eq('id', sessionId);

    // Award XP (Gamification F13)
    const xpEarned = correctAnswers * 10 + Math.round(accuracy / 10);
    await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: xpEarned,
      p_source: 'mcq_practice',
      p_metadata: { sessionId, correctAnswers, accuracy },
    });

    // Update mastery for each topic's knowledge node (best-effort)
    try {
      // Group answers by topic to find knowledge nodes
      const topicGroups = new Map<string, { correct: number; total: number; time: number }>();
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question?.topic) continue;
        const key = question.topic;
        const group = topicGroups.get(key) || { correct: 0, total: 0, time: 0 };
        group.total++;
        if (answer.selectedOption === question.correct_option) group.correct++;
        group.time += answer.timeSpent || 0;
        topicGroups.set(key, group);
      }

      // Find matching knowledge_nodes and update mastery
      for (const [topic, stats] of topicGroups) {
        const { data: node } = await supabase
          .from('knowledge_nodes')
          .select('id')
          .ilike('title', `%${topic}%`)
          .limit(1)
          .maybeSingle();

        if (node) {
          await updateMastery(user.id, node.id, stats.correct, stats.total, stats.time);
        }
      }
    } catch (masteryErr) {
      console.error('Mastery update (non-critical):', masteryErr);
    }

    // Update daily analytics
    await supabase
      .from('mcq_analytics')
      .upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        subject: attempt.subject,
        topic: attempt.topic,
        questions_attempted: answers.length,
        accuracy_percent: accuracy,
        avg_time_sec: avgTimePerQuestion,
        difficulty_distribution: { [attempt.difficulty]: answers.length },
      }, {
        onConflict: 'user_id,date,subject,topic',
      });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        score: {
          totalMarks,
          negativeMarks,
          netMarks: Math.round(netMarks * 100) / 100,
          accuracy,
          correctAnswers,
          incorrectAnswers,
          unattempted,
        },
        timeStats: {
          timeTakenSec,
          avgTimePerQuestion,
        },
        xpEarned,
        explanations,
      },
    });
  } catch (error) {
    console.error('MCQ practice submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
