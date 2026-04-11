import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/auth-config';

export const dynamic = 'force-dynamic';

// GET /api/mind-maps - Get user's mind maps
export async function GET() {
    try {
        const session = await requireSession();
        const supabase = await createClient();

        // Mind maps are stored as notes with content.type = 'mind_map'
        const { data: notes, error } = await (supabase.from('notes') as any)
            .select('id, topic, subject, content, created_at')
            .eq('user_id', (session as any).user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter to only mind maps
        const mindMaps = (notes || [])
            .filter((note: any) => note.content?.type === 'mind_map')
            .map((note: any) => ({
                id: note.id,
                topic: note.topic,
                subject: note.subject,
                nodes: note.content?.nodes || [],
                created_at: note.created_at,
            }));

        return NextResponse.json({ mindMaps });
    } catch (error: any) {
        console.error('Error fetching mind maps:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch mind maps' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}