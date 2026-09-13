import type { ReactNode } from 'react';

import { GuideIcon, type GuideIconName } from '@/components/guide-icon';

const ICONES_ETAPES: GuideIconName[] = ['fiche', 'script', 'partage'];

/**
 * L'en-tete de la communaute, avec ou sans compte.
 *
 * La meme composition que l'accueil et les guides : un grand titre centre
 * sur telephone et cale a gauche au-dela, les actions en gros boutons, et
 * le panneau des etapes a cote. Connecte, la page reprenait un en-tete
 * serre d'ecran de travail et ne ressemblait plus au reste du site.
 */
export function CommunityHero({
  kicker,
  title,
  subtitle,
  actions,
  footnote,
  howTitle,
  howSteps,
}: {
  kicker: ReactNode;
  title: string;
  subtitle: string;
  actions: ReactNode;
  /** Une ligne sous les actions : les chiffres du catalogue. */
  footnote?: ReactNode;
  howTitle: string;
  howSteps: readonly { title: string; body: string }[];
}) {
  return (
    <section className="hero-accueil grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5 text-center lg:text-left">
        <p className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted">
          {kicker}
        </p>
        <h1 className="signage hero-titre text-balance text-4xl leading-[0.98] sm:text-6xl">{title}</h1>
        <p className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0">
          {subtitle}
        </p>
        <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
          {actions}
        </div>
        {footnote ? <p className="text-sm font-semibold text-text-faint">{footnote}</p> : null}
      </div>

      <aside className="panel space-y-5 p-6 sm:p-7">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">{howTitle}</h2>
        <ol className="relative space-y-6">
          <span
            className="absolute bottom-5 left-5 top-5 w-px -translate-x-1/2 bg-border-strong"
            aria-hidden
          />
          {howSteps.map((etape, rang) => (
            <li key={etape.title} className="relative flex gap-4">
              <span
                className={
                  rang === howSteps.length - 1
                    ? 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface-raised'
                    : 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface-raised'
                }
              >
                <GuideIcon nom={ICONES_ETAPES[rang] ?? 'partage'} className="h-7 w-7" />
              </span>
              <span className="min-w-0 space-y-0.5 pt-0.5">
                <span className="block text-sm font-bold text-text">{etape.title}</span>
                <span className="block text-xs leading-relaxed text-text-muted">{etape.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
