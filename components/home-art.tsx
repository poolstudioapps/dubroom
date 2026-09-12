/*
 * Illustrations de l'accueil.
 *
 * Elles etaient dessinees en SVG a la main : rien a charger, et elles
 * suivaient le theme. C'etait la bonne decision tant qu'il n'y avait
 * rien d'autre, mais quatre schemas au trait ne font pas une page qu'on
 * a envie de lire. Ce sont maintenant de vraies illustrations, generees
 * dans la palette du site.
 *
 * Trois precautions qui expliquent leur forme :
 *
 *  - aucun texte dedans. Le site parle dix langues, et une image qui
 *    contient un mot n'en parle qu'une ;
 *  - rien de reconnaissable d'une oeuvre existante. Le produit manipule
 *    deja des extraits proteges, il serait absurde d'ajouter du risque
 *    par la decoration ;
 *  - `alt` vide, et c'est voulu : chaque illustration est posee a cote
 *    d'un titre et d'un paragraphe qui disent exactement la meme chose.
 *    La decrire une seconde fois ferait repeter la page a voix haute.
 *
 * Poids total : 86 ko en WebP pour les quatre. L'optimiseur d'images de
 * Next est coupe dans ce projet, d'ou la balise `img` nue et les
 * dimensions ecrites en clair, qui evitent le saut de mise en page.
 */

function Art({ nom, eager }: { nom: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/${nom}.webp`}
      alt=""
      width={1000}
      height={563}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="block aspect-video w-full object-cover"
    />
  );
}

/** Une scène arrive, on en tire une piste image et une piste son. */
export function ArtImport() {
  // La premiere vue du carrousel : elle est visible d'emblee, donc
  // chargee sans attendre.
  return <Art nom="art-import" eager />;
}

/** Les répliques sont réparties entre des voix. */
export function ArtCharacters() {
  return <Art nom="art-characters" />;
}

/** Le texte défile sous une tête de lecture. */
export function ArtRythmo() {
  return <Art nom="art-rythmo" />;
}

/** Tout se recolle : image d'origine, musique d'origine, vos voix. */
export function ArtRender() {
  return <Art nom="art-render" />;
}
