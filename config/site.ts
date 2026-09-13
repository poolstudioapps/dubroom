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
 * L'accueil, les guides et les pages legales : ce qui explique le produit
 * sans rien montrer d'une oeuvre. La communaute reste fermee, meme si son
 * apercu est visible sans compte — c'est un catalogue d'extraits de films,
 * et un catalogue d'extraits indexe est exactement ce qui transforme un
 * usage prive en service de contrefacon. La liste est donc blanche, et
 * non noire : ce qui n'y figure pas est ferme.
 */
export const INDEXABLE_PATHS = [
  '/',
  '/guide',
  '/guide/video-youtube',
  '/guide/preparer-la-scene',
  '/guide/bien-enregistrer',
  '/guide/publier-un-pack',
  '/guide/devenir-certifie',
  '/mentions-legales',
  '/confidentialite',
  '/conditions',
  '/cookies',
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
  '/guide',
  '/mentions-legales',
  '/confidentialite',
  '/conditions',
  '/cookies',
  // Le fichier des moteurs de reponse, et les images des apercus de partage.
  '/llms.txt',
  '/illustrations/',
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
  'jeu de doublage entre amis',
  'doublage de scène de film',
  'logiciel de doublage',
  'doubler une scène de film',
  'redoubler un film entre amis',
  'bande rythmo en ligne',
  'studio de doublage en ligne',
  'séparer les voix et la musique',
  'fandub',
] as const;

/**
 * Les reseaux sociaux du pied de page.
 *
 * Vides tant que les comptes n'existent pas : l'icone s'affiche quand
 * meme, marquee « bientot », et devient un lien des qu'une adresse est
 * renseignee ici.
 */
export const SOCIAL_LINKS = {
  instagram: '',
  tiktok: '',
  youtube: '',
} as const;
