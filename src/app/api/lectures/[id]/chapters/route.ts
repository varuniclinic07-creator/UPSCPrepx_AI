/**
 * Lecture Chapters API — /api/lectures/[id]/chapters
 *
 * GET - Return all chapters for a lecture with content/timestamps
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify ownership
    const { data: job } = await (supabase.from('lecture_jobs') as any)
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (!job || job.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: chapters } = await (supabase.from('lecture_chapters') as any)
      .select('id, chapter_number, title, duration, content, image_urls, audio_url, status')
      .eq('job_id', id)
      .order('chapter_number', { ascending: true });

    return NextResponse.json({ chapters: chapters || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
