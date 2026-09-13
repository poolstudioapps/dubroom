import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';

/**
 * Les donnees structurees d'un guide.
 *
 * Un fil d'Ariane, les etapes et les questions : c'est ce qu'un moteur
 * reprend tel quel dans ses resultats, et ce qu'un moteur de reponse cite
 * quand on lui demande « comment doubler une scene entre amis ».
 */
export function GuideStructuredData({
  path,
  name,
  description,
  image,
  locale,
  hubName,
  steps,
  faq,
}: {
  /** L'adresse du guide, `/guide/...`, ou `/guide` pour le centre d'aide. */
  path: string;
  name: string;
  description: string;
  image?: string;
  locale: string;
  hubName: string;
  steps?: readonly { title: string; body: string }[];
  faq?: readonly { q: string; a: string }[];
}) {
  const url = `${SITE_URL}${path}`;
  const fil = [
    { name: APP_NAME, item: SITE_URL },
    { name: hubName, item: `${SITE_URL}/guide` },
    ...(path === '/guide' ? [] : [{ name, item: url }]),
  ];

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: fil.map((etape, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: etape.name,
        item: etape.item,
      })),
    },
  ];

  if (steps?.length) {
    graph.push({
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name,
      description,
      inLanguage: locale,
      ...(image ? { image: `${SITE_URL}${image}` } : {}),
      step: steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.title,
        text: step.body,
      })),
    });
  }

  if (faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      // Nos propres dictionnaires, jamais une saisie.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  );
}
