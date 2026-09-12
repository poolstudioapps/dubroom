import type { MetadataRoute } from 'next';

import { INDEXABLE_PATHS, SITE_URL } from '@/config/site';

/**
 * Le plan du site.
 *
 * Trois adresses, et c'est normal : tout le reste demande un compte et
 * porte des extraits d'oeuvres protegees.
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
    changeFrequency: path === '/' ? ('weekly' as const) : ('yearly' as const),
    // L'accueil est la page qu'on veut voir remonter ; les pages legales
    // existent pour la conformite, pas pour le classement.
    priority: path === '/' ? 1 : 0.3,
  }));
}
