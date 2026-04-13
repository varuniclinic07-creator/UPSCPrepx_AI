/**
 * Push Subscription API — /api/notifications/subscribe
 *
 * POST - Register a web push subscription
 * DELETE - Unregister a push subscription
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription — endpoint required' },
        { status: 400 }
      );
    }

    const tokenStr = JSON.stringify(subscription);

    await (supabase.from('push_notification_tokens') as any).upsert(
      {
        user_id: user.id,
        token: tokenStr,
        device_type: 'WEB',
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
    }

    // Find and delete matching subscription
    const { data: tokens } = await (supabase
      .from('push_notification_tokens') as any)
      .select('id, token')
      .eq('user_id', user.id);

    for (const t of tokens || []) {
      try {
        const sub = JSON.parse(t.token);
        if (sub.endpoint === endpoint) {
          await (supabase.from('push_notification_tokens') as any)
            .delete()
            .eq('id', t.id);
        }
      } catch {
        // Skip malformed token
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
