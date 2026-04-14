/**
 * Lecture Watch Progress API — /api/lectures/[id]/progress
 *
 * POST - Save current watch position (for resume)
 * GET  - Get last position (for resume on load)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { position, chapter, watchedSeconds } = await request.json();

    await (supabase.from('lecture_watch_history') as any).upsert(
      {
        user_id: user.id,
        lecture_job_id: id,
        last_position_seconds: position || 0,
        last_chapter: chapter || 1,
        total_watch_seconds: watchedSeconds || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lecture_job_id' }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await (supabase.from('lecture_watch_history') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('lecture_job_id', id)
      .single();

    return NextResponse.json({
      position: data?.last_position_seconds || 0,
      chapter: data?.last_chapter || 1,
      totalWatched: data?.total_watch_seconds || 0,
      completed: data?.completed || false,
    });
  } catch {
    return NextResponse.json({ position: 0, chapter: 1, totalWatched: 0, completed: false });
  }
}
