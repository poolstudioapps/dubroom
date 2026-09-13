import { SITE_URL } from '@/config/site';
import { getDictionary } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

/**
 * Ce qu'un moteur de reponse doit savoir de Dubblers.
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
    '# Dubblers',
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
      'Accès sur invitation : seules les adresses ajoutées à la liste des invités peuvent entrer.',
      'Scènes de dix minutes et 50 Mo au maximum, dans n’importe quel format vidéo.',
      'Tout se prépare en ligne, dans le navigateur : rien à installer.',
      'Un salon ou un studio sans activité pendant trente minutes se ferme tout seul.',
      'La communauté partage le découpage des scènes (personnages, texte, repères) et leur son d’origine séparé, jamais les vidéos ni les voix des joueurs.',
      'La vidéo finale reste téléchargeable une heure ; pendant cette heure, le groupe peut redoubler la scène. Ensuite la vidéo finale, la vidéo d’origine et les enregistrements sont effacés.',
    ]
      .map((l) => `- ${l}`)
      .join('\n'),
    '',
    '## Liens',
    '',
    `- [Accueil](${SITE_URL}/)`,
    `- [${t.guideHub.title}](${SITE_URL}/guide)`,
    `- [${t.guide.metaTitle}](${SITE_URL}/guide/video-youtube)`,
    `- [${t.guides.prepare.title}](${SITE_URL}/guide/preparer-la-scene)`,
    `- [${t.guides.studio.title}](${SITE_URL}/guide/bien-enregistrer)`,
    `- [${t.guides.publish.title}](${SITE_URL}/guide/publier-un-pack)`,
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
