/**
 * Video Notes API Routes
 * 
 * Master Prompt v8.0 - Feature F16 (WATCH Mode)
 * - POST /api/video/[id]/notes - Save a timestamped note
 * - GET /api/video/[id]/notes - Get list of notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient> | null = null;
function getSupabase() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const { timestamp_seconds, content } = await request.json();

    const { data, error } = await getSupabase()
      .from('video_notes')
      .insert({
        user_id: userId,
        video_request_id: id,
        timestamp_seconds,
        content
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Create Note Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await getSupabase()
      .from('video_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('video_request_id', id)
      .order('timestamp_seconds', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Get Notes Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
