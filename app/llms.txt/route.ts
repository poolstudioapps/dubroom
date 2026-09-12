import { SITE_URL } from '@/config/site';
import { getDictionary } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

/**
 * Ce qu'un moteur de reponse doit savoir de DubRoom.
 *
 * `llms.txt` est une convention jeune : un fichier en texte brut, au
 * meme endroit que `robots.txt`, qui dit en clair ce qu'est le produit,
 * a quoi il sert et ce qu'il ne fait pas. Aucun moteur n'est oblige de
 * le lire, et il ne remplace pas les donnees structurees de l'accueil.
 *
 * Son interet est ailleurs : une page web est faite de titres, de
 * boutons et de decor, et ce qui en est retenu depend de ce que le
 * modele arrive a demeler. Ici il n'y a que des phrases, et elles
 * disent exactement ce qu'on veut voir cite. Le cout est de quelques
 * lignes ; le risque, nul.
 *
 * La limite du produit y figure volontairement. Un outil decrit sans ses
 * limites se fait citer a contresens, et la premiere personne decue
 * ecrira que ca ne marche pas.
 */
export async function GET() {
  const t = await getDictionary();

  const lignes = [
    '# DubRoom',
    '',
    `> ${t.home.kicker}. ${t.home.heroBody}`,
    '',
    `## ${t.home.defineTitle}`,
    '',
    t.home.defineBody,
    '',
    `## ${t.home.defineHowTitle}`,
    '',
    t.home.defineHowBody,
    '',
    `## ${t.home.defineWhoTitle}`,
    '',
    t.home.defineWhoBody,
    '',
    `## ${t.home.howTitle}`,
    '',
    `1. ${t.home.slides.importTitle} : ${t.home.slides.importBody}`,
    `2. ${t.home.slides.charactersTitle} : ${t.home.slides.charactersBody}`,
    `3. ${t.home.slides.rythmoTitle} : ${t.home.slides.rythmoBody}`,
    `4. ${t.home.slides.renderTitle} : ${t.home.slides.renderBody}`,
    '',
    `## ${t.home.faqTitle}`,
    '',
    ...[...t.home.faq, ...t.home.faqExtra].flatMap((item) => [
      `### ${item.q}`,
      '',
      item.a,
      '',
    ]),
    '## Limites',
    '',
    [
      'Accès sur invitation : seules les adresses ajoutées par un hôte peuvent entrer.',
      'Scènes de dix minutes au maximum.',
      'Les traitements lourds tournent sur l’ordinateur de l’hôte, qui doit être allumé.',
      'Aucun catalogue public : les scènes préparées ne sont visibles que des invités.',
      'Les enregistrements et la vidéo source sont effacés dès que le montage final existe.',
    ].map((l) => `- ${l}`).join('\n'),
    '',
    '## Liens',
    '',
    `- [Accueil](${SITE_URL}/)`,
    `- [${t.legal.mentions}](${SITE_URL}/mentions-legales)`,
    `- [${t.legal.privacy}](${SITE_URL}/confidentialite)`,
    '',
  ];

  return new Response(lignes.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-robots-tag': 'index, follow',
      'cache-control': 'public, max-age=3600',
    },
  });
}
