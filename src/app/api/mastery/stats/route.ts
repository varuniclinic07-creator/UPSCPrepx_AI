/**
 * Mastery Stats API — GET /api/mastery/stats
 *
 * Returns dashboard stats: level distribution, due count, accuracy, streak.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMasteryStats } from '@/lib/mastery/mastery-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const stats = await getMasteryStats(user.id);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Mastery stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
