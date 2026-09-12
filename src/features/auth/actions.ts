'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
export async function login(
  _previous: { error: string } | null,
  form: FormData,
): Promise<{ error: string } | null> {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(256) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Introduce un email válido y tu contraseña.' };
  if (!getSupabaseEnv())
    return {
      error: 'Configura las variables de Supabase para iniciar sesión.',
    };
  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      return {
        error:
          'No se ha podido entrar. Revisa tus datos o inténtalo de nuevo en unos minutos.',
      };
  } catch {
    return {
      error: 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.',
    };
  }
  redirect('/');
}
export async function logout() {
  const client = await createClient();
  const { error } = await client.auth.signOut();
  if (error)
    throw new Error('No se pudo cerrar la sesión. Inténtalo de nuevo.');
  redirect('/login');
}
