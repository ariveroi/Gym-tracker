import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
export const requireUser = cache(async function requireUser() {
  if (!getSupabaseEnv()) redirect('/login');
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect('/login');
  return { client, user };
});
