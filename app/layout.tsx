import type { Metadata, Viewport } from 'next';
import { Anton, Nunito } from 'next/font/google';

import { LOCALES, type Locale } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';
import { currentLocale, getDictionary } from '@/lib/i18n-server';
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
    },
    twitter: {
      card: 'summary_large_image',
      title: `${APP_NAME} · ${t.home.kicker}`,
      description: t.home.heroBody,
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
  const locale = await currentLocale();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">
        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
