/**
 * Auth shim — delegates to auth-config
 * Created to resolve missing module import in studio routes
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function getAuthUser(_request?: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return user;
}
