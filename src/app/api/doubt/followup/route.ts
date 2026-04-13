/**
 * POST /api/doubt/followup
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Add follow-up question to existing thread
 * - Context preservation across conversation
 * - AI-powered follow-up answer generation
 * - Maximum 10 follow-ups per thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { doubtService } from '@/lib/doubt/doubt-service';
import { answerGenerator } from '@/lib/doubt/answer-generator';
import { z } from 'zod';
import { normalizeUPSCInput } from '@/lib/agents/normalizer-agent';

export const dynamic = 'force-dynamic';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const followupSchema = z.object({
  thread_id: z.string().uuid(),
  question: z.string().min(10).max(2000),
  attachments: z.array(
    z.object({
      type: z.enum(['image', 'audio']),
      url: z.string().url(),
      ocr_text: z.string().optional(),
      transcription: z.string().optional(),
    })
  ).optional(),
  language: z.enum(['en', 'hi', 'bilingual']).optional().default('bilingual'),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get authenticated user
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
    const validation = followupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Best-effort UPSC input normalization
    let normalized: any = null;
    try { normalized = await normalizeUPSCInput(data.question || ''); } catch (_e) { /* non-blocking */ }

    // Get thread to verify ownership and get context
    const threadResult = await doubtService.getThread(data.thread_id, user.id);

    if (threadResult.error || !threadResult.thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    // Check follow-up limit (max 10 per thread)
    const questionCount = threadResult.questions.length;
    if (questionCount >= 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum 10 follow-up questions allowed per thread. Start a new thread for more questions.' 
        },
        { status: 400 }
      );
    }

    // Build conversation context from previous Q&A
    const conversationContext = buildConversationContext(
      threadResult.questions,
      threadResult.answers
    );

    // Add follow-up question
    const followupResult = await doubtService.addFollowUp(
      data.thread_id,
      user.id,
      data.question
    );

    if (followupResult.error || !followupResult.questionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: followupResult.error || 'Failed to add follow-up question' 
        },
        { status: 500 }
      );
    }

    // Generate AI answer with conversation context
    const answerRequest = {
      question: data.question,
      subject: threadResult.thread.subject,
      topic: threadResult.thread.topic,
      context: conversationContext,
      language: data.language as 'en' | 'hi' | 'bilingual',
      attachments: data.attachments?.map(att => ({
        type: att.type as 'image' | 'audio',
        ocr_text: att.ocr_text,
        transcription: att.transcription,
      })),
    };

    const generatedAnswer = await answerGenerator.generateAnswer(answerRequest);

    // Save answer
    const saveResult = await doubtService.saveAnswer(
      data.thread_id,
      followupResult.questionId,
      generatedAnswer.text,
      generatedAnswer.aiProvider,
      generatedAnswer.responseTimeMs,
      generatedAnswer.sources.map(s => ({
        title: s.title,
        url: s.url,
        type: s.type,
      }))
    );

    // Update thread status
    await (supabase
      .from('doubt_threads') as any)
      .update({
        status: 'answered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.thread_id);

    // Build response
    const response = {
      success: true,
      data: {
        questionId: followupResult.questionId,
        answerId: saveResult.answerId,
        answer: {
          text: generatedAnswer.text,
          textHi: generatedAnswer.textHi,
          sources: generatedAnswer.sources,
          followUpQuestions: generatedAnswer.followUpQuestions,
          keyPoints: generatedAnswer.keyPoints,
          wordCount: generatedAnswer.wordCount,
        },
        thread: {
          id: data.thread_id,
          questionCount: questionCount + 1,
          remainingFollowUps: 10 - (questionCount + 1),
        },
        metadata: {
          responseTimeMs: Date.now() - startTime,
          aiProvider: generatedAnswer.aiProvider,
          isFollowUp: true,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Follow-up API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process follow-up' 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build conversation context from previous Q&A pairs
 */
function buildConversationContext(
  questions: Array<{ question_text: string; created_at: string }>,
  answers: Array<{ answer_text: string; created_at: string }>
): string {
  const context: string[] = [];

  // Pair questions with their answers
  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    const q = questions[i];
    const a = answers[i];
    
    context.push(`Q${i + 1}: ${q.question_text}`);
    context.push(`A${i + 1}: ${a.answer_text.substring(0, 500)}...`);
  }

  return context.join('\n\n');
}
