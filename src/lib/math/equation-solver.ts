// ═══════════════════════════════════════════════════════════════
// MATH SOLVER SERVICE
// AI-powered math equation solver
// ═══════════════════════════════════════════════════════════════

import { aiRouter } from '@/lib/ai/provider-router';
import { createClient } from '@/lib/supabase/server';

export interface MathSolution {
    equation: string;
    solution: string;
    steps: SolutionStep[];
    verification: string;
}

export interface SolutionStep {
    step: number;
    explanation: string;
    result: string;
}

/**
 * Solve math equation using AI
 */
export async function solveEquation(equation: string): Promise<MathSolution> {
    const prompt = `Solve this mathematical equation step-by-step for UPSC aspirants:

Equation: ${equation}

Provide detailed solution in JSON format:
{
  "solution": "final answer",
  "steps": [
    {"step": 1, "explanation": "describe what we're doing", "result": "partial result"},
    ...
  ],
  "verification": "verify the answer"
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [
            {
                role: 'system',
                content: 'You are a mathematics tutor. Provide clear step-by-step solutions.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
        equation,
        solution: parsed.solution || '',
        steps: parsed.steps || [],
        verification: parsed.verification || ''
    };
}

/**
 * Save solution to database
 */
export async function saveSolution(
    userId: string,
    equation: string,
    solution: MathSolution
): Promise<void> {
    const supabase = await createClient();

    await (supabase.from('math_solutions') as any).insert({
        user_id: userId,
        equation,
        solution: solution.solution,
        steps: solution.steps
    });
}
