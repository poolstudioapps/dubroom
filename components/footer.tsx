import Link from 'next/link';

import { APP_NAME, t } from '@/config/strings';

/**
 * Pied de page.
 *
 * Il porte deux choses : les liens obligatoires, et le rappel du cadre
 * d'usage. Ce dernier n'est pas decoratif — le produit manipule des
 * extraits d'oeuvres protegees, et c'est le caractere prive et non
 * diffuse de l'usage qui le rend tenable (PRD §14).
 *
 * Aucune largeur ici : c'est le gabarit qui la decide, et il l'a deja
 * fixee pour le reste de la page. Un `max-w` en plus donnait un pied de
 * page decale de ses propres contenus sur les pages legales.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full pb-8 pt-6 text-center">
      <div className="space-y-3 rounded-card border border-bezel-dark/60 bg-bezel/25 px-4 py-4">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-[oklch(0.82_0.03_300)]">
          {t.legal.usageNotice}
        </p>

        <nav
          aria-label="Liens de bas de page"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs"
        >
          <Link
            href="/mentions-legales"
            className="rounded-sm py-1 text-[oklch(0.88_0.06_200)] underline underline-offset-4 hover:text-white"
          >
            {t.legal.mentions}
          </Link>
          <Link
            href="/confidentialite"
            className="rounded-sm py-1 text-[oklch(0.88_0.06_200)] underline underline-offset-4 hover:text-white"
          >
            {t.legal.privacy}
          </Link>
          <a
            href={`mailto:${t.legal.contactEmail}`}
            className="rounded-sm py-1 text-[oklch(0.88_0.06_200)] underline underline-offset-4 hover:text-white"
          >
            {t.legal.contact}
          </a>
          <span className="py-1 text-[oklch(0.7_0.03_300)]">
            © {year} {APP_NAME}
          </span>
        </nav>
      </div>
    </footer>
  );
}
