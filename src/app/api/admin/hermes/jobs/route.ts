/**
 * Admin Hermes Jobs API — /api/admin/hermes/jobs
 * GET: paginated list with filters (status, job_type, date range)
 * POST: manually enqueue a job
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = await createClient();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const jobType = url.searchParams.get('job_type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = supabase.from('hermes_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (jobType) query = query.eq('job_type', jobType);

    const { data, error, count } = await query;
    if (error) throw error;

    // Stats — last 24h
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: recentJobs } = await supabase.from('hermes_jobs')
      .select('status, job_type, created_at, started_at, completed_at')
      .gte('created_at', dayAgo);

    const stats = {
      total_24h: recentJobs?.length || 0,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      avg_duration_sec: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const job of recentJobs || []) {
      if (job.status in stats) {
        (stats as any)[job.status]++;
      }
      if (job.completed_at && job.started_at) {
        totalDuration += (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000;
        durationCount++;
      }
    }
    stats.avg_duration_sec = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    // Job type breakdown
    const typeBreakdown: Record<string, number> = {};
    for (const job of recentJobs || []) {
      typeBreakdown[job.job_type] = (typeBreakdown[job.job_type] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: data || [],
        stats,
        typeBreakdown,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
      },
    });
  } catch (error) {
    console.error('Hermes jobs GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { job_type, payload } = body;

    if (!job_type) {
      return NextResponse.json({ success: false, error: 'job_type is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.from('hermes_jobs')
      .insert({ job_type, status: 'queued', payload: payload || {} })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { jobId: data.id } });
  } catch (error) {
    console.error('Hermes jobs POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
