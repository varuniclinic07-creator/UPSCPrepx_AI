import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        const { data: groups, error } = await (supabase.from('study_groups') as any)
            .select('*, members:group_members(count)')
            .eq('is_active', true);

        if (error) throw error;

        return NextResponse.json({ groups });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const { name, description, subject } = await request.json();

        const { data: group, error } = await (supabase.from('study_groups') as any)
            .insert({
                name,
                description,
                subject,
                created_by: (session as any).user.id,
            })
            .select()
            .single();

        if (error) throw error;

        // Add creator as first member
        await (supabase.from('group_members') as any).insert({
            group_id: group.id,
            user_id: (session as any).user.id,
            role: 'admin',
        });

        return NextResponse.json({ group });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
