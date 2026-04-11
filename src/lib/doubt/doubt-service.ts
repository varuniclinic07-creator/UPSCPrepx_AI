/**
 * AI Doubt Solver Service
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - CRUD operations for doubt threads, questions, answers, ratings
 * - Usage tracking for free/premium limits
 * - Thread management with follow-up support
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DoubtThread {
  id: string;
  user_id: string;
  title_en: string;
  title_hi?: string;
  subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'CSAT' | 'General';
  topic?: string;
  status: 'open' | 'answered' | 'resolved' | 'flagged';
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata: Record<string, unknown>;
}

export interface DoubtQuestion {
  id: string;
  thread_id: string;
  user_id: string;
  question_text: string;
  question_html?: string;
  attachments: Array<{
    type: 'image' | 'audio' | 'document';
    url: string;
    ocr_text?: string;
    transcription?: string;
  }>;
  word_count: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DoubtAnswer {
  id: string;
  thread_id: string;
  question_id: string;
  answer_text: string;
  answer_html?: string;
  sources: Array<{
    title: string;
    url?: string;
    type: 'content_library' | 'notes' | 'ca' | 'ncert';
  }>;
  ai_provider: string;
  response_time_ms: number;
  word_count: number;
  is_followup: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DoubtRating {
  id: string;
  answer_id: string;
  user_id: string;
  rating: number;
  feedback_text?: string;
  is_helpful: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DoubtUsage {
  month: string;
  text_doubts: number;
  image_doubts: number;
  voice_doubts: number;
  total_doubts: number;
  limit_remaining: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const createDoubtSchema = z.object({
  title: z.object({
    en: z.string().min(5).max(200),
    hi: z.string().max(200).optional(),
  }),
  subject: z.enum(['GS1', 'GS2', 'GS3', 'GS4', 'Essay', 'Optional', 'CSAT', 'General']),
  topic: z.string().max(100).optional(),
  question: z.string().min(10).max(2000),
  attachments: z.array(
    z.object({
      type: z.enum(['image', 'audio', 'document']),
      url: z.string().url(),
      ocr_text: z.string().optional(),
      transcription: z.string().optional(),
    })
  ).optional(),
});

export const followupSchema = z.object({
  thread_id: z.string().uuid(),
  question: z.string().min(10).max(2000),
  attachments: z.array(
    z.object({
      type: z.enum(['image', 'audio', 'document']),
      url: z.string().url(),
      ocr_text: z.string().optional(),
      transcription: z.string().optional(),
    })
  ).optional(),
});

export const ratingSchema = z.object({
  answer_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback_text: z.string().max(500).optional(),
  is_helpful: z.boolean().optional(),
  is_flagged: z.boolean().optional(),
  flag_reason: z.string().max(200).optional(),
});

// ============================================================================
// DOUBT SERVICE
// ============================================================================

export class DoubtService {
  

  constructor() {
  }

  private async getSupabase() {
    return createClient();
  }

  // ============================================================================
  // CREATE DOUBT THREAD
  // ============================================================================

  async createDoubt(
    userId: string,
    data: z.infer<typeof createDoubtSchema>
  ): Promise<{ threadId: string; questionId: string; error?: string }> {
    try {
      // Check usage limits
      const usage = await this.getUserUsage(userId);
      if (usage.limit_remaining <= 0) {
        return {
          threadId: '',
          questionId: '',
          error: 'Monthly doubt limit reached. Upgrade to premium for unlimited doubts.',
        };
      }

      // Create thread
      const { data: thread, error: threadError } = await (await this.getSupabase())
        .from('doubt_threads')
        .insert({
          user_id: userId,
          title_en: data.title.en,
          title_hi: data.title.hi,
          subject: data.subject,
          topic: data.topic,
          status: 'open',
          is_bookmarked: false,
          metadata: {},
        })
        .select()
        .single();

      if (threadError || !thread) {
        console.error('Failed to create thread:', threadError);
        return {
          threadId: '',
          questionId: '',
          error: 'Failed to create doubt thread',
        };
      }

      // Create question
      const attachments = data.attachments?.map(att => ({
        type: att.type,
        url: att.url,
        ocr_text: att.ocr_text,
        transcription: att.transcription,
      })) || [];

      const { data: question, error: questionError } = await (await this.getSupabase())
        .from('doubt_questions')
        .insert({
          thread_id: thread.id,
          user_id: userId,
          question_text: data.question,
          question_html: null,
          attachments,
          word_count: data.question.split(/\s+/).length,
          metadata: {},
        })
        .select()
        .single();

      if (questionError || !question) {
        console.error('Failed to create question:', questionError);
        // Rollback thread
        await (await this.getSupabase()).from('doubt_threads').delete().eq('id', thread.id);
        return {
          threadId: '',
          questionId: '',
          error: 'Failed to create question',
        };
      }

      // Create attachments records
      if (attachments.length > 0) {
        const attachmentRecords = attachments.map(att => ({
          question_id: question.id,
          user_id: userId,
          file_type: att.type,
          file_url: att.url,
          ocr_text: att.ocr_text,
          transcription: att.transcription,
        }));

        await (await this.getSupabase()).from('doubt_attachments').insert(attachmentRecords);
      }

      return {
        threadId: thread.id,
        questionId: question.id,
      };
    } catch (error) {
      console.error('Error creating doubt:', error);
      return {
        threadId: '',
        questionId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // GET DOUBT THREAD
  // ============================================================================

  async getThread(threadId: string, userId: string): Promise<{
    thread: DoubtThread | null;
    questions: DoubtQuestion[];
    answers: DoubtAnswer[];
    error?: string;
  }> {
    try {
      // Get thread
      const { data: thread, error: threadError } = await (await this.getSupabase())
        .from('doubt_threads')
        .select('*')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (threadError || !thread) {
        return {
          thread: null,
          questions: [],
          answers: [],
          error: 'Thread not found',
        };
      }

      // Get questions
      const { data: questions } = await (await this.getSupabase())
        .from('doubt_questions')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      // Get answers
      const { data: answers } = await (await this.getSupabase())
        .from('doubt_answers')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      return {
        thread,
        questions: questions || [],
        answers: answers || [],
      };
    } catch (error) {
      console.error('Error getting thread:', error);
      return {
        thread: null,
        questions: [],
        answers: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // ADD FOLLOW-UP QUESTION
  // ============================================================================

  async addFollowUp(
    threadId: string,
    userId: string,
    question: string
  ): Promise<{ questionId: string; error?: string }> {
    try {
      // Verify thread exists and belongs to user
      const { data: thread } = await (await this.getSupabase())
        .from('doubt_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (!thread) {
        return {
          questionId: '',
          error: 'Thread not found',
        };
      }

      // Get latest question for context
      const { data: latestQuestion } = await (await this.getSupabase())
        .from('doubt_questions')
        .select('id')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestQuestion) {
        return {
          questionId: '',
          error: 'No questions found in thread',
        };
      }

      // Create follow-up question
      const { data: questionRecord, error: questionError } = await (await this.getSupabase())
        .from('doubt_questions')
        .insert({
          thread_id: threadId,
          user_id: userId,
          question_text: question,
          question_html: null,
          attachments: [],
          word_count: question.split(/\s+/).length,
          metadata: { is_followup: true },
        })
        .select()
        .single();

      if (questionError || !questionRecord) {
        return {
          questionId: '',
          error: 'Failed to create follow-up question',
        };
      }

      return {
        questionId: questionRecord.id,
      };
    } catch (error) {
      console.error('Error adding follow-up:', error);
      return {
        questionId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // SAVE ANSWER
  // ============================================================================

  async saveAnswer(
    threadId: string,
    questionId: string,
    answerText: string,
    aiProvider: string,
    responseTimeMs: number,
    sources: Array<{ title: string; url?: string; type: string }> = []
  ): Promise<{ answerId: string; error?: string }> {
    try {
      const { data: answer, error: answerError } = await (await this.getSupabase())
        .from('doubt_answers')
        .insert({
          thread_id: threadId,
          question_id: questionId,
          answer_text: answerText,
          answer_html: null,
          sources,
          ai_provider: aiProvider,
          response_time_ms: responseTimeMs,
          word_count: answerText.split(/\s+/).length,
          is_followup: false,
          metadata: {},
        })
        .select()
        .single();

      if (answerError || !answer) {
        console.error('Failed to save answer:', answerError);
        return {
          answerId: '',
          error: 'Failed to save answer',
        };
      }

      return {
        answerId: answer.id,
      };
    } catch (error) {
      console.error('Error saving answer:', error);
      return {
        answerId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // RATE ANSWER
  // ============================================================================

  async rateAnswer(
    answerId: string,
    userId: string,
    data: z.infer<typeof ratingSchema>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already rated
      const { data: existing } = await (await this.getSupabase())
        .from('doubt_ratings')
        .select('id')
        .eq('answer_id', answerId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing rating
        const { error: updateError } = await (await this.getSupabase())
          .from('doubt_ratings')
          .update({
            rating: data.rating,
            feedback_text: data.feedback_text,
            is_helpful: data.is_helpful,
            is_flagged: data.is_flagged,
            flag_reason: data.flag_reason,
            updated_at: new Date().toISOString(),
          })
          .eq('answer_id', answerId)
          .eq('user_id', userId);

        if (updateError) {
          return { success: false, error: 'Failed to update rating' };
        }
      } else {
        // Insert new rating
        const { error: insertError } = await (await this.getSupabase())
          .from('doubt_ratings')
          .insert({
            answer_id: answerId,
            user_id: userId,
            rating: data.rating,
            feedback_text: data.feedback_text,
            is_helpful: data.is_helpful,
            is_flagged: data.is_flagged,
            flag_reason: data.flag_reason,
          });

        if (insertError) {
          return { success: false, error: 'Failed to save rating' };
        }
      }

      // If flagged, update thread status
      if (data.is_flagged) {
        await (await this.getSupabase())
          .from('doubt_threads')
          .update({ status: 'flagged' })
          .eq('id', answerId)
          .in('id', (await this.getSupabase())
            .from('doubt_answers')
            .select('thread_id')
            .eq('id', answerId)
          );
      }

      return { success: true };
    } catch (error) {
      console.error('Error rating answer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // GET USER USAGE
  // ============================================================================

  async getUserUsage(userId: string): Promise<DoubtUsage> {
    try {
      const { data, error } = await (await this.getSupabase()).rpc('get_doubt_usage_for_user', {
        user_uuid: userId,
      });

      if (error || !data || data.length === 0) {
        // Return default (free tier with full limit)
        return {
          month: new Date().toISOString().slice(0, 7),
          text_doubts: 0,
          image_doubts: 0,
          voice_doubts: 0,
          total_doubts: 0,
          limit_remaining: 10, // Free tier limit
        };
      }

      return data[0] as DoubtUsage;
    } catch (error) {
      console.error('Error getting usage:', error);
      return {
        month: new Date().toISOString().slice(0, 7),
        text_doubts: 0,
        image_doubts: 0,
        voice_doubts: 0,
        total_doubts: 0,
        limit_remaining: 10,
      };
    }
  }

  // ============================================================================
  // GET DOUBT HISTORY
  // ============================================================================

  async getHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      subject?: string;
      status?: string;
      search?: string;
    } = {}
  ): Promise<{
    threads: DoubtThread[];
    total: number;
    error?: string;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = (await this.getSupabase())
        .from('doubt_threads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.subject) {
        query = query.eq('subject', options.subject);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.search) {
        // Full-text search would be better, but using simple filter for now
        query = query.or(`title_en.ilike.%${options.search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: threads, error, count } = await query;

      if (error) {
        return {
          threads: [],
          total: 0,
          error: error.message,
        };
      }

      return {
        threads: threads || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error getting history:', error);
      return {
        threads: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // DELETE THREAD
  // ============================================================================

  async deleteThread(threadId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify ownership
      const { data: thread } = await (await this.getSupabase())
        .from('doubt_threads')
        .select('id')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (!thread) {
        return { success: false, error: 'Thread not found' };
      }

      // Delete (cascade will handle related records)
      const { error: deleteError } = await (await this.getSupabase())
        .from('doubt_threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting thread:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // TOGGLE BOOKMARK
  // ============================================================================

  async toggleBookmark(threadId: string, userId: string): Promise<{ isBookmarked: boolean; error?: string }> {
    try {
      // Get current state
      const { data: thread } = await (await this.getSupabase())
        .from('doubt_threads')
        .select('is_bookmarked')
        .eq('id', threadId)
        .eq('user_id', userId)
        .single();

      if (!thread) {
        return { isBookmarked: false, error: 'Thread not found' };
      }

      // Toggle
      const newBookmarkState = !thread.is_bookmarked;

      const { error: updateError } = await (await this.getSupabase())
        .from('doubt_threads')
        .update({ is_bookmarked: newBookmarkState })
        .eq('id', threadId)
        .eq('user_id', userId);

      if (updateError) {
        return { isBookmarked: false, error: updateError.message };
      }

      return { isBookmarked: newBookmarkState };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return {
        isBookmarked: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const doubtService = new DoubtService();
