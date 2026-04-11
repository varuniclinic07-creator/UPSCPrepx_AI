// ═══════════════════════════════════════════════════════════════
// TTS GENERATION SERVICE
// Convert script to speech using A4F TTS
// ═══════════════════════════════════════════════════════════════

import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';
import fs from 'fs/promises';
import path from 'path';

let _openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!_openaiClient) _openaiClient = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});
  return _openaiClient;
}

/**
 * Generate TTS audio from script
 */
export async function generateTTS(
    script: string,
    chapterNumber: number,
    lectureId: string
): Promise<string> {

    await rateLimiter.waitForSlot();

    try {
        const response = await getOpenAIClient().audio.speech.create({
            model: 'provider-3/gemini-2.5-flash-preview-tts',
            input: script,
            voice: 'alloy', // Professional voice
            response_format: 'mp3'
        });

        // Save to temporary file
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        const tempDir = path.join(process.cwd(), 'temp', 'lectures', lectureId);
        await fs.mkdir(tempDir, { recursive: true });

        const audioPath = path.join(tempDir, `chapter_${chapterNumber}_audio.mp3`);
        await fs.writeFile(audioPath, audioBuffer);

        return audioPath;

    } catch (error) {
        console.error('TTS generation error:', error);
        throw new Error(`Failed to generate TTS for chapter ${chapterNumber}`);
    }
}

/**
 * Split long script into chunks if needed (TTS has limits)
 */
function splitScriptIntoChunks(script: string, maxLength: number = 4000): string[] {
    if (script.length <= maxLength) {
        return [script];
    }

    const chunks: string[] = [];
    const sentences = script.split('. ');
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = sentence + '. ';
        } else {
            currentChunk += sentence + '. ';
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

/**
 * Generate TTS for long script (handles splitting)
 */
export async function generateLongTTS(
    script: string,
    chapterNumber: number,
    lectureId: string
): Promise<string[]> {

    const chunks = splitScriptIntoChunks(script);
    const audioPaths: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        await rateLimiter.waitForSlot();

        try {
            const response = await getOpenAIClient().audio.speech.create({
                model: 'provider-3/gemini-2.5-flash-preview-tts',
                input: chunks[i],
                voice: 'alloy',
                response_format: 'mp3'
            });

            const audioBuffer = Buffer.from(await response.arrayBuffer());
            const tempDir = path.join(process.cwd(), 'temp', 'lectures', lectureId);
            await fs.mkdir(tempDir, { recursive: true });

            const audioPath = path.join(tempDir, `chapter_${chapterNumber}_part_${i + 1}.mp3`);
            await fs.writeFile(audioPath, audioBuffer);

            audioPaths.push(audioPath);

        } catch (error) {
            console.error(`TTS error for chunk ${i}:`, error);
            throw error;
        }
    }

    return audioPaths;
}
