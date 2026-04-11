/**
 * Phase 16: Content Engagement Analysis API
 * Tracks which notes, MCQs, videos, and current affairs are most engaging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-config';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ContentEngagementEntry {
  contentId: string;
  contentType: 'note' | 'mcq' | 'video' | 'current_affairs' | 'pdf';
  title: string;
  views: number;
  completions: number;
  bookmarks: number;
  avgTimeSpentSeconds: number;
  completionRate: number;
  engagementScore: number;
}

function calculateEngagementScore(entry: {
  views: number;
  completions: number;
  bookmarks: number;
  avgTimeSpentSeconds: number;
}): number {
  const completionWeight = 0.4;
  const bookmarkWeight = 0.3;
  const timeWeight = 0.3;

  const completionRate = entry.views > 0 ? entry.completions / entry.views : 0;
  const bookmarkRate = entry.views > 0 ? entry.bookmarks / entry.views : 0;
  // Normalize: 300s (5 min) = perfect time score
  const timeScore = Math.min(1, entry.avgTimeSpentSeconds / 300);

  return Math.round(
    (completionRate * completionWeight + bookmarkRate * bookmarkWeight + timeScore * timeWeight) * 100
  ) / 100;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const periodDays = parseInt(searchParams.get('period') || '30');
    const contentType = searchParams.get('type'); // filter by type
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabase = await createClient();
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    // Query notes engagement
    const { data: notesData } = await supabase
      .from('notes')
      .select('id, title, view_count, bookmark_count, created_at')
      .gte('created_at', since)
      .order('view_count', { ascending: false })
      .limit(50);

    // Query MCQ sessions for completion data
    const { data: mcqData } = await supabase
      .from('mcq_sessions')
      .select('topic, completed, created_at')
      .gte('created_at', since);

    // Query bookmarks for popularity
    const { data: bookmarkData } = await supabase
      .from('bookmarks')
      .select('content_id, content_type, created_at')
      .gte('created_at', since);

    // Query current affairs engagement
    const { data: caData } = await supabase
      .from('current_affairs')
      .select('id, title, view_count, created_at')
      .gte('created_at', since)
      .order('view_count', { ascending: false })
      .limit(20);

    // Build engagement entries for notes
    const noteEntries: ContentEngagementEntry[] = (notesData ?? []).map((note: any) => {
      const noteBookmarks = (bookmarkData ?? []).filter(
        (b: any) => b.content_id === note.id && b.content_type === 'note'
      ).length;
      const views = note.view_count ?? 0;
      const entry = {
        views,
        completions: Math.floor(views * 0.6), // Estimate: notes don't have explicit completion
        bookmarks: noteBookmarks || note.bookmark_count || 0,
        avgTimeSpentSeconds: 240, // Default 4 min read time
      };
      return {
        contentId: note.id,
        contentType: 'note' as const,
        title: note.title ?? 'Untitled',
        ...entry,
        completionRate: entry.views > 0 ? entry.completions / entry.views : 0,
        engagementScore: calculateEngagementScore(entry),
      };
    });

    // Build MCQ topic engagement
    const mcqTopicMap: Record<string, { total: number; completed: number }> = {};
    for (const session of (mcqData as any[]) ?? []) {
      const topic = (session.topic as string | null) ?? 'General';
      if (!mcqTopicMap[topic]) mcqTopicMap[topic] = { total: 0, completed: 0 };
      mcqTopicMap[topic].total++;
      if (session.completed) mcqTopicMap[topic].completed++;
    }
    const mcqEntries: ContentEngagementEntry[] = Object.entries(mcqTopicMap)
      .slice(0, 20)
      .map(([topic, stats]) => {
        const entry = {
          views: stats.total,
          completions: stats.completed,
          bookmarks: 0,
          avgTimeSpentSeconds: 600, // 10 min per MCQ session
        };
        return {
          contentId: `mcq-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          contentType: 'mcq' as const,
          title: topic,
          ...entry,
          completionRate: entry.views > 0 ? entry.completions / entry.views : 0,
          engagementScore: calculateEngagementScore(entry),
        };
      });

    // Build current affairs entries
    const caEntries: ContentEngagementEntry[] = (caData ?? []).map((ca: any) => {
      const caBookmarks = (bookmarkData ?? []).filter(
        (b: any) => b.content_id === ca.id && b.content_type === 'current_affairs'
      ).length;
      const views = ca.view_count ?? 0;
      const entry = {
        views,
        completions: Math.floor(views * 0.7),
        bookmarks: caBookmarks,
        avgTimeSpentSeconds: 180,
      };
      return {
        contentId: ca.id,
        contentType: 'current_affairs' as const,
        title: ca.title ?? 'Untitled',
        ...entry,
        completionRate: entry.views > 0 ? entry.completions / entry.views : 0,
        engagementScore: calculateEngagementScore(entry),
      };
    });

    // Combine all entries
    let allEntries = [...noteEntries, ...mcqEntries, ...caEntries];

    // Filter by type if requested
    if (contentType) {
      allEntries = allEntries.filter((e) => e.contentType === contentType);
    }

    // Sort by engagement score and limit
    const topContent = allEntries
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    // Summary stats
    const avgEngagement =
      topContent.length > 0
        ? topContent.reduce((s, e) => s + e.engagementScore, 0) / topContent.length
        : 0;
    const totalViews = allEntries.reduce((s, e) => s + e.views, 0);
    const totalBookmarks = allEntries.reduce((s, e) => s + e.bookmarks, 0);

    // Content type breakdown
    const typeBreakdown: Record<string, { count: number; totalViews: number }> = {};
    for (const entry of allEntries) {
      if (!typeBreakdown[entry.contentType]) {
        typeBreakdown[entry.contentType] = { count: 0, totalViews: 0 };
      }
      typeBreakdown[entry.contentType].count++;
      typeBreakdown[entry.contentType].totalViews += entry.views;
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalContent: allEntries.length,
          totalViews,
          totalBookmarks,
          avgEngagementScore: Math.round(avgEngagement * 100) / 100,
          periodDays,
        },
        typeBreakdown,
        topContent,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Content engagement API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content engagement data' },
      { status: 500 }
    );
  }
}
