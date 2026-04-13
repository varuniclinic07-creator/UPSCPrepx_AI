/**
 * Video Generation API Route
 * 
 * Master Prompt v8.0 - Feature F15 (WATCH Mode)
 * - POST /api/video/generate
 * - Creates a new request in the queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { topic, subject } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // 1. Insert request into queue
    const { data, error } = await getSupabase()
      .from('video_requests')
      .insert({
        user_id: userId,
        topic,
        subject: subject || 'General',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    // 2. TODO: Trigger Agentic Worker / BullMQ Job here
    // await queue.add('generate-video', { id: data.id, topic, subject });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Video Gen Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
