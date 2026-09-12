import type { MetadataRoute } from 'next';

import { ROBOTS_ALLOW, SITE_URL } from '@/config/site';

/**
 * Ce que les robots ont le droit de parcourir.
 *
 * Une liste blanche, pas une liste noire : `Disallow: /` d'abord, puis
 * les trois adresses ouvertes. Une nouvelle page du produit est donc
 * fermee par defaut, ce qui est le bon sens du refus. L'inverse
 * obligerait a penser a l'interdire a chaque ajout, et un jour on
 * oublierait.
 *
 * Les robots des moteurs de reponse sont nommes explicitement et traites
 * comme les autres : on veut etre cite par eux, et leur fermer la porte
 * revient a disparaitre des reponses generees.
 */
export default function robots(): MetadataRoute.Robots {
  const allow = [...ROBOTS_ALLOW];

  return {
    rules: [
      { userAgent: '*', allow, disallow: '/' },
      // Moteurs de reponse : meme regle, dite en clair pour que personne
      // ne se demande dans six mois si elle les couvre.
      { userAgent: 'GPTBot', allow, disallow: '/' },
      { userAgent: 'OAI-SearchBot', allow, disallow: '/' },
      { userAgent: 'ClaudeBot', allow, disallow: '/' },
      { userAgent: 'PerplexityBot', allow, disallow: '/' },
      { userAgent: 'Google-Extended', allow, disallow: '/' },
      { userAgent: 'Applebot-Extended', allow, disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
