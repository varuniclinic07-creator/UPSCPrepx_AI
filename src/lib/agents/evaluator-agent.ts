import { BaseAgent } from './base-agent';
import { callAI } from '../ai/ai-provider-client';

export interface EvaluationResult {
  score: number; // 0-10
  feedback: {
    content: string;
    structure: string;
    analysis: string;
    conclusion: string;
  };
  modelAnswer: string;
  improvementPlan: string[];
  confidence: number;
}

export interface DoubtAnswer {
  answer: string;
  sources: Array<{ title: string; url?: string }>;
  relatedTopics: string[];
  confidence: number;
}

class EvaluatorAgent extends BaseAgent {
  constructor() {
    super('evaluator');
  }

  /** Generic execute() for orchestrator dispatch */
  async execute(params: Record<string, any>): Promise<any> {
    if (params.answerText) {
      return this.evaluateAnswer(params as any);
    }
    if (params.question) {
      return this.answerDoubt(params as any);
    }
    throw new Error('EvaluatorAgent.execute: provide answerText (evaluation) or question (doubt)');
  }

  async evaluateAnswer(params: {
    questionId: string;
    answerText: string;
    topic?: string;
    subject?: string;
  }): Promise<EvaluationResult> {
    const { questionId, answerText, topic, subject } = params;

    const runId = await this.startRun();

    try {
      const systemPrompt = [
        'You are a senior UPSC Mains answer evaluator.',
        'Evaluate the given answer on these 4 criteria (each scored 0-10):',
        '1. Content Accuracy: Factual correctness, relevant points, use of data/examples.',
        '2. Structure: Introduction, body paragraphs, logical flow, conclusion.',
        '3. Analysis Depth: Critical thinking, multiple perspectives, interlinkages.',
        '4. Conclusion: Balanced view, forward-looking, policy implications.',
        '',
        'Return ONLY valid JSON:',
        '{',
        '  "score": number (0-10, weighted average),',
        '  "feedback": {',
        '    "content": "detailed feedback on content accuracy",',
        '    "structure": "feedback on answer structure",',
        '    "analysis": "feedback on analytical depth",',
        '    "conclusion": "feedback on conclusion quality"',
        '  },',
        '  "modelAnswer": "a concise model answer for comparison",',
        '  "improvementPlan": ["specific actionable improvement 1", "improvement 2", ...]',
        '}',
      ].join('\n');

      const userPrompt = [
        questionId ? `Question ID: ${questionId}` : '',
        topic ? `Topic: ${topic}` : '',
        subject ? `Subject: ${subject}` : '',
        '',
        'Student Answer:',
        answerText,
      ]
        .filter(Boolean)
        .join('\n');

      const rawResponse = await callAI({
        systemPrompt,
        userPrompt,
        skipSimplifiedLanguage: true,
        providerPreferences: this.getProviderPreferences(),
      });

      const result = this.parseEvaluationResult(rawResponse);

      await this.completeRun('completed', { content_generated: 1 });
      return result;
    } catch (error) {
      this.log('error', `Answer evaluation failed: ${error}`);
      await this.completeRun('failed', { errors: [`${error}`] });
      throw error;
    }
  }

  async answerDoubt(params: {
    question: string;
    subject?: string;
    context?: string;
  }): Promise<DoubtAnswer> {
    const { question, subject, context } = params;

    const runId = await this.startRun();

    try {
      const systemPrompt = [
        'You are a UPSC subject matter expert and doubt-resolver.',
        'Answer the student\'s doubt comprehensively but concisely.',
        'Always cite credible sources (NCERT, Laxmikanth, Spectrum, government publications, etc.).',
        'Suggest related UPSC topics the student should study.',
        '',
        'Return ONLY valid JSON:',
        '{',
        '  "answer": "comprehensive answer text",',
        '  "sources": [{"title": "source name", "url": "optional url"}],',
        '  "relatedTopics": ["related UPSC topic 1", "topic 2", ...]',
        '}',
      ].join('\n');

      const userPrompt = [
        subject ? `Subject: ${subject}` : '',
        context ? `Context: ${context}` : '',
        '',
        'Student Question:',
        question,
      ]
        .filter(Boolean)
        .join('\n');

      const rawResponse = await callAI({
        systemPrompt,
        userPrompt,
        skipSimplifiedLanguage: true,
        providerPreferences: this.getProviderPreferences(),
      });

      const result = this.parseDoubtAnswer(rawResponse);

      await this.completeRun('completed', { content_generated: 1 });
      return result;
    } catch (error) {
      this.log('error', `Doubt answering failed: ${error}`);
      await this.completeRun('failed', { errors: [`${error}`] });
      throw error;
    }
  }

  private parseEvaluationResult(raw: string): EvaluationResult {
    const defaultResult: EvaluationResult = {
      score: 0,
      feedback: {
        content: 'Unable to evaluate',
        structure: 'Unable to evaluate',
        analysis: 'Unable to evaluate',
        conclusion: 'Unable to evaluate',
      },
      modelAnswer: '',
      improvementPlan: [],
      confidence: 0,
    };

    try {
      const parsed = JSON.parse(raw);
      return this.validateEvaluationResult(parsed);
    } catch {
      // Try extracting JSON from wrapped text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateEvaluationResult(parsed);
        } catch {
          this.log('warn', 'Failed to parse extracted evaluation JSON');
        }
      }
    }

    this.log('warn', 'Could not parse evaluation response, returning default');
    return defaultResult;
  }

  private validateEvaluationResult(parsed: Record<string, unknown>): EvaluationResult {
    const feedback = parsed.feedback as Record<string, string> | undefined;

    return {
      score: typeof parsed.score === 'number' ? Math.min(10, Math.max(0, parsed.score)) : 0,
      feedback: {
        content: feedback?.content || 'No feedback available',
        structure: feedback?.structure || 'No feedback available',
        analysis: feedback?.analysis || 'No feedback available',
        conclusion: feedback?.conclusion || 'No feedback available',
      },
      modelAnswer: typeof parsed.modelAnswer === 'string' ? parsed.modelAnswer : '',
      improvementPlan: Array.isArray(parsed.improvementPlan)
        ? parsed.improvementPlan.filter((item): item is string => typeof item === 'string')
        : [],
      confidence: typeof parsed.score === 'number' ? 0.85 : 0.5,
    };
  }

  private parseDoubtAnswer(raw: string): DoubtAnswer {
    const defaultAnswer: DoubtAnswer = {
      answer: raw, // Fall back to raw text if parsing fails
      sources: [],
      relatedTopics: [],
      confidence: 0.5,
    };

    try {
      const parsed = JSON.parse(raw);
      return this.validateDoubtAnswer(parsed);
    } catch {
      // Try extracting JSON from wrapped text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateDoubtAnswer(parsed);
        } catch {
          this.log('warn', 'Failed to parse extracted doubt-answer JSON');
        }
      }
    }

    this.log('warn', 'Could not parse doubt answer response, returning raw text');
    return defaultAnswer;
  }

  private validateDoubtAnswer(parsed: Record<string, unknown>): DoubtAnswer {
    const sources = Array.isArray(parsed.sources)
      ? parsed.sources
          .filter(
            (s): s is Record<string, unknown> =>
              typeof s === 'object' && s !== null && typeof (s as Record<string, unknown>).title === 'string'
          )
          .map((s) => ({
            title: s.title as string,
            url: typeof s.url === 'string' ? s.url : undefined,
          }))
      : [];

    const relatedTopics = Array.isArray(parsed.relatedTopics)
      ? parsed.relatedTopics.filter((t): t is string => typeof t === 'string')
      : [];

    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer : 'No answer generated',
      sources,
      relatedTopics,
      confidence: sources.length > 0 ? 0.85 : 0.65,
    };
  }
}

export const evaluatorAgent = new EvaluatorAgent();
