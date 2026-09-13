import type { Metadata, Viewport } from 'next';
import { Anton, Instrument_Serif, Inter, Nunito } from 'next/font/google';

import { LOCALES, type Locale } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';
import { currentLocale, currentTheme, getDictionary } from '@/lib/i18n-server';
import { REVEAL_SCRIPT } from '@/lib/reveal-script';
import { Providers } from './providers';
import './globals.css';

/*
 * Deux familles, chacune avec un role.
 *
 * Anton pour les titres : condense, tres gras, il tient la place d'une
 * enseigne et supporte l'ombre portee dure des jeux de soiree.
 * Nunito pour tout le reste : arrondi, chaleureux, et surtout lisible en
 * petit corps — la bande rythmo et les noms de personnages se lisent en
 * mouvement.
 *
 * next/font les telecharge au build et les sert depuis notre domaine :
 * aucune requete vers Google a l'execution.
 */
const display = Anton({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const body = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

/*
 * Et deux de plus, pour la peau cinema.
 *
 * Instrument Serif pour les titres : un serif fin et haut, celui des
 * affiches et des generiques. Inter pour le texte : neutre, net, fait
 * pour l'ecran.
 *
 * `preload: false` : elles ne servent qu'a une peau sur trois. Les
 * precharger ferait payer deux polices a chaque visiteur des deux autres
 * peaux ; elles ne se chargent donc que lorsqu'une regle les demande.
 */
const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
});

const grotesk = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-grotesk',
  display: 'swap',
  preload: false,
});

/**
 * Ce que le site declare de lui-meme, dans la langue de la requete.
 *
 * `generateMetadata` et non un objet fige : le titre et la description
 * sont les deux lignes que Google affiche, et les laisser en francais
 * devant un lecteur hispanophone gache la seule chance qu'on a de le
 * faire cliquer.
 *
 * L'indexation est fermee ici par defaut. L'accueil et les pages
 * legales la rouvrent chacune pour elles-memes : c'est plus verbeux,
 * mais une page ajoutee demain nait fermee, et c'est le bon sens du
 * refus quand on heberge des extraits d'oeuvres protegees.
 */
/** L'image qu'affichent les messageries et les reseaux quand on colle le lien. */
const OG_IMAGE = {
  url: '/illustrations/og-card.webp',
  width: 1200,
  height: 675,
  alt: APP_NAME,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${APP_NAME} · ${t.home.kicker}`,
      // Les pages internes n'ont pas a repeter le nom du produit.
      template: `%s · ${APP_NAME}`,
    },
    description: t.home.heroBody,
    applicationName: APP_NAME,
    robots: { index: false, follow: false },
    /*
     * Pas d'`hreflang` : les dix langues partagent une seule adresse,
     * et declarer dix variantes pointant toutes au meme endroit est une
     * erreur que Google signale. Tant qu'une langue n'a pas d'adresse a
     * elle — `/en/`, `/es/` — il n'y a rien a declarer. C'est le
     * prochain pas si le referencement multilingue compte.
     */
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      locale,
      url: SITE_URL,
      title: `${APP_NAME} · ${t.home.kicker}`,
      description: t.home.heroBody,
      images: [OG_IMAGE],
    },
    twitter: {
      // `summary_large_image` sans image affiche un cadre vide : les deux
      // vont ensemble ou ne vont pas du tout.
      card: 'summary_large_image',
      title: `${APP_NAME} · ${t.home.kicker}`,
      description: t.home.heroBody,
      images: [OG_IMAGE.url],
    },
    category: 'technology',
  };
}

export const viewport: Viewport = {
  themeColor: '#2a1b47',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // La langue est choisie ici, une fois par requete, puis descendue a
  // tout l'arbre. Le `lang` de la page suit : c'est lui qui fait la
  // cesure et la synthese vocale correctes.
  const [locale, theme] = await Promise.all([currentLocale(), currentTheme()]);

  return (
    <html
      lang={locale}
      // La peau est posee des le rendu serveur : sans cela, on verrait la
      // peau par defaut le temps que le client se reveille.
      data-theme={theme}
      className={`${display.variable} ${body.variable} ${serif.variable} ${grotesk.variable}`}
      // Le script d'apparition ajoute sa classe avant l'hydratation.
      suppressHydrationWarning
    >
      <head>
        {/* Avant la premiere peinture : voir `lib/reveal-script.ts`. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers locale={locale} theme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
