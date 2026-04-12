/**
 * AI Answer Generator Service
 *
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Calls Supabase Edge Function (doubt-solver-pipe) for AI generation
 * - Edge Function uses callAI() with 9Router→Groq→Ollama fallback
 * - RAG-grounded responses from content library, notes, CA
 * - NO duplicate provider logic - Edge Function is single source of truth
 */

import { ragSearch } from './rag-search';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnswerRequest {
  question: string;
  subject?: string;
  topic?: string;
  context?: string;
  attachments?: Array<{
    type: 'image' | 'audio';
    ocr_text?: string;
    transcription?: string;
  }>;
  language?: 'en' | 'hi' | 'bilingual';
}

export interface GeneratedAnswer {
  text: string;
  textHi?: string;
  sources: Array<{
    title: string;
    url?: string;
    type: 'content_library' | 'notes' | 'ca' | 'ncert';
    relevanceScore: number;
  }>;
  aiProvider: string;
  responseTimeMs: number;
  wordCount: number;
  followUpQuestions?: string[];
  keyPoints?: string[];
}

// ============================================================================
// ANSWER GENERATOR SERVICE
// ============================================================================

export class AnswerGeneratorService {
  private edgeFunctionUrl: string;

  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL
      || `${baseUrl}/functions/v1/doubt-solver-pipe`;
  }

  /**
   * Generate AI-powered answer by calling Edge Function
   */
  async generateAnswer(request: AnswerRequest): Promise<GeneratedAnswer> {
    const startTime = Date.now();

    const ragResults = await this.searchContext(request);
    const aiResponse = await this.callEdgeFunction(request, ragResults);

    if (!aiResponse.success || !aiResponse.data) {
      throw new Error(`Edge Function call failed: ${aiResponse.error}`);
    }

    const structuredAnswer = this.parseEdgeFunctionResponse(aiResponse.data, ragResults);
    structuredAnswer.responseTimeMs = Date.now() - startTime;
    structuredAnswer.wordCount = structuredAnswer.text.split(/\s+/).length;

    return structuredAnswer;
  }

  /**
   * Call Supabase Edge Function for AI generation
   */
  private async callEdgeFunction(
    request: AnswerRequest,
    ragResults: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const contextChunks = ragResults.documents
        ?.map((doc: any) => `[Source: ${doc.metadata.source}]\n${doc.content}`)
        .join('\n\n') || '';

      const payload = {
        question: request.question,
        subject: request.subject || 'General',
        topic: request.topic,
        context: contextChunks,
        language: request.language || 'en',
        attachments: request.attachments,
      };

      const authToken = await this.getAuthToken();

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Source': 'nextjs-api',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function error:', response.status, errorText);
        return {
          success: false,
          error: `Edge Function returned ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Edge Function call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get auth token for Edge Function call
   */
  private async getAuthToken(): Promise<string> {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  }

  /**
   * Parse Edge Function response into GeneratedAnswer
   */
  private parseEdgeFunctionResponse(data: any, ragResults: any): GeneratedAnswer {
    const answerData = data.data || data;

    const sources = (ragResults.documents || []).map((doc: any) => ({
      title: doc.metadata?.source || doc.metadata?.title || 'Unknown Source',
      url: doc.metadata?.url,
      type: doc.metadata?.source_type || 'content_library',
      relevanceScore: doc.score || 0,
    }));

    return {
      text: answerData.answer || answerData.text || '',
      textHi: answerData.answerHi,
      sources,
      aiProvider: data.provider || 'callAI',
      responseTimeMs: 0,
      wordCount: 0,
      followUpQuestions: answerData.followUpQuestions || answerData.follow_up_questions || [],
      keyPoints: answerData.keyPoints || answerData.key_points || [],
    };
  }

  /**
   * Search context using RAG
   */
  private async searchContext(request: AnswerRequest) {
    const searchQuery = this.buildSearchQuery(request);

    try {
      const results = await ragSearch.search({
        query: searchQuery,
        limit: 5,
        sources: ['content_library', 'notes', 'ca', 'ncert'],
        subject: request.subject,
      });

      return results;
    } catch (error) {
      console.error('RAG search failed:', error);
      return { documents: [], total: 0 };
    }
  }

  /**
   * Build search query from request
   */
  private buildSearchQuery(request: AnswerRequest): string {
    let query = request.question;

    if (request.attachments) {
      const attachmentText = request.attachments
        .map(att => att.ocr_text || att.transcription || '')
        .filter(Boolean)
        .join(' ');

      if (attachmentText) {
        query = `${query} ${attachmentText}`;
      }
    }

    if (request.subject) {
      query = `${request.subject}: ${query}`;
    }

    return query;
  }
}

export const answerGenerator = new AnswerGeneratorService();
