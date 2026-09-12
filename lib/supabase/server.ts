import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_OPTIONS, withAuthCookieOptions } from './cookies';
import type { Database } from './database.types';

/**
 * Client serveur (RSC, route handlers, server actions).
 *
 * La cle utilisee est toujours la cle anonyme : la cle service ne vit
 * que sur le worker (PRD §14). Tout ce que le front peut faire, il le
 * fait donc sous RLS ou via une fonction `security definer`.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, withAuthCookieOptions(options));
            }
          } catch {
            // Appel depuis un Server Component : le refresh de session est
            // deja assure par le middleware, on peut ignorer.
          }
        },
      },
    },
  );
}

/** Utilisateur courant, ou null. */
export async function currentUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
