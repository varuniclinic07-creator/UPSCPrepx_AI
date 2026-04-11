/**
 * BMAD Phase 4: Feature 6 - Video Shorts Library API
 * GET /api/video/shorts/library - Browse pre-generated video shorts
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export interface VideoShortsLibraryResponse {
  success: boolean;
  videos?: Array<{
    id: string;
    title: string;
    topic: string;
    subject: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    duration_seconds: number;
    views_count: number;
    likes_count: number;
    is_premium: boolean;
    seo_tags: string[];
    created_at: string;
  }>;
  total?: number;
  error?: string;
}

/**
 * GET /api/video/shorts/library
 * Fetch video shorts library with filters and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');
    const sort = searchParams.get('sort') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
      .from('video_shorts')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    // Filter by subject
    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }

    // Filter by search query
    if (search) {
      query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'trending':
        // Trending = high views in last 7 days (simplified: just high recent views)
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Library fetch error:', error);
      return NextResponse.json<VideoShortsLibraryResponse>({
        success: false,
        error: 'Failed to fetch video library',
      }, { status: 500 });
    }

    // Transform data for frontend
    const videos = (data || []).map((video) => ({
      id: video.id,
      title: video.title,
      topic: video.topic,
      subject: video.subject,
      description: video.description,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      duration_seconds: video.duration_seconds,
      views_count: video.views_count,
      likes_count: video.likes_count,
      is_premium: video.is_premium,
      seo_tags: video.seo_tags || [],
      created_at: video.created_at,
    }));

    return NextResponse.json<VideoShortsLibraryResponse>({
      success: true,
      videos,
      total: count || 0,
    });

  } catch (error) {
    console.error('Library API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library';
    
    return NextResponse.json<VideoShortsLibraryResponse>({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
