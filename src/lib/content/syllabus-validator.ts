// ═══════════════════════════════════════════════════════════════
// SYLLABUS VALIDATOR
// Ensure content aligns with UPSC syllabus
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';

const client = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});

export interface ValidationResult {
    isValid: boolean;
    syllabusTopics: string[];
    coverage: number; // 0-100%
    suggestions: string[];
    relevanceScore: number; // 0-1
}

/**
 * Validate content against UPSC syllabus
 */
export async function validateContent(
    content: string,
    subject: string
): Promise<ValidationResult> {
    const supabase = await createClient();

    // Get syllabus topics for subject
    const { data: topics } = await (supabase
        .from('syllabus_topics') as any)
        .select('*')
        .eq('subject_slug', subject);

    if (!topics || topics.length === 0) {
        return {
            isValid: false,
            syllabusTopics: [],
            coverage: 0,
            suggestions: ['No syllabus data found for this subject'],
            relevanceScore: 0
        };
    }

    const syllabusTopicNames = topics.map((t: any) => t.topic_name);

    // Use AI to validate content coverage
    await rateLimiter.waitForSlot();

    try {
        const response = await client.chat.completions.create({
            model: 'provider-2/qwen-3-max',
            messages: [
                {
                    role: 'system',
                    content: 'You are a UPSC syllabus expert. Analyze content against syllabus topics.'
                },
                {
                    role: 'user',
                    content: `Analyze this content against UPSC syllabus topics for ${subject}:

**Content:**
${content.substring(0, 2000)}

**Syllabus Topics:**
${syllabusTopicNames.join(', ')}

Return JSON:
{
  "coveredTopics": ["topic1", "topic2"],
  "coveragePercent": 75,
  "relevanceScore": 0.85,
  "suggestions": ["suggestion1", "suggestion2"]
}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');

        return {
            isValid: result.coveragePercent >= 50,
            syllabusTopics: result.coveredTopics || [],
            coverage: result.coveragePercent || 0,
            suggestions: result.suggestions || [],
            relevanceScore: result.relevanceScore || 0
        };
    } catch (error) {
        console.error('Validation error:', error);
        return {
            isValid: true, // Default to true on error
            syllabusTopics: [],
            coverage: 50,
            suggestions: [],
            relevanceScore: 0.5
        };
    }
}

/**
 * Get all syllabus topics for a subject
 */
export async function getSyllabusTopics(subject: string): Promise<string[]> {
    const supabase = await createClient();

    const { data: topics } = await (supabase
        .from('syllabus_topics') as any)
        .select('topic_name')
        .eq('subject_slug', subject);

    return topics?.map((t: any) => t.topic_name) || [];
}

/**
 * Check relevance score for specific topic
 */
export async function checkRelevance(content: string, topic: string): Promise<number> {
    await rateLimiter.waitForSlot();

    try {
        const response = await client.chat.completions.create({
            model: 'provider-3/qwen-3-max',
            messages: [
                {
                    role: 'user',
                    content: `Rate the relevance of this content to the topic "${topic}" on a scale of 0-1:

${content.substring(0, 1000)}

Return only a number between 0 and 1.`
                }
            ],
            temperature: 0.1,
            max_tokens: 10
        });

        const score = parseFloat(response.choices[0].message.content || '0.5');
        return Math.max(0, Math.min(1, score));
    } catch (error) {
        console.error('Relevance check error:', error);
        return 0.5;
    }
}
