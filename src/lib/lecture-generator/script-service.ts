// ═══════════════════════════════════════════════════════════════
// SCRIPT GENERATION SERVICE
// Generate detailed script for each chapter
// ═══════════════════════════════════════════════════════════════

import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';

const client = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});

export interface ChapterScript {
    chapterNumber: number;
    title: string;
    script: string; // Full narration script
    visualCues: VisualCue[];
    duration: number;
}

export interface VisualCue {
    timestamp: number; // seconds from chapter start
    type: 'title' | 'diagram' | 'map' | 'chart' | 'text' | 'image';
    content: string;
    description: string;
}

/**
 * Generate chapter script with visual cues
 */
export async function generateChapterScript(
    chapterNumber: number,
    chapterTitle: string,
    subtopics: string[],
    keyPoints: string[],
    context: {
        topic: string;
        subject: string;
        previousChapters?: string[];
    }
): Promise<ChapterScript> {

    await rateLimiter.waitForSlot();

    const prompt = `You are creating a 10-minute educational lecture script for UPSC CSE preparation.

**Chapter ${chapterNumber}: ${chapterTitle}**

Main Topic: ${context.topic}
Subject: ${context.subject}
Subtopics to cover: ${subtopics.join(', ')}
Key Points: ${keyPoints.join(', ')}

Requirements:
1. Write a ~1500-word script (10-minute narration at 150 words/min)
2. Use simple, clear 10th-standard language
3. Include UPSC exam relevance (prelims + mains perspectives)
4. Add current affairs connections where applicable
5. Suggest visual cues (diagrams, maps, charts) at specific timestamps
6. Make it engaging and easy to understand
7. Include mnemonics or memory aids where helpful
8. Add examples and case studies

Return JSON with this structure:
{
  "chapterNumber": ${chapterNumber},
  "title": "${chapterTitle}",
  "script": "Full narration script here...",
  "visualCues": [
    {
      "timestamp": 30,
      "type": "diagram",
      "content": "Constitutional structure diagram",
      "description": "Visual description for image generation"
    }
  ],
  "duration": 600
}

CRITICAL: Return ONLY valid JSON.`;

    try {
        const response = await client.chat.completions.create({
            model: 'provider-2/kimi-k2-thinking-tee',
            messages: [
                {
                    role: 'system',
                    content: 'You are a UPSC educator creating engaging lecture scripts. Always return valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 3000
        });

        const content = response.choices[0].message.content || '';

        // Parse JSON
        let jsonStr = content.trim();
        if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const script: ChapterScript = JSON.parse(jsonStr);

        return script;

    } catch (error) {
        console.error('Script generation error:', error);
        throw new Error(`Failed to generate script for chapter ${chapterNumber}`);
    }
}

/**
 * Simplify language to 10th standard level
 */
export async function simplifyLanguage(text: string): Promise<string> {
    await rateLimiter.waitForSlot();

    try {
        const response = await client.chat.completions.create({
            model: 'provider-3/qwen-3-max',
            messages: [
                {
                    role: 'system',
                    content: 'Simplify the following UPSC content to 10th standard level. Keep it accurate but use simple words and short sentences.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || text;

    } catch (error) {
        console.error('Language simplification error:', error);
        return text; // Return original on error
    }
}
