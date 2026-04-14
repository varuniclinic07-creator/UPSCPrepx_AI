/**
 * Admin Lecture Detail API — /api/admin/lectures/[id]
 *
 * GET: Full lecture detail with chapters
 * PATCH: Update lecture status (admin override)
 * DELETE: Delete lecture and all data
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const { data: job } = await (supabase.from('lecture_jobs') as any)
      .select('*')
      .eq('id', id)
      .single();

    const { data: chapters } = await (supabase.from('lecture_chapters') as any)
      .select('*')
      .eq('job_id', id)
      .order('chapter_number');

    return NextResponse.json({ job, chapters: chapters || [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const updates = await request.json();

    const { error } = await (supabase.from('lecture_jobs') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    // Delete chapters first
    await (supabase.from('lecture_chapters') as any).delete().eq('job_id', id);
    // Delete job
    await (supabase.from('lecture_jobs') as any).delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
