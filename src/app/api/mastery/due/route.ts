/**
 * Mastery Due Items API — GET /api/mastery/due
 *
 * Returns knowledge nodes due for SRS revision, with topic details.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDueRevisions } from '@/lib/mastery/mastery-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    const dueItems = await getDueRevisions(user.id, limit);

    return NextResponse.json({
      success: true,
      data: {
        items: dueItems,
        count: dueItems.length,
      },
    });
  } catch (error) {
    console.error('Mastery due error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
