// ═══════════════════════════════════════════════════════════════
// CONTENT REFINER
// Improve AI-generated content quality
// ═══════════════════════════════════════════════════════════════

import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';

let _openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!_openaiClient) _openaiClient = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});
  return _openaiClient;
}

/**
 * Enhance content quality for UPSC preparation
 */
export async function refineContent(content: string): Promise<string> {
    await rateLimiter.waitForSlot();

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'provider-2/qwen-3-max',
            messages: [
                {
                    role: 'system',
                    content: 'You are a UPSC content expert. Improve the given content by making it more exam-focused, adding relevant facts, and ensuring accuracy.'
                },
                {
                    role: 'user',
                    content: `Refine this UPSC preparation content:\n\n${content}\n\nImprove clarity, add exam relevance, fix factual errors.`
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || content;
    } catch (error) {
        console.error('Content refinement error:', error);
        return content;
    }
}

/**
 * Add UPSC exam context to content
 */
export async function addExamContext(content: string, topic: string): Promise<string> {
    await rateLimiter.waitForSlot();

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'provider-2/qwen-3-max',
            messages: [
                {
                    role: 'user',
                    content: `Add UPSC exam context to this content about "${topic}":

${content}

Include:
1. Prelims vs Mains relevance
2. Previous year question patterns
3. Current affairs connections
4. Key facts to remember`
                }
            ],
            temperature: 0.4,
            max_tokens: 1500
        });

        return response.choices[0].message.content || content;
    } catch (error) {
        console.error('Exam context error:', error);
        return content;
    }
}

/**
 * Format content according to UPSC standards
 */
export async function formatForUPSC(content: string): Promise<string> {
    await rateLimiter.waitForSlot();

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'provider-3/qwen-3-max',
            messages: [
                {
                    role: 'user',
                    content: `Format this content for UPSC CSE preparation:

${content}

Requirements:
- Structured headings
- Bullet points for key facts
- Bold important terms
- Clear paragraphs
- Exam tips highlighted`
                }
            ],
            temperature: 0.2,
            max_tokens: 2000
        });

        return response.choices[0].message.content || content;
    } catch (error) {
        console.error('Formatting error:', error);
        return content;
    }
}

/**
 * Add mnemonics for better retention
 */
export async function addMnemonics(content: string): Promise<string> {
    await rateLimiter.waitForSlot();

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'provider-2/qwen-3-max',
            messages: [
                {
                    role: 'user',
                    content: `Create easy mnemonics for remembering key points in:

${content}

Provide creative, memorable mnemonics for important lists, facts, and concepts.`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const mnemonicsSection = response.choices[0].message.content || '';
        return `${content}\n\n## 🧠 Memory Helpers\n\n${mnemonicsSection}`;
    } catch (error) {
        console.error('Mnemonics error:', error);
        return content;
    }
}
