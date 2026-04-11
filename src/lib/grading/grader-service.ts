// ═══════════════════════════════════════════════════════════════
// AI GRADER SERVICE
// Automated answer grading with rubrics
// ═══════════════════════════════════════════════════════════════

import { callAI } from '@/lib/ai/ai-provider-client';
import { createClient } from '@/lib/supabase/server';

export interface GradingRubric {
    criteria: string;
    maxPoints: number;
    description: string;
}

export interface GradingResult {
    totalScore: number;
    maxPossible: number;
    percentage: number;
    criteriaScores: CriteriaScore[];
    feedback: string;
    strengths: string[];
    improvements: string[];
}

export interface CriteriaScore {
    criteria: string;
    score: number;
    maxPoints: number;
    feedback: string;
}

const UPSC_ANSWER_RUBRIC: GradingRubric[] = [
    { criteria: 'Content Accuracy', maxPoints: 30, description: 'Factual correctness and relevance' },
    { criteria: 'Analytical Depth', maxPoints: 25, description: 'Critical thinking and analysis' },
    { criteria: 'Structure & Organization', maxPoints: 20, description: 'Logical flow and coherence' },
    { criteria: 'Language & Expression', maxPoints: 15, description: 'Clarity and articulation' },
    { criteria: 'Conclusion & Balance', maxPoints: 10, description: 'Balanced view and conclusion' }
];

/**
 * Grade an answer using AI and rubric
 */
export async function gradeAnswer(
    question: string,
    answer: string,
    maxWords: number = 250
): Promise<GradingResult> {

    const rubricText = UPSC_ANSWER_RUBRIC.map(r =>
        `${r.criteria} (${r.maxPoints} points): ${r.description}`
    ).join('\n');

    const prompt = `You are a UPSC examiner grading a Mains answer.

Question: ${question}
Answer: ${answer}
Word Limit: ${maxWords} words

Grading Rubric:
${rubricText}

Evaluate the answer on each criterion and provide:
1. Score for each criterion
2. Overall feedback
3. Strengths (2-3 points)
4. Areas for improvement (2-3 points)

Respond in JSON format:
{
  "criteriaScores": [
    {"criteria": "Content Accuracy", "score": 25, "maxPoints": 30, "feedback": "..."},
    ...
  ],
  "feedback": "overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"]
}`;

    const content = await callAI(prompt, {
        system: 'You are an experienced UPSC Mains examiner. Grade answers fairly and provide constructive feedback.',
        temperature: 0.2,
        maxTokens: 2048,
    }) || '{}';
    const parsed = JSON.parse(content);

    const totalScore = parsed.criteriaScores?.reduce((sum: number, cs: CriteriaScore) => sum + cs.score, 0) || 0;
    const maxPossible = UPSC_ANSWER_RUBRIC.reduce((sum, r) => sum + r.maxPoints, 0);

    return {
        totalScore,
        maxPossible,
        percentage: Math.round((totalScore / maxPossible) * 100),
        criteriaScores: parsed.criteriaScores || [],
        feedback: parsed.feedback || '',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || []
    };
}

/**
 * Save grading result
 */
export async function saveGradingResult(
    userId: string,
    question: string,
    answer: string,
    result: GradingResult
): Promise<void> {
    const supabase = await createClient();

    await (supabase.from('grading_history') as any).insert({
        user_id: userId,
        question,
        answer,
        total_score: result.totalScore,
        max_possible: result.maxPossible,
        percentage: result.percentage,
        criteria_scores: result.criteriaScores,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements
    });
}

/**
 * Get user's grading history
 */
export async function getGradingHistory(userId: string, limit: number = 10): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('grading_history') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
}
