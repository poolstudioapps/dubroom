'use client';

import Link from 'next/link';

import { CookieSettingsButton } from '@/components/cookie-consent';
import { LocalePicker } from '@/components/locale-picker';
import { GUIDE_VIDEO_HREF } from '@/config/constants';
import { SOCIAL_LINKS } from '@/config/site';
import { APP_NAME } from '@/config/strings';
import { useT } from '@/lib/i18n';

const LIEN =
  'rounded-sm text-sm text-accent/85 transition-colors hover:text-accent-hover focus-visible:text-accent-hover';

/** Les trois reseaux, dessines ici : les marques ne vivent pas dans les jeux d'icones. */
function IconeReseau({ nom }: { nom: keyof typeof SOCIAL_LINKS }) {
  const commun = {
    viewBox: '0 0 24 24',
    className: 'h-[18px] w-[18px]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (nom === 'instagram') {
    return (
      <svg {...commun}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (nom === 'tiktok') {
    return (
      <svg {...commun}>
        <path d="M14 3.5v11a3.75 3.75 0 1 1-3.75-3.75" />
        <path d="M14 3.5c.4 2.9 2.4 4.7 5.5 4.9" />
      </svg>
    );
  }
  return (
    <svg {...commun}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.25 9.25v5.5L15 12z" fill="currentColor" stroke="none" />
    </svg>
  );
}

const RESEAUX: { nom: keyof typeof SOCIAL_LINKS; label: string }[] = [
  { nom: 'instagram', label: 'Instagram' },
  { nom: 'tiktok', label: 'TikTok' },
  { nom: 'youtube', label: 'YouTube' },
];

/**
 * Pied de page.
 *
 * Dans l'esprit des pieds de page des plateformes de creation : la
 * marque, sa phrase et ses reseaux a gauche, puis des colonnes de liens
 * courtes et titrees, et une derniere bande pour le cadre d'usage, le
 * droit et la langue. Le cadre d'usage n'est pas decoratif : le produit
 * manipule des extraits d'oeuvres protegees, et c'est le caractere prive
 * de l'usage qui le rend tenable (PRD §14).
 *
 * Aucune largeur ici : c'est le gabarit qui la decide.
 */
export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  const colonnes: { titre: string; liens: { href: string; label: string }[] }[] = [
    {
      titre: t.legal.footerExplore,
      liens: [
        { href: '/', label: t.nav.home },
        { href: '/communaute', label: t.nav.community },
        { href: '/sessions/new', label: t.sessions.create },
        { href: '/guide', label: t.nav.guides },
      ],
    },
    {
      titre: t.legal.footerHelp,
      liens: [
        { href: GUIDE_VIDEO_HREF, label: t.guide.metaTitle },
        { href: '/guide/bien-enregistrer', label: t.guides.studio.title },
        { href: '/guide/publier-un-pack', label: t.guides.publish.title },
        { href: `mailto:${t.legal.contactEmail}`, label: t.legal.contact },
      ],
    },
    {
      titre: t.legal.footerLegal,
      liens: [
        { href: '/mentions-legales', label: t.legal.mentions },
        { href: '/conditions', label: t.legal.terms },
        { href: '/confidentialite', label: t.legal.privacy },
        { href: '/cookies', label: t.legal.cookies },
      ],
    },
  ];

  return (
    // `@container` : les colonnes suivent la largeur du pied de page, pas
    // celle de la fenetre. Sur la connexion ou une page d'erreur, il vit
    // dans une colonne etroite ou quatre colonnes n'avaient pas la place.
    <footer className="@container w-full pb-8 pt-8">
      <div className="rounded-card border border-border/60 bg-surface/40 px-5 py-8 backdrop-blur-sm @sm:px-8 @sm:py-10">
        <div className="grid gap-10 @sm:grid-cols-2 @3xl:grid-cols-[1.5fr_repeat(3,1fr)]">
          {/* La marque, sa promesse, ses reseaux. */}
          <div className="space-y-5 @sm:col-span-2 @3xl:col-span-1">
            <Link href="/" className="signage site-logo inline-block rounded-sm text-3xl">
              {APP_NAME}
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">{t.legal.footerTagline}</p>
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
                {t.legal.footerFollow}
              </p>
              <ul className="flex items-center gap-2">
                {RESEAUX.map(({ nom, label }) => {
                  const href = SOCIAL_LINKS[nom];
                  const classe =
                    'flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-text-muted transition-colors';
                  return (
                    <li key={nom}>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          title={label}
                          className={`${classe} hover:border-accent hover:text-accent`}
                        >
                          <IconeReseau nom={nom} />
                        </a>
                      ) : (
                        <span
                          role="img"
                          aria-label={`${label} · ${t.legal.socialSoon}`}
                          title={`${label} · ${t.legal.socialSoon}`}
                          className={`${classe} cursor-default opacity-60`}
                        >
                          <IconeReseau nom={nom} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {colonnes.map((colonne) => (
            <nav key={colonne.titre} aria-label={colonne.titre} className="space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-faint">
                {colonne.titre}
              </h2>
              <ul className="space-y-2.5">
                {colonne.liens.map((lien) => (
                  <li key={lien.href}>
                    {lien.href.startsWith('mailto:') ? (
                      <a href={lien.href} className={LIEN}>
                        {lien.label}
                      </a>
                    ) : (
                      <Link href={lien.href} className={LIEN}>
                        {lien.label}
                      </Link>
                    )}
                  </li>
                ))}
                {colonne.titre === t.legal.footerLegal ? (
                  <li>
                    <CookieSettingsButton className={LIEN} />
                  </li>
                ) : null}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/60 pt-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <p className="max-w-2xl text-xs leading-relaxed text-text-faint">{t.legal.usageNotice}</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-text-faint">
              © {year} {APP_NAME}
            </span>
            <LocalePicker />
          </div>
        </div>
      </div>
    </footer>
  );
}
