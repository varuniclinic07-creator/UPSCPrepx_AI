import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  questions: QuizQuestion[];
  topic: string;
  subject: string;
  confidence: number;
}

class QuizAgent extends BaseAgent {
  constructor() {
    super('quiz');
  }

  async execute(params: {
    nodeId?: string;
    topic: string;
    subject?: string;
    questionCount?: number;
    difficulty?: string;
  }): Promise<QuizResult> {
    const {
      nodeId,
      topic,
      subject = 'General Studies',
      questionCount = 10,
      difficulty = 'medium',
    } = params;

    const runId = await this.startRun();

    try {
      const systemPrompt = [
        'Generate UPSC-style MCQs. Return ONLY a JSON array.',
        'Each object: {question, options: [4 strings], correctIndex: 0-3, explanation, difficulty: easy|medium|hard}.',
        'Questions must be factually accurate for UPSC CSE exam.',
      ].join(' ');

      const userPrompt = [
        `Generate exactly ${questionCount} multiple-choice questions on the topic: "${topic}"`,
        subject ? `Subject area: ${subject}.` : '',
        difficulty ? `Target difficulty: ${difficulty}.` : '',
        'Ensure questions cover different aspects of the topic.',
        'Each question must have exactly 4 options with one correct answer.',
        'Provide a clear explanation for each correct answer.',
      ]
        .filter(Boolean)
        .join('\n');

      const rawResponse = await callAI({
        systemPrompt,
        userPrompt,
        skipSimplifiedLanguage: true,
      });

      const questions = this.parseQuestions(rawResponse);

      const confidence = questions.length >= questionCount * 0.8 ? 0.9 : 0.7;

      if (nodeId) {
        try {
          await this.supabase.from('content_queue').insert({
            node_id: nodeId,
            content_type: 'mcq_set',
            generated_content: { questions, topic, subject },
            agent_type: 'quiz',
          });
        } catch (dbError) {
          this.log('warn', `Failed to write to content_queue: ${dbError}`);
        }
      }

      await this.completeRun('completed', { content_generated: questions.length });

      return { questions, topic, subject, confidence };
    } catch (error) {
      this.log('error', `Quiz generation failed: ${error}`);
      await this.completeRun('failed', { errors: [`${error}`] });
      throw error;
    }
  }

  private parseQuestions(raw: string): QuizQuestion[] {
    try {
      // Try direct parse first
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return this.validateQuestions(parsed);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return this.validateQuestions(parsed.questions);
      }
    } catch {
      // Try to extract JSON array from wrapped text
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) return this.validateQuestions(parsed);
        } catch {
          this.log('warn', 'Failed to parse extracted JSON array from response');
        }
      }
    }

    this.log('warn', 'Could not parse any questions from AI response');
    return [];
  }

  private validateQuestions(items: unknown[]): QuizQuestion[] {
    return items
      .filter((item): item is Record<string, unknown> => {
        if (typeof item !== 'object' || item === null) return false;
        const obj = item as Record<string, unknown>;
        return (
          typeof obj.question === 'string' &&
          Array.isArray(obj.options) &&
          obj.options.length === 4 &&
          typeof obj.correctIndex === 'number' &&
          obj.correctIndex >= 0 &&
          obj.correctIndex <= 3 &&
          typeof obj.explanation === 'string'
        );
      })
      .map((item) => ({
        question: item.question as string,
        options: (item.options as string[]).slice(0, 4) as [string, string, string, string],
        correctIndex: item.correctIndex as number,
        explanation: item.explanation as string,
        difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty as string)
          ? item.difficulty
          : 'medium') as 'easy' | 'medium' | 'hard',
      }));
  }
}

export const quizAgent = new QuizAgent();
