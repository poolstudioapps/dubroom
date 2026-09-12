import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Retour du magic link. On echange le code contre une session, puis on
 * verifie la liste blanche : une adresse non invitee est deconnectee
 * immediatement et voit un message clair, pas une page vide (PRD §14).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/sessions';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange`);
  }

  const { data: allowed } = await supabase.rpc('app_is_allowed');
  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=not_allowed`);
  }

  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/sessions'}`);
}
