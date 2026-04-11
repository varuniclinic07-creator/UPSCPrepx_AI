// ═══════════════════════════════════════════════════════════════
// OUTLINE GENERATION SERVICE
// Generate 18-chapter outline for 3-hour lecture
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

export interface Chapter {
    number: number;
    title: string;
    duration: number; // minutes
    subtopics: string[];
    keyPoints: string[];
}

export interface LectureOutline {
    topic: string;
    totalDuration: number;
    totalChapters: number;
    chapters: Chapter[];
    introduction: string;
    conclusion: string;
}

/**
 * Generate comprehensive lecture outline
 */
export async function generateOutline(
    topic: string,
    subject: string,
    targetDuration: number = 180
): Promise<LectureOutline> {

    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    const prompt = `You are an expert UPSC CSE educator. Create a comprehensive ${targetDuration}-minute lecture outline for:

Topic: "${topic}"
Subject: ${subject}

Requirements:
- Create EXACTLY 18 chapters (10 minutes each for 180-minute total)
- Each chapter must be UPSC-relevant and exam-focused
- Include 3-5 subtopics per chapter
- Add 5-7 key points per chapter for visual slides
- Ensure logical flow and progression
- Cover prelims + mains perspectives
- Include current affairs connections

Return a JSON object with this EXACT structure:
{
  "topic": "${topic}",
  "totalDuration": ${targetDuration},
  "totalChapters": 18,
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "duration": 10,
      "subtopics": ["subtopic1", "subtopic2", "..."],
      "keyPoints": ["point1", "point2", "..."]
    }
  ],
  "introduction": "Brief introduction paragraph",
  "conclusion": "Brief conclusion paragraph"
}

CRITICAL: Return ONLY the JSON object, no markdown, no explanations.`;

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'provider-2/tongyi-deepresearch-30b-a3b',
            messages: [
                {
                    role: 'system',
                    content: 'You are a UPSC CSE expert creating structured lecture outlines. Always return valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const content = response.choices[0].message.content || '';

        // Extract JSON from response (remove markdown if present)
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/g, '');
        }

        const outline: LectureOutline = JSON.parse(jsonStr);

        // Validate structure
        if (!outline.chapters || outline.chapters.length !== 18) {
            throw new Error('Invalid outline: must have exactly 18 chapters');
        }

        return outline;

    } catch (error) {
        console.error('Outline generation error:', error);
        throw new Error('Failed to generate lecture outline');
    }
}

/**
 * Validate outline structure
 */
export function validateOutline(outline: LectureOutline): boolean {
    if (outline.totalChapters !== 18) return false;
    if (outline.chapters.length !== 18) return false;

    for (const chapter of outline.chapters) {
        if (!chapter.title || !chapter.subtopics || chapter.subtopics.length === 0) {
            return false;
        }
    }

    return true;
}
