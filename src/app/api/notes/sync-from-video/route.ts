/**
 * Sync Video Note to Notes Library API
 * 
 * Master Prompt v8.0 - Feature F17 (WATCH Mode)
 * - POST /api/notes/sync-from-video
 * - Creates a permanent note linked to a video timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { video_id, title, content, timestamp_seconds } = await request.json();

    if (!content || !video_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get Video Topic for Title if not provided
    let videoTitle = title;
    if (!videoTitle) {
      const { data: vidData } = await supabase
        .from('video_requests')
        .select('topic')
        .eq('id', video_id)
        .single();
      videoTitle = vidData?.topic || `Video Note at ${timestamp_seconds}s`;
    }

    // 2. Insert into user_notes
    const { data, error } = await supabase
      .from('user_notes')
      .insert({
        user_id: userId,
        title: videoTitle,
        content: content,
        source_type: 'VIDEO',
        source_video_id: video_id,
        video_timestamp_seconds: timestamp_seconds,
        tags: ['VideoNote']
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Sync Video Note Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
