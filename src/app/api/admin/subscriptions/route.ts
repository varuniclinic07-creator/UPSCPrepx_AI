/**
 * Admin Subscriptions Management API
 * List, filter, and manage subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth/auth-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const plan = searchParams.get('plan') || 'all';

    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        users (
          id,
          email,
          full_name,
          avatar_url
        )
      `, { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (plan !== 'all') {
      query = query.eq('plan_type', plan);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: subscriptions, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, subscriptionId, data } = body;

    switch (action) {
      case 'cancel':
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', subscriptionId);
        break;

      case 'reactivate':
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('id', subscriptionId);
        break;

      case 'refund':
        await supabase
          .from('subscriptions')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_amount: data?.amount
          })
          .eq('id', subscriptionId);
        break;

      case 'extend':
        const currentEnd = new Date(data?.current_end);
        const extensionDays = parseInt(data?.days || '0');
        const newEnd = new Date(currentEnd.getTime() + extensionDays * 24 * 60 * 60 * 1000);

        await supabase
          .from('subscriptions')
          .update({ ends_at: newEnd.toISOString() })
          .eq('id', subscriptionId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${action}d successfully`,
    });
  } catch (error) {
    console.error('Subscription action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
