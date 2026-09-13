import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { INDEXABLE_PATHS } from '@/config/site';
import { AUTH_COOKIE_OPTIONS, withAuthCookieOptions } from '@/lib/supabase/cookies';

// `/guide` : des pages d'aide, sans aucune donnee. Ouvertes pour que le
// lien de l'accueil ne mene pas a la connexion, mais fermees aux moteurs :
// robots.txt ferme tout ce qui n'est pas explicitement indexable, et
// chaque page le redit dans ses metadonnees.
const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/confirm', '/auth/error', '/guide'];

// L'accueil et les pages legales se visitent sans compte : elles
// n'exposent aucune scene, aucun participant, aucun rendu. Les trois
// fichiers destines aux robots suivent, sans quoi ils repondraient par
// une redirection vers la connexion et ne serviraient a rien.
//
// La liste n'est pas recopiee mais tiree de celle des pages indexables :
// c'est la meme question posee deux fois. Une page ouverte aux moteurs
// et fermee par ce fichier ne s'indexe pas — elle renvoie une
// redirection vers la connexion. Les conditions generales sont nees
// comme ca, et le lien pose sous le formulaire de connexion, celui-la
// meme qu'il faut lire avant de cocher, menait a la connexion.
/** Ce qui ne s'adresse qu'aux machines, et ne connait pas de session. */
const ROBOT_FILES = ['/robots.txt', '/sitemap.xml', '/llms.txt'] as readonly string[];

// La communaute se visite sans compte, mais seulement sa page d'accueil :
// un apercu des scenes les mieux notees, sous un voile. Les fiches
// `/communaute/[id]` restent derriere la connexion.
const PUBLIC_PREVIEWS = ['/communaute'] as readonly string[];

const PUBLIC_EXACT = [...INDEXABLE_PATHS, ...ROBOT_FILES, ...PUBLIC_PREVIEWS] as readonly string[];
// /auth/callback/hash est couvert par le prefixe /auth/callback.

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

  /*
   * Les fichiers pour robots n'ont pas de session a rafraichir.
   *
   * Le middleware tourne sur chaque requete et appelait le serveur
   * d'authentification a chaque fois, y compris pour trois fichiers
   * texte qui n'ont aucune notion d'utilisateur. C'etait un aller-retour
   * reseau ajoute au temps de reponse, pour rien.
   *
   * La liste s'arrete la, et c'est reflechi. L'accueil et les pages
   * legales sont publiques mais affichent une barre qui depend de l'etat
   * de connexion : les priver du rafraichissement ferait apparaitre
   * « Se connecter » a quelqu'un qui l'est, le temps d'une page.
   */
  if (ROBOT_FILES.includes(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
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
          // Chaque navigation repousse l'echeance : quelqu'un qui
          // revient une fois par mois ne se reconnecte jamais.
          response.cookies.set(name, value, withAuthCookieOptions(options));
        }
      },
    },
  });

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
  const isPublic =
    PUBLIC_EXACT.includes(pathname) || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

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
  matcher: [
    // Les fichiers statiques ne passent pas par la session : le son des
    // notifications repondait par une redirection vers la connexion.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3)$).*)',
  ],
};
