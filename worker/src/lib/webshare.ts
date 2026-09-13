/**
 * La liste courante des intermediaires, demandee a Webshare.
 *
 * Une liste ecrite en dur se perime : l'offre gratuite renouvelle ses
 * adresses, et celles qu'on avait eprouvees un soir ne repondent plus la
 * semaine suivante. On demande donc la liste du moment, et le worker
 * essaie ce qu'elle contient.
 *
 * Attention a ce que « valide » veut dire ici. Webshare marque une
 * adresse valide quand elle repond, pas quand YouTube l'accepte : sur
 * dix adresses toutes declarees valides, une seule a livre une video.
 * Ce module fournit donc des candidates, et c'est `ytdlp.ts` qui tranche
 * en essayant pour de vrai.
 */

import { config } from '../config.ts';
import { log } from '../log.ts';

const API = 'https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page_size=100';

/** Au-dela, on prefere une liste un peu vieille a un job qui attend. */
const DELAI_MS = 10_000;

/**
 * La liste tient en memoire quelques minutes.
 *
 * Un import enchaine une inspection puis un telechargement, et chacun
 * peut reessayer sur plusieurs sorties : sans ce cache, une scene
 * interrogerait l'API une dizaine de fois pour la meme reponse.
 */
const CACHE_MS = 10 * 60 * 1000;
let cache: { a: number; liste: string[] } | null = null;

type Entree = {
  proxy_address?: string;
  port?: number;
  username?: string;
  password?: string;
  valid?: boolean;
};

export async function listerProxys(): Promise<string[]> {
  if (!config.webshareToken) return [];
  if (cache && Date.now() - cache.a < CACHE_MS) return cache.liste;

  try {
    const reponse = await fetch(API, {
      headers: { Authorization: `Token ${config.webshareToken}` },
      signal: AbortSignal.timeout(DELAI_MS),
    });
    if (!reponse.ok) {
      throw new Error(`HTTP ${reponse.status}`);
    }

    const donnees = (await reponse.json()) as { results?: Entree[] };
    const liste = (donnees.results ?? [])
      .filter((e) => e.valid !== false && e.proxy_address && e.port)
      .map(
        (e) =>
          `http://${encodeURIComponent(e.username ?? '')}:` +
          `${encodeURIComponent(e.password ?? '')}@${e.proxy_address}:${e.port}`,
      );

    cache = { a: Date.now(), liste };
    log.info('intermédiaires listés', { nombre: liste.length });
    return liste;
  } catch (error) {
    /*
     * Une API injoignable ne doit pas faire echouer l'import.
     *
     * Il reste la liste ecrite a la main, puis la connexion directe —
     * celle qui suffit depuis le PC d'un hote. On se contente donc d'un
     * avertissement, et on laisse `ytdlp.ts` essayer ce qu'il a.
     */
    log.warn('liste des intermédiaires indisponible', {
      detail: error instanceof Error ? error.message : String(error),
    });
    return cache?.liste ?? [];
  }
}
