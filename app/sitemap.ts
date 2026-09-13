import type { MetadataRoute } from 'next';

import { INDEXABLE_PATHS, SITE_URL } from '@/config/site';

/** Ce qu'on veut voir remonter d'abord : l'accueil, puis les guides. */
function priorite(path: string): number {
  if (path === '/') return 1;
  if (path === '/guide') return 0.8;
  if (path.startsWith('/guide/')) return 0.7;
  // Les pages legales existent pour la conformite, pas pour le classement.
  return 0.3;
}

/**
 * Le plan du site.
 *
 * L'accueil, les guides et les pages legales : tout le reste demande un
 * compte ou porte des extraits d'oeuvres protegees.
 *
 * Aucune declaration de langue : les dix partagent une seule adresse, et
 * annoncer dix variantes au meme endroit n'apprend rien a un moteur. Le
 * robot qui n'envoie pas d'entete de langue — c'est le cas de Googlebot
 * par defaut — recoit le francais, qui est donc la version indexee.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: new Date(),
    changeFrequency:
      path === '/' ? ('weekly' as const) : path.startsWith('/guide') ? ('monthly' as const) : ('yearly' as const),
    priority: priorite(path),
  }));
}
