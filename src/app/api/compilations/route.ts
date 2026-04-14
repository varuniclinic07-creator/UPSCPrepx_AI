/**
 * Monthly Compilations API — /api/compilations
 *
 * GET: List user's compilations
 * POST: Request a new monthly compilation
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: compilations } = await (supabase
      .from('monthly_compilations') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    return NextResponse.json({ compilations: compilations || [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year required' }, { status: 400 });
    }

    const { data: existing } = await (supabase
      .from('monthly_compilations') as any)
      .select('id, status')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (existing) {
      return NextResponse.json({ compilation: existing, message: 'Already exists' });
    }

    const { data: created, error } = await (supabase
      .from('monthly_compilations') as any)
      .insert({
        user_id: user.id,
        month,
        year,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ compilation: created, message: 'Compilation requested' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
