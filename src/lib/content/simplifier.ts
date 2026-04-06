// ═══════════════════════════════════════════════════════════════
// LANGUAGE SIMPLIFIER
// Convert complex text to 10th standard level
// ═══════════════════════════════════════════════════════════════

import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';

const client = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});

/**
 * Simplify text to target reading level
 */
export async function simplifyText(
    text: string,
    targetLevel: '10th' | '12th' = '10th'
): Promise<string> {
    await rateLimiter.waitForSlot();

    const levelDescription = targetLevel === '10th'
        ? 'simple, easy to understand for a 10th grader'
        : 'moderately complex for a 12th grader';

    try {
        const response = await client.chat.completions.create({
            model: 'provider-3/qwen-3-max',
            messages: [
                {
                    role: 'system',
                    content: `Simplify complex text to ${targetLevel} standard level. Use simple words, short sentences, and clear explanations. Keep all facts accurate.`
                },
                {
                    role: 'user',
                    content: `Simplify this UPSC content to be ${levelDescription}:

${text}

Make it easy to understand while keeping all important information.`
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || text;
    } catch (error) {
        console.error('Simplification error:', error);
        return text;
    }
}

/**
 * Simplify multiple texts in batch
 */
export async function simplifyBatch(texts: string[]): Promise<string[]> {
    const simplified: string[] = [];

    for (const text of texts) {
        const result = await simplifyText(text);
        simplified.push(result);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return simplified;
}

/**
 * Get readability score (Flesch Reading Ease)
 */
export function getReadabilityScore(text: string): number {
    // Simple readability calculation
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in text (approximate)
 */
function countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
        // Remove punctuation
        const clean = word.replace(/[^a-z]/g, '');
        if (clean.length === 0) continue;

        // Count vowel groups
        const vowelGroups = clean.match(/[aeiouy]+/g);
        let syllables = vowelGroups ? vowelGroups.length : 1;

        // Adjust for silent e
        if (clean.endsWith('e')) {
            syllables--;
        }

        totalSyllables += Math.max(1, syllables);
    }

    return totalSyllables;
}

/**
 * Get readability level description
 */
export function getReadabilityLevel(score: number): string {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (Graduate)';
}
