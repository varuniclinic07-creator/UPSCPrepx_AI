// ═══════════════════════════════════════════════════════════════
// VISUAL GENERATION SERVICE
// Generate images for lecture slides using A4F
// ═══════════════════════════════════════════════════════════════

import { OpenAI } from 'openai';
import { rateLimiter } from '@/lib/rate-limiter/api-manager';

const client = new OpenAI({
    apiKey: process.env.A4F_API_KEY,
    baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1'
});

export interface GeneratedVisual {
    url: string;
    type: string;
    description: string;
}

/**
 * Generate visual for a specific cue
 */
export async function generateVisual(
    type: string,
    description: string,
    context?: string
): Promise<GeneratedVisual> {

    await rateLimiter.waitForSlot();

    // Choose model based on type
    const model = type === 'diagram' || type === 'chart'
        ? 'provider-8/imagen-4' // Better for diagrams
        : 'provider-3/FLUX.1-schnell'; // Faster for general images

    const prompt = buildImagePrompt(type, description, context);

    try {
        const response = await client.images.generate({
            model,
            prompt,
            n: 1,
            size: '1024x1024'
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error('No image URL returned');
        }

        return {
            url: imageUrl,
            type,
            description
        };

    } catch (error) {
        console.error('Visual generation error:', error);

        // Return placeholder on error
        return {
            url: `/api/placeholder?text=${encodeURIComponent(description)}`,
            type,
            description
        };
    }
}

/**
 * Build optimized image generation prompt
 */
function buildImagePrompt(type: string, description: string, _context?: string): string {
    const baseStyle = 'clean, professional, educational, high contrast, simple';

    switch (type) {
        case 'diagram':
            return `Educational diagram: ${description}. ${baseStyle}, flowchart style, clear labels, arrows, structured layout`;

        case 'map':
            return `${description}. Clean map style, clear borders, labeled regions, professional cartography, ${baseStyle}`;

        case 'chart':
            return `Data visualization: ${description}. Modern chart, clear axes, labeled data points, professional infographic, ${baseStyle}`;

        case 'image':
            return `${description}. Photorealistic, high quality, relevant to UPSC education, ${baseStyle}`;

        default:
            return `${description}. Educational illustration, ${baseStyle}`;
    }
}

/**
 * Generate multiple visuals in parallel (with rate limiting)
 */
export async function generateVisuals(
    visualCues: Array<{ type: string; description: string }>
): Promise<GeneratedVisual[]> {
    const results: GeneratedVisual[] = [];

    // Process in batches of 3 to respect rate limit
    for (let i = 0; i < visualCues.length; i += 3) {
        const batch = visualCues.slice(i, i + 3);

        const batchResults = await Promise.all(
            batch.map(cue => generateVisual(cue.type, cue.description))
        );

        results.push(...batchResults);

        // Small delay between batches
        if (i + 3 < visualCues.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return results;
}