/**
 * Admin Lectures API — /api/admin/lectures
 *
 * GET: List all lecture jobs (admin only)
 * POST: Admin-trigger lecture generation
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin role
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { data: lectures } = await (supabase.from('lecture_jobs') as any)
      .select('*, profiles!lecture_jobs_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    // Aggregate stats
    const all = lectures || [];
    const stats = {
      total: all.length,
      ready: all.filter((l: any) => l.status === 'ready').length,
      inProgress: all.filter((l: any) => !['ready', 'failed', 'cancelled'].includes(l.status)).length,
      failed: all.filter((l: any) => l.status === 'failed').length,
    };

    return NextResponse.json({ lectures: all, stats });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { topic, subject, targetUserId } = await request.json();
    const userId = targetUserId || user.id;

    const { data: job, error } = await (supabase.from('lecture_jobs') as any)
      .insert({
        user_id: userId,
        topic,
        subject_slug: subject,
        status: 'queued',
        language: 'en',
        target_duration: 180,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ job, message: 'Lecture generation triggered by admin' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
