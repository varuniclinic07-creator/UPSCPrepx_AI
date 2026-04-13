/**
 * CRON: Daily Study Plans — Daily 5:00am
 * Generates personalized daily study plans for active users based on
 * user_mastery (weak nodes, SRS due, untouched topics, today's CA).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface DailyPlanItem {
  time: string;
  action: 'revise' | 'read' | 'practice' | 'new' | 'test';
  topic: string;
  subject: string;
  nodeId: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .gt('updated_at', sevenDaysAgo)
      .limit(100);

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({ success: true, usersProcessed: 0 });
    }

    let usersProcessed = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const user of activeUsers) {
      try {
        const plan: DailyPlanItem[] = [];

        // 1. Find weak nodes (accuracy < 0.5)
        const { data: weakNodes } = await supabase
          .from('user_mastery')
          .select('node_id, accuracy_score, knowledge_nodes(id, title, subject)')
          .eq('user_id', user.id)
          .eq('mastery_level', 'weak')
          .limit(3);

        if (weakNodes) {
          for (const wn of weakNodes) {
            const node = (wn as any).knowledge_nodes;
            if (node) {
              plan.push({
                time: '09:00',
                action: 'revise',
                topic: node.title,
                subject: node.subject || 'General',
                nodeId: node.id,
                reason: `Weak area (accuracy: ${Math.round((wn.accuracy_score || 0) * 100)}%)`,
              });
            }
          }
        }

        // 2. Find SRS due nodes
        const { data: dueNodes } = await supabase
          .from('user_mastery')
          .select('node_id, next_revision_at, knowledge_nodes(id, title, subject)')
          .eq('user_id', user.id)
          .lte('next_revision_at', new Date().toISOString())
          .limit(3);

        if (dueNodes) {
          for (const dn of dueNodes) {
            const node = (dn as any).knowledge_nodes;
            if (node) {
              plan.push({
                time: '14:00',
                action: 'revise',
                topic: node.title,
                subject: node.subject || 'General',
                nodeId: node.id,
                reason: 'SRS revision due',
              });
            }
          }
        }

        // 3. Add today's CA if available
        const { data: todayCA } = await supabase
          .from('current_affairs')
          .select('id, title, node_id')
          .gte('published_date', today)
          .limit(2);

        if (todayCA) {
          for (const ca of todayCA) {
            plan.push({
              time: '10:00',
              action: 'read',
              topic: ca.title,
              subject: 'General',
              nodeId: ca.node_id || '',
              reason: "Today's Current Affairs",
            });
          }
        }

        // 4. Practice quiz on weak areas
        if (weakNodes && weakNodes.length > 0) {
          plan.push({
            time: '16:00',
            action: 'practice',
            topic: 'Mixed weak areas',
            subject: 'Mixed',
            nodeId: '',
            reason: `${weakNodes.length} weak topics need practice`,
          });
        }

        // Store plan in notifications or a dedicated table
        if (plan.length > 0) {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: `Your Study Plan for ${today}`,
              message: JSON.stringify(plan),
              type: 'daily_plan',
              read: false,
            });
          usersProcessed++;
        }
      } catch (err) {
        console.error(`[cron/daily-plans] Failed for user ${user.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, usersProcessed, totalUsers: activeUsers.length });
  } catch (error) {
    console.error('[cron/daily-plans] Failed:', error);
    return NextResponse.json(
      { error: 'Daily plans failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
