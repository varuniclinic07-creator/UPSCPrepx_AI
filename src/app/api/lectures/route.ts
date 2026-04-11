import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

// GET /api/lectures - Get user's lecture jobs
export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        const { data: lectures, error } = await supabase
            .from('lecture_jobs')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ lectures: lectures || [] });
    } catch (error: any) {
        console.error('Error fetching lectures:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch lectures' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
