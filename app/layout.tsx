import type { Metadata, Viewport } from 'next';
import { Anton, Instrument_Serif, Inter, Nunito } from 'next/font/google';
import { headers } from 'next/headers';

import { LOCALES, type Locale } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';
import { CookieConsent } from '@/components/cookie-consent';
import { currentLocale, getDictionary } from '@/lib/i18n-server';
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
  // Ne servent plus qu'aux rares accroches qui les nomment encore : le
  // cinema a ses propres polices, prechargees, elles.
  preload: false,
});

const body = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
});

/*
 * Les polices du site.
 *
 * Instrument Serif pour les titres : un serif fin et haut, celui des
 * affiches et des generiques. Inter pour le texte : neutre, net, fait
 * pour l'ecran. Elles sont prechargees : ce sont elles que chaque page
 * affiche en premier.
 */
const serif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-serif',
  display: 'swap',
});

const grotesk = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-grotesk',
  display: 'swap',
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
/*
 * Une bande d'amis qui rient dans une salle de cinema : c'est la scene
 * qu'on promet a la personne invitee. En JPEG et au format 1,91:1, le
 * seul que toutes les messageries affichent sans le recadrer ni l'ignorer.
 */
const OG_IMAGE = {
  url: '/illustrations/og-invitation.jpg',
  width: 1200,
  height: 630,
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
  themeColor: '#0e0d0b',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // La langue est choisie ici, une fois par requete, puis descendue a
  // tout l'arbre. Le `lang` de la page suit : c'est lui qui fait la
  // cesure et la synthese vocale correctes.
  const locale = await currentLocale();
  // Le nonce de la politique de securite du contenu, tire par le
  // middleware : sans lui, le script en ligne ci-dessous serait bloque.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${serif.variable} ${grotesk.variable}`}
      // Le script d'apparition ajoute sa classe avant l'hydratation.
      suppressHydrationWarning
    >
      <head>
        {/* Avant la premiere peinture : voir `lib/reveal-script.ts`. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers locale={locale}>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
