/**
 * BMAD Phase 4: Feature 6 - Video Shorts Generator
 * Generates 60-second UPSC explainer videos
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { getAIProviderClient } from '../ai/ai-provider-client';

export interface VideoShortsOptions {
  topic: string;
  subject?: string;
  style?: 'educational' | 'entertaining' | 'news';
  includeManimVisuals?: boolean;
  includeCaptions?: boolean;
  userId?: string;
}

export interface VideoScene {
  startTime: number; // seconds
  endTime: number;
  type: 'hook' | 'concept' | 'example' | 'cta';
  script: string;
  visualDescription: string;
  manimPrompt?: string;
}

export interface GeneratedVideo {
  id: string;
  topic: string;
  subject: string;
  title: string;
  script: string;
  scenes: VideoScene[];
  duration: number;
  thumbnailPrompt: string;
  seoTitle: string;
  seoDescription: string;
  socialCaptions: {
    youtube: string;
    instagram: string;
    twitter: string;
  };
  hashtags: string[];
  wordCount: number;
}

export class VideoShortsGenerator {
  private aiProvider = getAIProviderClient();
  private remotionServiceUrl: string;
  private manimServiceUrl: string;

  constructor() {
    // Connect to existing services (URLs must be set via env vars)
    this.remotionServiceUrl = process.env.REMOTION_URL || '';
    this.manimServiceUrl = process.env.MANIM_URL || '';
  }

  /**
   * Generate complete video short (script + visuals plan)
   */
  async generateVideo(options: VideoShortsOptions): Promise<GeneratedVideo> {
    // Step 1: Generate script using AI (9Router → Groq → Ollama)
    const script = await this.generateScript(options);
    
    // Step 2: Generate scene breakdown
    const scenes = this.breakIntoScenes(script);
    
    // Step 3: Generate SEO metadata
    const seoMetadata = await this.generateSEOMetadata(options.topic, script);
    
    // Step 4: Generate social media captions
    const socialCaptions = await this.generateSocialCaptions(options.topic, script);
    
    // Step 5: Generate thumbnail prompt
    const thumbnailPrompt = await this.generateThumbnailPrompt(options.topic);
    
    return {
      id: crypto.randomUUID(),
      topic: options.topic,
      subject: options.subject || 'General',
      title: seoMetadata.title,
      script: script,
      scenes: scenes,
      duration: 60,
      thumbnailPrompt,
      seoTitle: seoMetadata.title,
      seoDescription: seoMetadata.description,
      socialCaptions,
      hashtags: seoMetadata.hashtags,
      wordCount: script.trim().split(/\s+/).length,
    };
  }

  /**
   * Generate 60-second script (~150 words @ 150wpm)
   */
  private async generateScript(options: VideoShortsOptions): Promise<string> {
    const prompt = `Generate a 60-second UPSC explainer video script on: ${options.topic}

Subject: ${options.subject || 'General Studies'}
Style: ${options.style || 'educational'}

REQUIREMENTS:
- Exactly 150 words (for 60 seconds @ 150wpm)
- Hook in first 5 seconds
- Explain 2 key concepts clearly
- Include 1 real-world example
- End with call-to-action
- Simple language (10th standard level)
- Engaging, conversational tone

FORMAT:
[0-5s] HOOK: Grab attention
[5-20s] CONCEPT 1: Main idea
[20-35s] CONCEPT 2: Supporting idea  
[35-50s] EXAMPLE: Real-world application
[50-60s] CTA: Summary + action

Generate the script now:`;

    const response = await this.aiProvider.generateNotes({
      topic: options.topic,
      rawContent: prompt,
      sources: [],
      brevityLevel: '100', // ~100-150 words
      subject: options.subject as any,
    });

    return response.content;
  }

  /**
   * Break script into 5 scenes
   */
  private breakIntoScenes(script: string): VideoScene[] {
    const lines = script.split('\n').filter(l => l.trim());
    
    // Distribute lines across 5 scenes
    const linesPerScene = Math.ceil(lines.length / 5);
    
    const scenes: VideoScene[] = [
      {
        startTime: 0,
        endTime: 5,
        type: 'hook',
        script: lines.slice(0, linesPerScene).join('\n'),
        visualDescription: 'Bold text animation with engaging background',
        manimPrompt: 'Animated text appearing with particle effects',
      },
      {
        startTime: 5,
        endTime: 20,
        type: 'concept',
        script: lines.slice(linesPerScene, linesPerScene * 2).join('\n'),
        visualDescription: 'Key concept diagram or flowchart',
        manimPrompt: 'Clean diagram explaining the main concept',
      },
      {
        startTime: 20,
        endTime: 35,
        type: 'concept',
        script: lines.slice(linesPerScene * 2, linesPerScene * 3).join('\n'),
        visualDescription: 'Supporting visual or comparison chart',
        manimPrompt: 'Side-by-side comparison or timeline',
      },
      {
        startTime: 35,
        endTime: 50,
        type: 'example',
        script: lines.slice(linesPerScene * 3, linesPerScene * 4).join('\n'),
        visualDescription: 'Real-world example with images or map',
        manimPrompt: 'Map or infographic showing example',
      },
      {
        startTime: 50,
        endTime: 60,
        type: 'cta',
        script: lines.slice(linesPerScene * 4).join('\n'),
        visualDescription: 'Summary points with subscribe/follow CTA',
        manimPrompt: 'Bullet points with animated icons',
      },
    ];

    return scenes;
  }

  /**
   * Generate SEO-optimized title and description
   */
  private async generateSEOMetadata(topic: string, script: string): Promise<{
    title: string;
    description: string;
    hashtags: string[];
  }> {
    const prompt = `Generate SEO metadata for a 60-second UPSC video on: ${topic}

Return JSON format:
{
  "title": "Catchy title under 60 characters with keywords",
  "description": "2-3 sentence description with keywords",
  "hashtags": ["#UPSC", "#relevant", "#tags"]
}

Requirements:
- Title: Include "UPSC", topic keyword, under 60 chars
- Description: Include key terms from script
- Hashtags: 5-7 relevant tags for YouTube/Instagram`;

    try {
      const response = await this.aiProvider.generateNotes({
        topic: 'SEO metadata',
        rawContent: prompt,
        sources: [],
        brevityLevel: '100',
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('SEO generation error:', error);
    }

    // Fallback
    return {
      title: `UPSC ${topic} in 60 Seconds | Quick Revision`,
      description: `Quick 60-second explainer on ${topic} for UPSC CSE preparation. Perfect for quick revision and social media learning.`,
      hashtags: ['#UPSC', '#UPSCPreparation', '#CurrentAffairs', '#StudyShorts', '#LearnOnYouTube'],
    };
  }

  /**
   * Generate social media captions
   */
  private async generateSocialCaptions(topic: string, script: string): Promise<{
    youtube: string;
    instagram: string;
    twitter: string;
  }> {
    return {
      youtube: `📚 UPSC ${topic} in 60 seconds!\n\nPerfect for quick revision before exams. Watch the full series for comprehensive preparation.\n\n#UPSC #UPSCPreparation #StudyShorts`,
      instagram: `🎯 ${topic} explained in 60 seconds! ⏱️\n\nSave this for quick revision! 📌\n\n#UPSC #UPSCPreparation #StudyGram #LearnOnInstagram #Education`,
      twitter: `📖 ${topic} in 60 seconds!\n\nQuick UPSC revision thread 🧵\n\n#UPSC #Education`,
    };
  }

  /**
   * Generate thumbnail generation prompt
   */
  private async generateThumbnailPrompt(topic: string): Promise<string> {
    return `Create a vibrant thumbnail for UPSC video about "${topic}". Include:
- Bold, readable text (3-4 words max)
- Relevant icons or imagery
- High contrast colors
- Professional educational style
- Space for face/expression if needed`;
  }

  /**
   * Render video using Remotion service
   */
  async renderVideo(videoData: GeneratedVideo): Promise<{ videoUrl: string; thumbnailUrl: string }> {
    try {
      const response = await fetch(`${this.remotionServiceUrl}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          composition: 'VideoShort',
          inputProps: {
            title: videoData.title,
            scenes: videoData.scenes,
            duration: videoData.duration,
            includeCaptions: true,
          },
          format: 'mp4',
          resolution: '1080x1920', // Vertical for Shorts/Reels
        }),
        signal: AbortSignal.timeout(300000), // 5 minutes for rendering
      });

      if (!response.ok) {
        throw new Error(`Remotion service returned ${response.status}`);
      }

      const result = await response.json();
      return {
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
      };
    } catch (error) {
      console.error('Video rendering error:', error);
      throw error;
    }
  }

  /**
   * Generate Manim visuals for specific scenes
   */
  async generateManimVisuals(scenes: VideoScene[]): Promise<Array<{ sceneIndex: number; visualUrl: string }>> {
    const visuals: Array<{ sceneIndex: number; visualUrl: string }> = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.manimPrompt) {
        try {
          const response = await fetch(`${this.manimServiceUrl}/render`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: scene.manimPrompt,
              duration: scene.endTime - scene.startTime,
              resolution: '1920x1080',
            }),
            signal: AbortSignal.timeout(60000), // 1 minute per visual
          });

          if (response.ok) {
            const result = await response.json();
            visuals.push({
              sceneIndex: i,
              visualUrl: result.visualUrl,
            });
          }
        } catch (error) {
          console.error(`Manim visual ${i} failed:`, error);
          // Continue with other visuals
        }
      }
    }

    return visuals;
  }
}

// Singleton instance
let shortsGeneratorInstance: VideoShortsGenerator | null = null;

export function getVideoShortsGenerator(): VideoShortsGenerator {
  if (!shortsGeneratorInstance) {
    shortsGeneratorInstance = new VideoShortsGenerator();
  }
  return shortsGeneratorInstance;
}

export async function createShort(userId: string, options: {
  topic: string;
  subject: string;
  targetDuration?: number;
  style?: string;
}): Promise<GeneratedVideo> {
  const generator = getVideoShortsGenerator();
  return generator.generateVideo({
    topic: options.topic,
    subject: options.subject,
    style: (options.style as VideoShortsOptions['style']) || 'educational',
    userId,
  });
}
