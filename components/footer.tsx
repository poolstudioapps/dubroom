'use client';

import Link from 'next/link';

import { CookieSettingsButton } from '@/components/cookie-consent';
import { LocalePicker } from '@/components/locale-picker';
import { APP_NAME } from '@/config/strings';
import { useT } from '@/lib/i18n';

// L'or du site, comme tous les liens : le bleu d'origine venait de la
// peau retro et detonnait sur la salle sombre.
const LIEN =
  'rounded-sm py-1 text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-[oklch(0.93_0.13_95)] hover:decoration-current';

/**
 * Pied de page.
 *
 * Il porte trois choses : les liens obligatoires — dont les cookies et
 * le moyen de revenir sur son choix —, le rappel du cadre d'usage, et la
 * langue. Le cadre d'usage n'est pas decoratif : le produit manipule des
 * extraits d'oeuvres protegees, et c'est le caractere prive et non
 * diffuse de l'usage qui le rend tenable (PRD §14).
 *
 * Aucune largeur ici : c'est le gabarit qui la decide.
 */
export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full pb-8 pt-6 text-center">
      <div className="space-y-3 rounded-card border border-bezel-dark/60 bg-bezel/25 px-4 py-4">
        <p className="mx-auto max-w-2xl text-xs leading-relaxed text-text-muted">
          {t.legal.usageNotice}
        </p>

        <nav
          aria-label={t.legal.footerNav}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs"
        >
          <Link href="/mentions-legales" className={LIEN}>
            {t.legal.mentions}
          </Link>
          <Link href="/conditions" className={LIEN}>
            {t.legal.terms}
          </Link>
          <Link href="/confidentialite" className={LIEN}>
            {t.legal.privacy}
          </Link>
          <Link href="/cookies" className={LIEN}>
            {t.legal.cookies}
          </Link>
          <CookieSettingsButton className={LIEN} />
          <a href={`mailto:${t.legal.contactEmail}`} className={LIEN}>
            {t.legal.contact}
          </a>
          <span className="py-1 text-text-faint">
            © {year} {APP_NAME}
          </span>
        </nav>

        {/* La langue sur sa propre ligne, avec un cadre : glissee entre
            les liens legaux, elle se lisait comme l'un d'eux. */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <LocalePicker />
        </div>
      </div>
    </footer>
  );
}
