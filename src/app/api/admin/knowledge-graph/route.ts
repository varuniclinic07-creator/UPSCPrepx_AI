/**
 * Admin Knowledge Graph API — /api/admin/knowledge-graph
 *
 * GET - List knowledge_nodes with filters + quality stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/security/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const subject = url.searchParams.get('subject');
    const approved = url.searchParams.get('approved');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort') || 'updated_at';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = (supabase.from('knowledge_nodes') as any)
      .select('id, type, title, subject, syllabus_code, confidence_score, source_count, freshness_score, human_approved, version, created_at, updated_at', { count: 'exact' })
      .order(sortBy, { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (subject) query = query.eq('subject', subject);
    if (approved === 'true') query = query.eq('human_approved', true);
    if (approved === 'false') query = query.eq('human_approved', false);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    // Summary stats
    const { data: allNodes } = await (supabase.from('knowledge_nodes') as any)
      .select('type, subject, confidence_score, freshness_score, human_approved');

    const stats = {
      total_nodes: allNodes?.length || 0,
      approved: 0,
      unapproved: 0,
      avg_confidence: 0,
      avg_freshness: 0,
      by_type: {} as Record<string, number>,
      by_subject: {} as Record<string, number>,
      low_quality: 0,
    };

    let totalConf = 0;
    let totalFresh = 0;

    for (const node of allNodes || []) {
      if (node.human_approved) stats.approved++;
      else stats.unapproved++;
      totalConf += node.confidence_score || 0;
      totalFresh += node.freshness_score || 0;
      if ((node.confidence_score || 0) < 0.5) stats.low_quality++;

      stats.by_type[node.type] = (stats.by_type[node.type] || 0) + 1;
      if (node.subject) {
        stats.by_subject[node.subject] = (stats.by_subject[node.subject] || 0) + 1;
      }
    }

    const total = allNodes?.length || 1;
    stats.avg_confidence = Math.round((totalConf / total) * 100) / 100;
    stats.avg_freshness = Math.round((totalFresh / total) * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        nodes: data || [],
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
    console.error('Knowledge graph GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
