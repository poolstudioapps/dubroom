import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/confirm', '/auth/error'];

/**
 * Rafraichit la session Supabase a chaque navigation et ferme le site
 * aux visiteurs non connectes : aucune page n'est publique (PRD §14).
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ce middleware s'execute sur toutes les routes : s'il leve, c'est le
  // site entier qui renvoie MIDDLEWARE_INVOCATION_FAILED, sans indiquer
  // ce qui manque. Un diagnostic lisible vaut mieux qu'une pile d'appels
  // invisible dans les logs de l'hebergeur.
  if (!supabaseUrl || !supabaseKey) {
    const missing = [
      !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
      !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]
      .filter(Boolean)
      .join(', ');

    return new NextResponse(
      `Configuration incomplète : ${missing} manque dans les variables d'environnement du déploiement.`,
      { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() et pas getSession() : seul getUser valide le jeton
  // aupres du serveur d'auth.
  //
  // Un appel reseau echoue parfois — Supabase indisponible, jeton
  // corrompu, coupure passagere. Traiter l'echec comme « non connecte »
  // renvoie l'utilisateur vers la connexion, ce qui est recuperable,
  // la ou une exception rendrait tout le site inaccessible.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // On garde la destination pour y revenir apres le magic link :
    // c'est ce qui fait marcher un lien de session partage a froid.
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/sessions';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
};
