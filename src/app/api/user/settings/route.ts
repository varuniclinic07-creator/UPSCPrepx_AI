import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase.from('users') as any)
      .select('name, email, preferences')
      .eq('id', authUser.id)
      .single();

    return NextResponse.json({
      name: profile?.name || authUser.user_metadata?.name || '',
      email: profile?.email || authUser.email || '',
      preferences: profile?.preferences || {},
    });
  } catch (error) {
    console.error('[Settings API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, preferences } = body;

    // Update user profile in database
    const { error } = await (supabase.from('users') as any)
      .update({
        name,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id);

    if (error) {
      // If users table doesn't exist yet, update auth metadata instead
      if (error.message?.includes('relation') || error.code === '42P01') {
        await supabase.auth.updateUser({ data: { name } });
        return NextResponse.json({ success: true, fallback: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Settings API] PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
