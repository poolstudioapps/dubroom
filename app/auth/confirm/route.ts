import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

import { safeLanding } from '@/lib/auth-landing';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Verification d'un lien de courriel par empreinte de jeton.
 *
 * C'est le chemin que le gabarit de courriel emprunte : il construit une
 * URL vers cette route avec `{{ .TokenHash }}`, au lieu du
 * `{{ .ConfirmationURL }}` par defaut qui renvoie un jeton dans le
 * fragment — invisible du serveur, et donc inutilisable par une
 * application qui rend ses pages cote serveur.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const landing = safeLanding(searchParams.get('next'));

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    // Un jeton perime est le cas courant, pas une panne : on le nomme.
    const message = error.message.toLowerCase();
    const expired =
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('not found');
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${expired ? 'expired' : 'exchange'}`,
    );
  }

  const { data: allowed } = await supabase.rpc('app_is_allowed');
  if (!allowed) {
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
