import Link from 'next/link';

import { APP_NAME, t } from '@/config/strings';

/**
 * Pied de page.
 *
 * Il porte deux choses : les liens obligatoires, et le rappel du cadre
 * d'usage. Ce dernier n'est pas decoratif — le produit manipule des
 * extraits d'oeuvres protegees, et c'est le caractere prive et non
 * diffuse de l'usage qui le rend tenable (PRD §14).
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 text-center">
      <div className="space-y-3 rounded-card border border-bezel-dark/60 bg-bezel/25 px-4 py-4">
        <p className="text-xs text-[oklch(0.82_0.03_300)]">
          {t.legal.usageNotice}
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link
            href="/mentions-legales"
            className="text-[oklch(0.88_0.06_200)] underline underline-offset-4 hover:text-white"
          >
            {t.legal.mentions}
          </Link>
          <Link
            href="/confidentialite"
            className="text-[oklch(0.88_0.06_200)] underline underline-offset-4 hover:text-white"
          >
            {t.legal.privacy}
          </Link>
          <span className="text-[oklch(0.7_0.03_300)]">
            © {year} {APP_NAME}
          </span>
        </nav>
      </div>
    </footer>
  );
}
