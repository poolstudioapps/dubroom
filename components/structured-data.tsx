import type { Dictionary } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';

/**
 * Les donnees structurees de l'accueil.
 *
 * Elles ne changent pas le classement par elles-memes. Ce qu'elles
 * changent, c'est la facon dont la page est reprise : une foire aux
 * questions balisee peut apparaitre depliee dans les resultats, et
 * surtout, les moteurs de reponse s'en servent pour citer une reponse
 * exacte plutot que de resumer la page a leur facon. C'est la difference
 * entre etre cite et etre paraphrase de travers.
 *
 * Trois blocs, et rien de plus : l'application, l'editeur, les
 * questions. Baliser ce qu'on n'a pas — des avis, un prix, une note —
 * est une invitation au rejet manuel.
 */
export function StructuredData({ t, locale }: { t: Dictionary; locale: string }) {
  const graph = [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: APP_NAME,
      url: SITE_URL,
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: t.home.kicker,
      operatingSystem: 'Web',
      description: t.home.heroBody,
      inLanguage: locale,
      // Gratuit, et il faut le dire : c'est un critere de selection
      // frequent dans les reponses generees.
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      featureList: [
        t.home.slides.importTitle,
        t.home.slides.charactersTitle,
        t.home.slides.rythmoTitle,
        t.home.slides.renderTitle,
      ],
      author: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#publisher`,
      name: 'Pool Studio',
      url: SITE_URL,
      email: `mailto:${t.legal.contactEmail}`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#site`,
      url: SITE_URL,
      name: APP_NAME,
      inLanguage: locale,
      publisher: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [...t.home.faq, ...t.home.faqExtra].map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@type': 'HowTo',
      '@id': `${SITE_URL}/#howto`,
      name: t.home.howTitle,
      inLanguage: locale,
      step: [
        { title: t.home.slides.importTitle, body: t.home.slides.importBody },
        { title: t.home.slides.charactersTitle, body: t.home.slides.charactersBody },
        { title: t.home.slides.rythmoTitle, body: t.home.slides.rythmoBody },
        { title: t.home.slides.renderTitle, body: t.home.slides.renderBody },
      ].map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.title,
        text: step.body,
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Le contenu vient de nos propres dictionnaires, jamais d'une
      // saisie : il n'y a rien a echapper au-dela de la serialisation.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  );
}
