import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        const { data: bookmarks, error } = await (supabase.from('bookmarks') as any)
            .select('*')
            .eq('user_id', (session as any).user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ bookmarks });
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
        const { title, type, url, metadata } = await request.json();

        if (!title || !type || !url) {
            return NextResponse.json(
                { error: 'Title, type, and URL are required' },
                { status: 400 }
            );
        }

        const { data: bookmark, error } = await (supabase.from('bookmarks') as any)
            .insert({
                user_id: (session as any).user.id,
                title,
                type,
                url,
                metadata: metadata || {},
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ bookmark });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await requireSession();
        const { id } = await request.json();
        const supabase = await createClient();

        const { error } = await (supabase.from('bookmarks') as any)
            .delete()
            .eq('id', id)
            .eq('user_id', (session as any).user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}
