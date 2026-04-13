/**
 * Admin Content Queue API — /api/admin/content-queue
 *
 * GET  - List content_queue items with status/type filters
 * PATCH - Approve/reject items (sets reviewed_by, reviewed_at, review_notes)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const contentType = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Build query
    let query = (supabase.from('content_queue') as any)
      .select(`
        id, content_type, status, confidence_score,
        review_notes, reviewed_at, created_at,
        ai_provider, agent_type,
        knowledge_nodes!inner (id, title, subject, syllabus_code)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Get summary stats
    const { data: statsData } = await (supabase.from('content_queue') as any)
      .select('status');

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      needs_revision: 0,
      total: statsData?.length || 0,
    };
    for (const row of statsData || []) {
      const s = row.status as keyof typeof stats;
      if (s in stats) stats[s]++;
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        stats,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Content queue GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const body = await request.json();
    const { itemId, action, reviewNotes } = body;

    if (!itemId || !['approve', 'reject', 'needs_revision'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'itemId and action (approve/reject/needs_revision) required' },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      needs_revision: 'needs_revision',
    };

    const { data, error } = await (supabase.from('content_queue') as any)
      .update({
        status: statusMap[action],
        reviewed_by: (admin as any).id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // If approved, mark the knowledge_node as human_approved
    if (action === 'approve' && data?.node_id) {
      await (supabase.from('knowledge_nodes') as any)
        .update({ human_approved: true })
        .eq('id', data.node_id);
    }

    // Log admin action
    await (supabase.from('admin_logs') as any).insert({
      admin_id: (admin as any).id,
      action: `CONTENT_${action.toUpperCase()}`,
      target_id: itemId,
      target_type: 'CONTENT_QUEUE',
      details: { reviewNotes, contentType: data?.content_type },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Content queue PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
