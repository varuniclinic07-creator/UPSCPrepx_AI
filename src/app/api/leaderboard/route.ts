import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        // Get topperformers for leaderboard
        const { data: leaderboard, error } = await (supabase.from('users') as any)
            .select('id, name, avatar_url, points, rank')
            .order('points', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Find user's current rank
        const userRank = leaderboard.findIndex((u: any) => u.id === (session as any).user.id) + 1;

        return NextResponse.json({
            leaderboard,
            userRank: userRank || '50+',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
