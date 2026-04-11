/**
 * BMAD Phase 4: Feature 6 - Video Shorts Generation API
 * POST /api/video/shorts/generate - Generate 60-second UPSC explainer video
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoShortsGenerator } from '@/lib/video/shorts-generator';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface GenerateVideoShortRequest {
  topic: string;
  subject?: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Essay' | 'Prelims' | 'Current Affairs';
  style?: 'educational' | 'entertaining' | 'news';
  includeManimVisuals?: boolean;
  includeCaptions?: boolean;
}

export interface GenerateVideoShortResponse {
  success: boolean;
  queueId?: string;
  video?: {
    id: string;
    topic: string;
    title: string;
    script: string;
    duration: number;
    status: string;
    estimatedCompletionTime?: string;
  };
  error?: string;
}

/**
 * POST /api/video/shorts/generate
 * Queue a video short for generation
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateVideoShortRequest = await request.json();

    // Validate required fields
    if (!body.topic) {
      return NextResponse.json<GenerateVideoShortResponse>({
        success: false,
        error: 'Topic is required',
      }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '') || 'anonymous';

    if (userId === 'anonymous') {
      return NextResponse.json<GenerateVideoShortResponse>({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Create queue entry
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: queueData, error: queueError } = await supabase
      .from('video_generation_queue')
      .insert({
        user_id: userId,
        topic: body.topic,
        subject: body.subject,
        status: 'pending',
        progress: 0,
        max_retries: 3,
        estimated_completion_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      })
      .select()
      .single();

    if (queueError || !queueData) {
      console.error('Queue insert error:', queueError);
      return NextResponse.json<GenerateVideoShortResponse>({
        success: false,
        error: 'Failed to queue video generation',
      }, { status: 500 });
    }

    // Start async video generation (don't wait for completion)
    // In production, this would be a background job
    generateVideoAsync(queueData.id, body, userId).catch(console.error);

    return NextResponse.json<GenerateVideoShortResponse>({
      success: true,
      queueId: queueData.id,
      video: {
        id: queueData.id,
        topic: body.topic,
        title: `UPSC ${body.topic} in 60 Seconds`,
        script: '',
        duration: 60,
        status: queueData.status,
        estimatedCompletionTime: queueData.estimated_completion_at,
      },
    });

  } catch (error) {
    console.error('Video generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
    
    return NextResponse.json<GenerateVideoShortResponse>({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * Async video generation (background process)
 */
async function generateVideoAsync(
  queueId: string,
  options: GenerateVideoShortRequest,
  userId: string
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Update status to script_generating
    await supabase
      .from('video_generation_queue')
      .update({ status: 'script_generating', progress: 10 })
      .eq('id', queueId);

    // Step 1: Generate video content (script + scenes)
    const generator = getVideoShortsGenerator();
    const videoData = await generator.generateVideo({
      topic: options.topic,
      subject: options.subject,
      style: options.style,
      includeManimVisuals: options.includeManimVisuals ?? true,
      includeCaptions: options.includeCaptions ?? true,
      userId,
    });

    // Update status to script_ready
    await supabase
      .from('video_generation_queue')
      .update({ 
        status: 'script_ready', 
        progress: 40,
        script: videoData.script,
      })
      .eq('id', queueId);

    // Step 2: Render video using Remotion
    await supabase
      .from('video_generation_queue')
      .update({ status: 'video_rendering', progress: 60 })
      .eq('id', queueId);

    const renderResult = await generator.renderVideo(videoData);

    // Step 3: Save to video_shorts library
    const { data: videoDataSaved, error: videoError } = await supabase
      .from('video_shorts')
      .insert({
        title: videoData.title,
        topic: videoData.topic,
        subject: videoData.subject,
        description: videoData.seoDescription,
        script: videoData.script,
        video_url: renderResult.videoUrl,
        thumbnail_url: renderResult.thumbnailUrl,
        duration_seconds: videoData.duration,
        resolution: '1080x1920',
        format: 'mp4',
        is_premium: false,
        is_published: true,
        seo_tags: videoData.hashtags,
        social_caption: videoData.socialCaptions.youtube,
        hashtags: videoData.hashtags,
        ai_provider_used: '9router', // Track which AI generated script
        has_manim_visuals: options.includeManimVisuals ?? true,
        has_tts_audio: true,
        has_captions: options.includeCaptions ?? true,
        language: 'english',
        generated_by: userId,
      })
      .select()
      .single();

    if (videoError || !videoDataSaved) {
      throw new Error('Failed to save video to library');
    }

    // Update queue as completed
    await supabase
      .from('video_generation_queue')
      .update({ 
        status: 'completed', 
        progress: 100,
        video_url: renderResult.videoUrl,
        thumbnail_url: renderResult.thumbnailUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    console.log(`Video ${queueId} generation completed successfully`);

  } catch (error) {
    console.error(`Video ${queueId} generation failed:`, error);
    
    // Update queue as failed
    await supabase
      .from('video_generation_queue')
      .update({ 
        status: 'failed', 
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', queueId);
  }
}

/**
 * GET /api/video/shorts/generate
 * Get generation status for a queued video
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queueId = searchParams.get('queueId');

    if (!queueId) {
      return NextResponse.json({ error: 'queueId parameter required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('video_generation_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      queue: data,
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
