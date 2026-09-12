/**
 * Ou atterrir apres une connexion, et qui a le droit d'entrer.
 *
 * Partage par les deux chemins de retour du lien magique : celui qui
 * recoit un `code` (flot PKCE) et celui qui recoit un `token_hash`
 * (gabarit de courriel). Les deux doivent verifier la liste blanche de la
 * meme facon, sinon l'un devient une porte derobee sur l'autre.
 */

export const DEFAULT_LANDING = '/sessions';

/**
 * Normalise la destination demandee.
 *
 * On n'accepte qu'un chemin interne : une redirection ouverte laisserait
 * un lien de connexion renvoyer vers un site tiers.
 */
export function safeLanding(value: string | null | undefined): string {
  if (!value) return DEFAULT_LANDING;

  // Le gabarit de courriel nous renvoie l'URL complete de rappel : on en
  // extrait la destination reelle plutot que de la recopier telle quelle.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      return safeLanding(parsed.searchParams.get('next'));
    } catch {
      return DEFAULT_LANDING;
    }
  }

  // Un chemin, et un seul : ni `//evil.com`, ni `/\evil.com`.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_LANDING;
  }
  return value;
}
