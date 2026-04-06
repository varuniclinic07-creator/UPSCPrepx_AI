// ═══════════════════════════════════════════════════════════════
// LEGAL/CONSTITUTIONAL EXPLAINER SERVICE
// AI-powered explanations of constitutional articles
// ═══════════════════════════════════════════════════════════════

import { aiRouter } from '@/lib/ai/provider-router';
import { getArticleById, getArticleByNumber, type ConstitutionalArticle } from './constitution-data';

export interface LegalExplanation {
    article: ConstitutionalArticle;
    query: string;
    explanation: string;
    keyPoints: string[];
    examples: string[];
    upscTips: string[];
}

/**
 * Generate AI explanation for a constitutional article
 */
export async function explainArticle(
    articleId: string,
    query?: string
): Promise<LegalExplanation> {
    const article = getArticleById(articleId);

    if (!article) {
        throw new Error(`Article not found: ${articleId}`);
    }

    const userQuery = query || `Explain Article ${article.articleNumber} of the Indian Constitution`;

    const prompt = `You are a constitutional law expert preparing UPSC aspirants.

Article ${article.articleNumber}: ${article.title}

Content: ${article.content}

User Question: ${userQuery}

Provide a comprehensive explanation suitable for UPSC Civil Services preparation. Include:
1. Clear explanation in simple language
2. Key points to remember (3-5 points)
3. Real-world examples or landmark cases
4. UPSC exam tips (how this article is typically asked)

Format your response as JSON:
{
  "explanation": "detailed explanation",
  "keyPoints": ["point 1", "point 2", ...],
  "examples": ["example 1", "example 2", ...],
  "upscTips": ["tip 1", "tip 2", ...]
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [
            {
                role: 'system',
                content: 'You are a constitutional law expert and UPSC mentor. Provide clear, accurate, exam-focused explanations.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 2048
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
        const parsed = JSON.parse(content);

        return {
            article,
            query: userQuery,
            explanation: parsed.explanation || article.content,
            keyPoints: parsed.keyPoints || [],
            examples: parsed.examples || [],
            upscTips: parsed.upscTips || []
        };
    } catch (error) {
        // Fallback if JSON parsing fails
        return {
            article,
            query: userQuery,
            explanation: content,
            keyPoints: [],
            examples: [],
            upscTips: []
        };
    }
}

/**
 * Compare two articles
 */
export async function compareArticles(
    articleId1: string,
    articleId2: string
): Promise<{
    article1: ConstitutionalArticle;
    article2: ConstitutionalArticle;
    comparison: string;
    similarities: string[];
    differences: string[];
}> {
    const article1 = getArticleById(articleId1);
    const article2 = getArticleById(articleId2);

    if (!article1 || !article2) {
        throw new Error('One or both articles not found');
    }

    const prompt = `Compare these two constitutional articles for UPSC preparation:

Article ${article1.articleNumber}: ${article1.title}
${article1.description}

Article ${article2.articleNumber}: ${article2.title}
${article2.description}

Provide a comparative analysis in JSON format:
{
  "comparison": "overall comparison paragraph",
  "similarities": ["similarity 1", "similarity 2", ...],
  "differences": ["difference 1", "difference 2", ...]
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
        article1,
        article2,
        comparison: parsed.comparison || '',
        similarities: parsed.similarities || [],
        differences: parsed.differences || []
    };
}

/**
 * Get exam-focused summary
 */
export async function getExamSummary(articleId: string): Promise<{
    article: ConstitutionalArticle;
    oneLineSummary: string;
    mustKnowPoints: string[];
    commonQuestions: string[];
    mnemonicTrick?: string;
}> {
    const article = getArticleById(articleId);

    if (!article) {
        throw new Error(`Article not found: ${articleId}`);
    }

    const prompt = `Create an exam-focused summary of Article ${article.articleNumber}:

${article.content}

Provide in JSON format:
{
  "oneLineSummary": "one sentence summary",
  "mustKnowPoints": ["point 1", "point 2", "point 3"],
  "commonQuestions": ["question pattern 1", "question pattern 2"],
  "mnemonicTrick": "optional memory trick"
}`;

    const response = await aiRouter.chat({
        model: 'provider-8/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 512
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
        article,
        oneLineSummary: parsed.oneLineSummary || article.description,
        mustKnowPoints: parsed.mustKnowPoints || [],
        commonQuestions: parsed.commonQuestions || [],
        mnemonicTrick: parsed.mnemonicTrick
    };
}
