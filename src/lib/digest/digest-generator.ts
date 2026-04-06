// ═══════════════════════════════════════════════════════════════
// NEWS DIGEST GENERATOR
// Personalized daily news digests
// ═══════════════════════════════════════════════════════════════

import { aiRouter } from '@/lib/ai/provider-router';
import { createClient } from '@/lib/supabase/server';

export interface DigestConfig {
    userId: string;
    subjects: string[];
    length: 'brief' | 'detailed';
    includeQuestions: boolean;
}

export interface Digest {
    id: string;
    date: string;
    summary: string;
    topics: DigestTopic[];
    practiceQuestions?: string[];
}

export interface DigestTopic {
    category: string;
    headline: string;
    summary: string;
    upscRelevance: string;
    relatedSyllabus: string[];
}

/**
 * Generate personalized digest
 */
export async function generateDigest(config: DigestConfig): Promise<Digest> {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Create a UPSC Current Affairs digest for ${today}.

Focus Areas: ${config.subjects.join(', ')}
Length: ${config.length}

Generate 5-7 important news items relevant to UPSC preparation. For each:
1. Category (Economy, Polity, IR, Environment, etc.)
2. Headline
3. Brief summary
4. UPSC relevance explanation
5. Related syllabus topics

${config.includeQuestions ? 'Include 3 probable Prelims MCQs at the end.' : ''}

Respond in JSON:
{
  "summary": "overall day summary",
  "topics": [
    {
      "category": "Economy",
      "headline": "...",
      "summary": "...",
      "upscRelevance": "...",
      "relatedSyllabus": ["topic1", "topic2"]
    }
  ],
  "practiceQuestions": ["Q1", "Q2", "Q3"]
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [
            {
                role: 'system',
                content: 'You are a UPSC current affairs expert. Create concise, exam-focused news digests.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    const supabase = await createClient();

    // Save digest
    const { data, error } = await (supabase
        .from('news_digests') as any)
        .insert({
            user_id: config.userId,
            date: today,
            summary: parsed.summary || '',
            topics: parsed.topics || [],
            practice_questions: parsed.practiceQuestions || []
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    return {
        id: data.id,
        date: data.date,
        summary: data.summary,
        topics: data.topics,
        practiceQuestions: data.practice_questions
    };
}

/**
 * Get user's digest history
 */
export async function getDigestHistory(userId: string, days: number = 7): Promise<Digest[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('news_digests') as any)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days);

    if (error) throw new Error(error.message);

    return (data || []).map((d: any) => ({
        id: d.id,
        date: d.date,
        summary: d.summary,
        topics: d.topics,
        practiceQuestions: d.practice_questions
    }));
}
