/**
 * MCQ Explanation Generator Service
 *
 * Master Prompt v8.0 - Feature F7 (READ Mode)
 * - AI-powered answer explanations
 * - Bilingual (EN+HI) with SIMPLIFIED_LANGUAGE_PROMPT
 * - RAG-grounded with content library references
 * - Key points extraction
 * - Related concepts linking
 * - 9Router → Groq → Ollama fallback
 */

import { createClient } from '@/lib/supabase/server';
import { callAI } from '@/lib/ai/ai-provider-client';
import type { Question } from './question-bank';

// ============================================================================
// TYPES
// ============================================================================

export interface ExplanationRequest {
  question: Question;
  selectedOption: number;
  isCorrect: boolean;
  userId: string;
}

export interface Explanation {
  correctAnswer: number;
  isUserCorrect: boolean;
  explanation: {
    en: string;
    hi: string;
  };
  keyPoints: {
    en: string[];
    hi: string[];
  };
  whyCorrect: {
    en: string;
    hi: string;
  };
  whyIncorrect: {
    en: string;
    hi: string;
  };
  relatedConcepts: Array<{
    title: string;
    url?: string;
    type: 'note' | 'ca' | 'video';
  }>;
  sources: Array<{
    title: string;
    url?: string;
    page?: string;
  }>;
  generatedAt: string;
}

export interface SimplifiedPromptConfig {
  readingLevel: '10th-class' | 'simple' | 'technical';
  maxLength: number;
  includeExamples: boolean;
  bilingual: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PROMPT_CONFIG: SimplifiedPromptConfig = {
  readingLevel: '10th-class',
  maxLength: 500,
  includeExamples: true,
  bilingual: true,
};

const SIMPLIFIED_LANGUAGE_SYSTEM_PROMPT = `You are an expert UPSC educator explaining answers to students.

CRITICAL RULES:
1. Use SIMPLE language (10th-class reading level)
2. Avoid complex jargon - explain technical terms simply
3. Use short sentences (max 20 words)
4. Use active voice
5. Provide clear, direct explanations
6. Include real-world examples when helpful
7. Be bilingual (English + Hindi)

FORMAT:
- Start with direct answer
- Explain WHY it's correct
- Explain WHY others are wrong
- List 3-5 key points
- Link to related concepts

TONE:
- Friendly and encouraging
- Like a helpful teacher
- Never condescending
- Build confidence`;

// ============================================================================
// EXPLANATION GENERATOR SERVICE
// ============================================================================

export class ExplanationGeneratorService {
  constructor() {
    // callAI is used directly as a module-level function
  }

  private async getSupabase() {
    return createClient();
  }

  /**
   * Generate explanation for MCQ answer
   */
  async generateExplanation(request: ExplanationRequest): Promise<Explanation> {
    try {
      const { question, selectedOption, isCorrect, userId } = request;

      // Check if explanation exists in database
      if (question.explanation) {
        return this.buildExistingExplanation(question, selectedOption, isCorrect);
      }

      // Generate AI explanation
      const aiExplanation = await this.generateAIExplanation(question, selectedOption, isCorrect);

      // Search for related content (RAG)
      const relatedContent = await this.findRelatedContent(question, userId);

      // Build final explanation
      return this.buildExplanation(
        question,
        aiExplanation,
        relatedContent,
        selectedOption,
        isCorrect
      );
    } catch (error) {
      console.error('ExplanationGeneratorService.generateExplanation error:', error);
      return this.getFallbackExplanation(
        request.question,
        request.selectedOption,
        request.isCorrect
      );
    }
  }

  /**
   * Generate AI-powered explanation
   */
  private async generateAIExplanation(
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ): Promise<{ en: string; hi: string; keyPoints: string[] }> {
    try {
      const prompt = this.buildExplanationPrompt(question, selectedOption, isCorrect);

      const response = await callAI(prompt, {
        system: SIMPLIFIED_LANGUAGE_SYSTEM_PROMPT,
        temperature: 0.3,
        maxTokens: 800,
      });

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('ExplanationGeneratorService.generateAIExplanation error:', error);
      return {
        en: 'Explanation generation failed. Please try again.',
        hi: 'व्याख्या जनरेशन विफल। कृपया पुनः प्रयास करें।',
        keyPoints: ['Technical error occurred'],
      };
    }
  }

  /**
   * Build prompt for AI explanation
   */
  private buildExplanationPrompt(
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ): string {
    const questionText = question.questionText.en;
    const options = question.options.map((o, i) => `${i + 1}. ${o.text.en}`).join('\n');
    const correctOptionText = question.options[question.correctOption - 1].text.en;
    const selectedOptionText = question.options[selectedOption - 1]?.text.en || 'Not answered';

    return `
QUESTION: ${questionText}

OPTIONS:
${options}

CORRECT ANSWER: Option ${question.correctOption} - ${correctOptionText}
USER'S ANSWER: Option ${selectedOption} - ${selectedOptionText}
USER IS: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

SUBJECT: ${question.subject}
TOPIC: ${question.topic}
DIFFICULTY: ${question.difficulty}

Generate a clear explanation that:
1. Explains why the correct answer is correct
2. Explains why the user's answer ${isCorrect ? 'is also correct' : 'is incorrect'}
3. Provides 3-5 key learning points
4. Uses simple language (10th-class level)
5. Includes Hindi translation

Format:
ENGLISH_EXPLANATION: ...
HINDI_EXPLANATION: ...
KEY_POINTS:
- Point 1
- Point 2
- Point 3
`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): { en: string; hi: string; keyPoints: string[] } {
    try {
      const enMatch = response.match(/ENGLISH_EXPLANATION:\s*([\s\S]*?)(?:HINDI_EXPLANATION:|$)/i);
      const hiMatch = response.match(/HINDI_EXPLANATION:\s*([\s\S]*?)(?:KEY_POINTS:|$)/i);
      const pointsMatch = response.match(/KEY_POINTS:\s*([\s\S]*?)(?:$|RELATED)/i);

      const en = enMatch ? enMatch[1].trim() : response;
      const hi = hiMatch ? hiMatch[1].trim() : 'व्याख्या उपलब्ध नहीं है';

      const keyPoints = pointsMatch
        ? pointsMatch[1]
            .split('\n')
            .filter((line) => line.trim().startsWith('-'))
            .map((line) => line.replace(/^-\s*/, '').trim())
        : ['Key concept explained'];

      return { en, hi, keyPoints };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        en: response,
        hi: 'व्याख्या उपलब्ध नहीं है',
        keyPoints: ['See explanation above'],
      };
    }
  }

  /**
   * Find related content from content library (RAG)
   */
  private async findRelatedContent(
    question: Question,
    userId: string
  ): Promise<{
    notes: Array<{ title: string; id: string }>;
    currentAffairs: Array<{ title: string; id: string }>;
    videos: Array<{ title: string; id: string }>;
  }> {
    try {
      const supabase = await this.getSupabase();

      // Search notes library
      const { data: notes } = await supabase
        .from('user_notes')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${question.topic}%`)
        .limit(3);

      // Search current affairs
      const { data: ca } = await supabase
        .from('ca_articles')
        .select('id, title')
        .ilike('title', `%${question.topic}%`)
        .limit(3);

      // Search videos
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title')
        .ilike('title', `%${question.topic}%`)
        .limit(3);

      return {
        notes:
          notes?.map((n) => ({
            title: typeof n.title === 'string' ? n.title : (n.title as any)?.en || 'Note',
            id: n.id,
          })) || [],
        currentAffairs:
          ca?.map((c) => ({
            title: typeof c.title === 'string' ? c.title : (c.title as any)?.en || 'Article',
            id: c.id,
          })) || [],
        videos:
          videos?.map((v) => ({
            title: typeof v.title === 'string' ? v.title : (v.title as any)?.en || 'Video',
            id: v.id,
          })) || [],
      };
    } catch (error) {
      console.error('ExplanationGeneratorService.findRelatedContent error:', error);
      return { notes: [], currentAffairs: [], videos: [] };
    }
  }

  /**
   * Build final explanation object
   */
  private buildExplanation(
    question: Question,
    aiExplanation: { en: string; hi: string; keyPoints: string[] },
    relatedContent: any,
    selectedOption: number,
    isCorrect: boolean
  ): Explanation {
    const correctOptionText = question.options[question.correctOption - 1].text.en;
    const selectedOptionText = question.options[selectedOption - 1]?.text.en || 'Not answered';

    return {
      correctAnswer: question.correctOption,
      isUserCorrect: isCorrect,
      explanation: {
        en: aiExplanation.en,
        hi: aiExplanation.hi,
      },
      keyPoints: {
        en: aiExplanation.keyPoints,
        hi: aiExplanation.keyPoints, // Same points, would need separate Hindi generation
      },
      whyCorrect: {
        en: `Option ${question.correctOption} is correct because: ${correctOptionText}`,
        hi: `विकल्प ${question.correctOption} सही है क्योंकि: ${question.options[question.correctOption - 1].text.hi}`,
      },
      whyIncorrect: {
        en: isCorrect
          ? `Your answer (Option ${selectedOption}) is correct!`
          : `Option ${selectedOption} is incorrect. ${selectedOptionText}`,
        hi: isCorrect
          ? `आपका उत्तर (विकल्प ${selectedOption}) सही है!`
          : `विकल्प ${selectedOption} गलत है। ${selectedOptionText}`,
      },
      relatedConcepts: [
        ...relatedContent.notes.map((n: { title: string; id: string }) => ({
          title: n.title,
          type: 'note' as const,
        })),
        ...relatedContent.currentAffairs.map((c: { title: string; id: string }) => ({
          title: c.title,
          type: 'ca' as const,
        })),
        ...relatedContent.videos.map((v: { title: string; id: string }) => ({
          title: v.title,
          type: 'video' as const,
        })),
      ],
      sources: question.sourceReferences || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build explanation from existing database explanation
   */
  private buildExistingExplanation(
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ): Explanation {
    const explanation = question.explanation;
    const correctOptionText = question.options[question.correctOption - 1].text.en;
    const selectedOptionText = question.options[selectedOption - 1]?.text.en || 'Not answered';

    return {
      correctAnswer: question.correctOption,
      isUserCorrect: isCorrect,
      explanation: {
        en: typeof explanation?.en === 'string' ? explanation.en : 'See explanation below',
        hi: typeof explanation?.hi === 'string' ? explanation.hi : 'व्याख्या नीचे देखें',
      },
      keyPoints: {
        en: explanation?.keyPoints || [],
        hi: explanation?.keyPoints || [],
      },
      whyCorrect: {
        en: `Option ${question.correctOption} is correct: ${correctOptionText}`,
        hi: `विकल्प ${question.correctOption} सही है: ${question.options[question.correctOption - 1].text.hi}`,
      },
      whyIncorrect: {
        en: isCorrect
          ? `Your answer (Option ${selectedOption}) is correct!`
          : `Option ${selectedOption} is incorrect: ${selectedOptionText}`,
        hi: isCorrect
          ? `आपका उत्तर (विकल्प ${selectedOption}) सही है!`
          : `विकल्प ${selectedOption} गलत है: ${selectedOptionText}`,
      },
      relatedConcepts: [],
      sources: question.sourceReferences || [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get fallback explanation when AI fails
   */
  private getFallbackExplanation(
    question: Question,
    selectedOption: number,
    isCorrect: boolean
  ): Explanation {
    const correctOptionText = question.options[question.correctOption - 1].text.en;
    const selectedOptionText = question.options[selectedOption - 1]?.text.en || 'Not answered';

    return {
      correctAnswer: question.correctOption,
      isUserCorrect: isCorrect,
      explanation: {
        en: `The correct answer is Option ${question.correctOption}: ${correctOptionText}. Review the topic ${question.topic} for better understanding.`,
        hi: `सही उत्तर विकल्प ${question.correctOption} है: ${question.options[question.correctOption - 1].text.hi}। बेहतर समझ के लिए ${question.topic} विषय की समीक्षा करें।`,
      },
      keyPoints: {
        en: ['Review the topic', 'Understand key concepts', 'Practice more questions'],
        hi: ['विषय की समीक्षा करें', 'मुख्य अवधारणाओं को समझें', 'अधिक प्रश्नों का अभ्यास करें'],
      },
      whyCorrect: {
        en: `Option ${question.correctOption} is correct: ${correctOptionText}`,
        hi: `विकल्प ${question.correctOption} सही है: ${question.options[question.correctOption - 1].text.hi}`,
      },
      whyIncorrect: {
        en: isCorrect
          ? `Your answer is correct!`
          : `Option ${selectedOption} is incorrect: ${selectedOptionText}`,
        hi: isCorrect
          ? `आपका उत्तर सही है!`
          : `विकल्प ${selectedOption} गलत है: ${selectedOptionText}`,
      },
      relatedConcepts: [],
      sources: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const explanationGenerator = new ExplanationGeneratorService();
