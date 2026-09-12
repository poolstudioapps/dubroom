/**
 * Ce que le site raconte de lui-meme aux moteurs.
 *
 * Un seul endroit, parce que la meme chose doit etre dite au meme mot
 * dans le titre, la description, les donnees structurees, le plan du
 * site et le fichier destine aux moteurs de reponse. Un produit qui se
 * decrit differemment a trois endroits ne se classe nulle part.
 */

/**
 * L'adresse canonique.
 *
 * Elle sert aux liens absolus des donnees structurees et du plan du
 * site, que ni l'un ni l'autre ne tolerent en relatif. Vercel expose
 * l'adresse de production ; en local, on retombe sur le port habituel.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

/**
 * Les seules adresses ouvertes a l'indexation.
 *
 * Tout le reste est derriere la connexion et porte des extraits d'oeuvres
 * protegees. Un catalogue d'extraits indexe est exactement ce qui
 * transforme un usage prive en service de contrefacon : la liste est
 * donc blanche, et non noire. Ce qui n'y figure pas est ferme.
 */
export const INDEXABLE_PATHS = [
  '/',
  '/mentions-legales',
  '/confidentialite',
  '/conditions',
] as const;

/**
 * Les memes adresses, ecrites pour `robots.txt`.
 *
 * La racine y devient `/$` : dans un fichier robots, `Allow: /` autorise
 * tout le site, et pose cote a cote avec `Disallow: /` c'est lui qui
 * l'emporte, les deux motifs ayant la meme longueur. Le site entier
 * serait alors ouvert au parcours. Le `$` ancre la fin de chaine et ne
 * laisse passer que la racine elle-meme.
 */
export const ROBOTS_ALLOW = [
  '/$',
  '/mentions-legales',
  '/confidentialite',
  '/conditions',
] as const;

export function isIndexable(pathname: string): boolean {
  return (INDEXABLE_PATHS as readonly string[]).includes(pathname);
}

/**
 * Les mots par lesquels on veut etre trouve.
 *
 * Ils ne sont pas la pour etre semes dans une balise `keywords`, que
 * plus aucun moteur ne lit depuis vingt ans, mais pour tenir la
 * redaction : chaque titre et chaque reponse de la foire aux questions
 * doit en contenir naturellement, sinon ce n'est pas la bonne page.
 */
export const SEO_TERMS = [
  'doublage de scène de film',
  'logiciel de doublage',
  'doubler une scène de film',
  'redoubler un film entre amis',
  'bande rythmo en ligne',
  'studio de doublage en ligne',
  'séparer les voix et la musique',
  'fandub',
] as const;
