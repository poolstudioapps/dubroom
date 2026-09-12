import type { Metadata, Viewport } from 'next';
import { APP_NAME, APP_TAGLINE } from '@/config/strings';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  // Produit strictement prive : aucun referencement (PRD §14).
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: '#12121a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
