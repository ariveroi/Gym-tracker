import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';
import type { Database } from '@/types/database';
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error('Falta configurar Supabase. Consulta el README.');
  const store = await cookies();
  return createServerClient<Database>(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* El proxy actualiza las cookies en Server Components. */
        }
      },
    },
  });
}
