import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json({ success: true }); // still redirect even if signout fails
  }
}
