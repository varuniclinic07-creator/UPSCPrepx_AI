/**
 * Admin Users Management API
 * 
 * Master Prompt v8.0 - F18 Admin Mode
 * - POST: Suspend, Ban, Activate, Grant XP
 * - Admin Only (Verified via Header/Middleware)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

let _sb: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() { if (!_sb) _sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb; }

interface AdminRequest {
    userId: string;
    action: 'suspend' | 'ban' | 'activate' | 'grant_xp';
    amount?: number; // For XP grants
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check — verify caller is admin via Supabase session
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    const body: AdminRequest = await request.json();
    const { userId, action, amount } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Perform Action
    if (action === 'grant_xp' && amount) {
        await getSupabase()
          .from('user_xp_stats')
          .upsert({ user_id: userId, total_earned: amount, current_balance: amount })
          .select();
      
      return NextResponse.json({ success: true, message: `Granted ${amount} XP to ${userId}` });
    }

    // Execute admin action via Supabase Auth Admin API
    if (action === 'suspend' || action === 'ban') {
      // Call Supabase Auth Admin API to update user metadata
      const { error: authError } = await getSupabase().auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            suspended: action === 'suspend',
            banned: action === 'ban',
            suspended_at: new Date().toISOString(),
          }
        }
      );

      if (authError) {
        console.error('Failed to update user auth:', authError);
        return NextResponse.json(
          { error: 'Failed to update user status', details: authError.message },
          { status: 500 }
        );
      }
    }

    if (action === 'activate') {
      const { error: authError } = await getSupabase().auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            suspended: false,
            banned: false,
            activated_at: new Date().toISOString(),
          }
        }
      );

      if (authError) {
        console.error('Failed to activate user:', authError);
        return NextResponse.json(
          { error: 'Failed to activate user', details: authError.message },
          { status: 500 }
        );
      }
    }

    // Log to audit trail
    await getSupabase().from('admin_logs').insert({
      admin_id: 'system_admin',
      action: action.toUpperCase(),
      target_id: userId,
      target_type: 'USER',
      details: JSON.stringify(body)
    });

    return NextResponse.json({
        success: true,
        message: `User ${userId} successfully ${action === 'grant_xp' ? 'granted' : action + 'ed'}.`
    });

  } catch (err) {
    console.error('Admin API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}