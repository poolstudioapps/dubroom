import type { Metadata, Viewport } from 'next';
import { Anton, Nunito } from 'next/font/google';

import { APP_NAME, APP_TAGLINE } from '@/config/strings';
import { currentLocale } from '@/lib/i18n-server';
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

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  // Produit strictement prive : aucun referencement (PRD §14).
  robots: { index: false, follow: false, nocache: true },
};

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
