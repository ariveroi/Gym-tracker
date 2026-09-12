import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabaseEnv();
  const login = request.nextUrl.pathname === '/login';
  if (!env)
    return login
      ? response
      : NextResponse.redirect(new URL('/login', request.url));
  const client = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { data, error } = await client.auth.getClaims();
  // Keep login accessible even when a still-valid JWT belongs to a deleted user.
  // Private pages additionally verify the current user record before rendering.
  if ((error || !data?.claims) && !login) {
    const redirect = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: [
    '/',
    '/login',
    '/historial/:path*',
    '/progreso/:path*',
    '/ejercicio/:path*',
  ],
};
