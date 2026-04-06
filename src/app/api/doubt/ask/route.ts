/**
 * POST /api/doubt/ask
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Submit new doubt with text, image, or voice
 * - AI-powered answer generation with RAG grounding
 * - 9Router → Groq → Ollama fallback (NOT A4F)
 * - Usage tracking for free/premium limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { doubtService, createDoubtSchema } from '@/lib/doubt/doubt-service';
import { answerGenerator } from '@/lib/doubt/answer-generator';
import { imageProcessor } from '@/lib/doubt/image-processor';
import { voiceProcessor } from '@/lib/doubt/voice-processor';
import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const askDoubtSchema = z.object({
  title: z.object({
    en: z.string().min(5).max(200),
    hi: z.string().max(200).optional(),
  }),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'CSAT', 'General']),
  topic: z.string().max(100).optional(),
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
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = askDoubtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Process attachments (OCR for images, transcription for audio)
    const processedAttachments = await processAttachments(data.attachments || []);

    // Create doubt thread and question
    const createResult = await doubtService.createDoubt(user.id, {
      title: data.title,
      subject: data.subject,
      topic: data.topic,
      question: data.question,
      attachments: processedAttachments,
    });

    if (createResult.error || !createResult.threadId || !createResult.questionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: createResult.error || 'Failed to create doubt' 
        },
        { status: 500 }
      );
    }

    // Generate AI answer
    const answerRequest = {
      question: data.question,
      subject: data.subject,
      topic: data.topic,
      language: data.language as 'en' | 'hi' | 'bilingual',
      attachments: processedAttachments.map(att => ({
        type: att.type as 'image' | 'audio',
        ocr_text: att.ocr_text,
        transcription: att.transcription,
      })),
    };

    const generatedAnswer = await answerGenerator.generateAnswer(answerRequest);

    // Save answer to database
    const saveResult = await doubtService.saveAnswer(
      createResult.threadId,
      createResult.questionId,
      generatedAnswer.text,
      generatedAnswer.aiProvider,
      generatedAnswer.responseTimeMs,
      generatedAnswer.sources.map(s => ({
        title: s.title,
        url: s.url,
        type: s.type,
      }))
    );

    if (saveResult.error || !saveResult.answerId) {
      console.error('Failed to save answer:', saveResult.error);
      // Don't fail the response, just log the error
    }

    // Get updated usage
    const usage = await doubtService.getUserUsage(user.id);

    // Build response
    const response = {
      success: true,
      data: {
        threadId: createResult.threadId,
        questionId: createResult.questionId,
        answerId: saveResult.answerId,
        answer: {
          text: generatedAnswer.text,
          textHi: generatedAnswer.textHi,
          sources: generatedAnswer.sources,
          followUpQuestions: generatedAnswer.followUpQuestions,
          keyPoints: generatedAnswer.keyPoints,
          wordCount: generatedAnswer.wordCount,
        },
        usage: {
          remainingDoubts: usage.limit_remaining,
          totalDoubtsThisMonth: usage.total_doubts,
        },
        metadata: {
          responseTimeMs: Date.now() - startTime,
          aiProvider: generatedAnswer.aiProvider,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Ask doubt API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process doubt' 
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process attachments (OCR for images, transcription for audio)
 */
async function processAttachments(
  attachments: Array<{ type: string; url: string }>
): Promise<Array<{ type: string; url: string; ocr_text?: string; transcription?: string }>> {
  const processed: Array<{ type: string; url: string; ocr_text?: string; transcription?: string }> = [];

  for (const attachment of attachments) {
    try {
      if (attachment.type === 'image') {
        // Perform OCR on image
        const ocrResult = await imageProcessor.performOCR(attachment.url, 'both');
        
        processed.push({
          type: attachment.type,
          url: attachment.url,
          ocr_text: ocrResult.success ? ocrResult.text : undefined,
        });
      } else if (attachment.type === 'audio') {
        // Transcribe audio (requires server-side endpoint)
        // For now, store URL and transcribe asynchronously
        processed.push({
          type: attachment.type,
          url: attachment.url,
        });
      } else {
        processed.push(attachment);
      }
    } catch (error) {
      console.error(`Failed to process ${attachment.type}:`, error);
      // Still include the attachment without processed content
      processed.push(attachment);
    }
  }

  return processed;
}
