/**
 * AI Answer Generator Service
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - AI-powered answer generation with 9Router→Groq→Ollama fallback
 * - RAG-grounded responses from content library, notes, CA
 * - SIMPLIFIED_LANGUAGE_PROMPT enforcement (10th-class level)
 * - Bilingual support (English + Hindi)
 */

import { ragSearch } from './rag-search';
import { SIMPLIFIED_LANGUAGE_PROMPT } from '../onboarding/simplified-language-prompt';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnswerRequest {
  question: string;
  subject?: string;
  topic?: string;
  context?: string; // Previous conversation context
  attachments?: Array<{
    type: 'image' | 'audio';
    ocr_text?: string;
    transcription?: string;
  }>;
  language?: 'en' | 'hi' | 'bilingual';
}

export interface GeneratedAnswer {
  text: string;
  textHi?: string; // Hindi translation
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

export interface AIProviderResponse {
  success: boolean;
  text: string;
  provider: string;
  responseTimeMs: number;
  error?: string;
}

// ============================================================================
// AI PROVIDER CONFIGURATION
// ============================================================================

const AI_PROVIDERS = {
  PRIMARY: '9router',
  FALLBACK_1: 'groq',
  FALLBACK_2: 'ollama',
} as const;

const PROVIDER_CONFIG = {
  '9router': {
    endpoint: process.env.NINE_ROUTER_ENDPOINT || 'https://api.9router.com/v1/chat/completions',
    apiKey: process.env.NINE_ROUTER_API_KEY,
    model: 'gpt-4o-mini',
    timeout: 15000,
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.1-70b-versatile',
    timeout: 10000,
  },
  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/v1/chat/completions',
    apiKey: process.env.OLLAMA_API_KEY || 'ollama',
    model: 'llama3.1:8b',
    timeout: 20000,
  },
} as const;

// ============================================================================
// SYSTEM PROMPT FOR DOUBT SOLVING
// ============================================================================

const DOUBT_SOLVER_SYSTEM_PROMPT = `You are an expert UPSC exam tutor and mentor. Your role is to:

1. Answer student doubts clearly and accurately
2. Use SIMPLIFIED_LANGUAGE_PROMPT rules (10th-class reading level)
3. Provide bilingual responses (English + Hindi) when requested
4. Ground answers in UPSC syllabus and exam context
5. Cite sources when available (NCERT, standard books, current affairs)
6. Keep answers concise but comprehensive
7. Use examples from Indian context
8. Avoid jargon or explain with simple analogies

IMPORTANT RULES:
- Max 15 words per sentence
- Explain technical terms with simple examples
- Use Hindi translations for key terms
- Structure answer with clear headings/bullet points
- Include 2-3 follow-up question suggestions
- Highlight key points for revision

SYLLABUS CONTEXT:
- GS1: History, Geography, Society
- GS2: Polity, Governance, IR
- GS3: Economy, Environment, Security
- GS4: Ethics, Integrity
- Essay: Philosophical, Social issues
- Optional: Subject-specific depth

Always prioritize accuracy and clarity over length.`;

// ============================================================================
// ANSWER GENERATOR SERVICE
// ============================================================================

export class AnswerGeneratorService {
  /**
   * Generate AI-powered answer with RAG grounding
   */
  async generateAnswer(request: AnswerRequest): Promise<GeneratedAnswer> {
    const startTime = Date.now();
    
    // Step 1: Perform RAG search for context
    const ragResults = await this.searchContext(request);
    
    // Step 2: Build enhanced prompt with RAG context
    const enhancedPrompt = this.buildEnhancedPrompt(request, ragResults);
    
    // Step 3: Generate answer with AI provider fallback chain
    const aiResponse = await this.generateWithFallback(enhancedPrompt);
    
    if (!aiResponse.success || !aiResponse.text) {
      throw new Error(`AI generation failed: ${aiResponse.error}`);
    }
    
    // Step 4: Parse and structure response
    const structuredAnswer = this.parseResponse(aiResponse.text, ragResults);
    
    // Step 5: Generate Hindi translation if bilingual
    if (request.language === 'bilingual' || request.language === 'hi') {
      structuredAnswer.textHi = await this.translateToHindi(structuredAnswer.text);
    }
    
    // Step 6: Add metadata
    structuredAnswer.aiProvider = aiResponse.provider;
    structuredAnswer.responseTimeMs = Date.now() - startTime;
    structuredAnswer.wordCount = structuredAnswer.text.split(/\s+/).length;
    
    return structuredAnswer;
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
    
    // Add context from attachments
    if (request.attachments) {
      const attachmentText = request.attachments
        .map(att => att.ocr_text || att.transcription || '')
        .filter(Boolean)
        .join(' ');
      
      if (attachmentText) {
        query = `${query} ${attachmentText}`;
      }
    }
    
    // Add subject context
    if (request.subject) {
      query = `${request.subject}: ${query}`;
    }
    
    return query;
  }

  /**
   * Build enhanced prompt with RAG context
   */
  private buildEnhancedPrompt(request: AnswerRequest, ragResults: any): string {
    let prompt = `${DOUBT_SOLVER_SYSTEM_PROMPT}\n\n`;
    
    // Add conversation context if exists
    if (request.context) {
      prompt += `PREVIOUS CONTEXT:\n${request.context}\n\n`;
    }
    
    // Add RAG context
    if (ragResults.documents && ragResults.documents.length > 0) {
      prompt += `RELEVANT CONTEXT FROM KNOWLEDGE BASE:\n`;
      ragResults.documents.forEach((doc: any, i: number) => {
        prompt += `\n[${i + 1}] Source: ${doc.metadata?.source || 'Unknown'}\n`;
        prompt += `Content: ${doc.content?.substring(0, 500)}...\n`;
      });
      prompt += `\n`;
    }
    
    // Add the actual question
    prompt += `STUDENT QUESTION:\n${request.question}\n\n`;
    
    // Add language instruction
    if (request.language === 'bilingual') {
      prompt += `LANGUAGE: Provide answer in both English and Hindi. First write in English, then provide Hindi translation.\n\n`;
    } else if (request.language === 'hi') {
      prompt += `LANGUAGE: Provide answer in Hindi only.\n\n`;
    } else {
      prompt += `LANGUAGE: Provide answer in English with Hindi translations for key terms.\n\n`;
    }
    
    // Add formatting instructions
    prompt += `FORMAT YOUR ANSWER AS:\n`;
    prompt += `1. Brief introduction (2-3 lines)\n`;
    prompt += `2. Main explanation with bullet points\n`;
    prompt += `3. Examples from Indian context\n`;
    prompt += `4. Key points for revision (3-5 bullets)\n`;
    prompt += `5. 2-3 follow-up questions for deeper understanding\n\n`;
    
    prompt += `Generate your answer now:`;
    
    return prompt;
  }

  /**
   * Generate with AI provider fallback chain
   */
  private async generateWithFallback(prompt: string): Promise<AIProviderResponse> {
    const providers = Object.keys(PROVIDER_CONFIG) as Array<keyof typeof PROVIDER_CONFIG>;
    
    for (const providerName of providers) {
      try {
        const result = await this.callProvider(providerName, prompt);
        
        if (result.success && result.text) {
          return result;
        }
        
        console.warn(`Provider ${providerName} failed, trying next...`);
      } catch (error) {
        console.error(`Provider ${providerName} error:`, error);
        // Continue to next provider
      }
    }
    
    return {
      success: false,
      text: '',
      provider: 'none',
      responseTimeMs: 0,
      error: 'All AI providers failed',
    };
  }

  /**
   * Call specific AI provider
   */
  private async callProvider(
    providerName: keyof typeof PROVIDER_CONFIG,
    prompt: string
  ): Promise<AIProviderResponse> {
    const config = PROVIDER_CONFIG[providerName];
    const startTime = Date.now();
    
    if (!config.apiKey) {
      throw new Error(`API key not configured for ${providerName}`);
    }
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: DOUBT_SOLVER_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(config.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`Provider ${providerName} returned ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      text: data.choices?.[0]?.message?.content || '',
      provider: providerName,
      responseTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Parse AI response into structured answer
   */
  private parseResponse(text: string, ragResults: any): GeneratedAnswer {
    // Extract sections from response
    const sections = text.split(/\n\n+/);
    
    // Build sources from RAG results
    const sources = (ragResults.documents || []).map((doc: any) => ({
      title: doc.metadata?.source || doc.metadata?.title || 'Unknown Source',
      url: doc.metadata?.url,
      type: doc.metadata?.source_type || 'content_library',
      relevanceScore: doc.score || 0,
    }));
    
    // Extract follow-up questions if present
    const followUpMatch = text.match(/follow-up questions?[\s\S]*?(\d+\.\s*.+)+/i);
    const followUpQuestions = followUpMatch
      ? followUpMatch[0].split(/\n/).filter(line => /^\d+\./.test(line.trim()))
      : [];
    
    // Extract key points
    const keyPointsMatch = text.match(/key points[\s\S]*?(\*\s*.+)+/i);
    const keyPoints = keyPointsMatch
      ? keyPointsMatch[0].split(/\n/).filter(line => /^\*|^\-|^\d+\./.test(line.trim()))
      : [];
    
    return {
      text: text.trim(),
      sources,
      aiProvider: '', // Will be set by caller
      responseTimeMs: 0,
      wordCount: 0,
      followUpQuestions: followUpQuestions.map(q => q.replace(/^\d+\.\s*/, '').trim()),
      keyPoints: keyPoints.map(p => p.replace(/^\*\s*|^-\s*|^\d+\.\s*/, '').trim()),
    };
  }

  /**
   * Translate answer to Hindi
   */
  private async translateToHindi(text: string): Promise<string> {
    try {
      const translatePrompt = `Translate the following English text to Hindi. Keep technical UPSC terms in English with Hindi explanation in brackets. Maintain the structure and formatting.\n\n${text}`;
      
      const result = await this.callProvider('groq', translatePrompt);
      return result.text || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original on failure
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const answerGenerator = new AnswerGeneratorService();
