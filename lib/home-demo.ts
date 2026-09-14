import donnees from '@/lib/home-demo-data.json';
import type { HomeDemo } from '@/lib/home-demo-types';

/**
 * La scene de demonstration de l'accueil, figee.
 *
 * Elle etait lue a chaque affichage : la video depuis YouTube, le texte
 * depuis le pack designe en base. Deux dependances pour une vitrine —
 * une video retiree de YouTube, un pack renomme ou corrige, et l'accueil
 * changeait ou se vidait sans que personne ne l'ait decide.
 *
 * Tout vit desormais dans le depot : la video recadree et sans son dans
 * `public/video`, et la preparation dans `home-demo-data.json`, extraite
 * une fois du pack avec les noms de vitrine. Changer de demonstration,
 * c'est remplacer ces deux fichiers.
 *
 * La video et la preparation viennent de la meme source, a la milliseconde
 * pres : la scene « Norbert », telechargee depuis le lien qui a servi a
 * preparer le pack, dont on garde la decouverte du dragon, de 110 s a la
 * fin (43,7 s). Les repliques du pack sont decalees d'autant : le texte
 * tombe exactement sur l'image.
 */
const HOME_DEMO: HomeDemo = {
  videoSrc: '/video/demo-norbert.mp4',
  posterSrc: '/video/demo-norbert.jpg',
  ...donnees,
};

export async function loadHomeDemo(): Promise<HomeDemo> {
  return HOME_DEMO;
}
