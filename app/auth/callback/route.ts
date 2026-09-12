import { NextResponse, type NextRequest } from 'next/server';

import { safeLanding } from '@/lib/auth-landing';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Retour de connexion, flot a code (lien magique PKCE et OAuth Discord).
 *
 * C'est un gestionnaire de route, et ce n'est pas un detail : dans
 * Next.js, seuls une route, une action serveur ou le middleware peuvent
 * ECRIRE des cookies. Un composant serveur ne le peut pas, et
 * `exchangeCodeForSession` y reussit alors sans que la session soit
 * jamais posee — l'utilisateur repart vers la connexion, en boucle.
 *
 * Le flot implicite, lui, met son jeton dans le fragment de l'URL, que le
 * serveur ne voit pas. On y renvoie une page cliente dediee ; le
 * navigateur conserve le fragment a travers la redirection.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const landing = safeLanding(searchParams.get('next'));
  const failure = searchParams.get('error_code') ?? searchParams.get('error');
  const description = searchParams.get('error_description') ?? '';

  if (failure || description) {
    const expired = `${failure ?? ''} ${description}`.toLowerCase().includes('expired');
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${expired ? 'expired' : 'exchange'}`,
    );
  }

  const code = searchParams.get('code');
  if (!code) {
    // Peut-etre un jeton dans le fragment : seul le navigateur peut le lire.
    return NextResponse.redirect(
      `${origin}/auth/callback/hash?next=${encodeURIComponent(landing)}`,
    );
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange`);
  }

  const { data: allowed } = await supabase.rpc('app_is_allowed');
  if (!allowed) {
    // Avec Discord, l'adresse du compte n'est pas forcement celle qui a
    // ete invitee. La nommer evite de chercher a l'aveugle.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const refused = encodeURIComponent(user?.email ?? '');
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/auth/error?reason=not_allowed&email=${refused}`,
    );
  }

  return NextResponse.redirect(`${origin}${landing}`);
}
