import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const { id } = await params;

        const { data: messages, error } = await (supabase.from('group_messages') as any)
            .select('*, sender:users(name, avatar_url)')
            .eq('group_id', id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ messages });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession();
        const supabase = await createClient();
        const { id } = await params;
        const { content } = await request.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const { data: message, error } = await (supabase.from('group_messages') as any)
            .insert({
                group_id: id,
                sender_id: (session as any).user.id,
                content: content.trim(),
            })
            .select('*, sender:users(name, avatar_url)')
            .single();

        if (error) throw error;

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
