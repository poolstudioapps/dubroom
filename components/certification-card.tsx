'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Progress } from '@/components/ui';
import { CERTIFICATION_GUIDE_HREF } from '@/config/guides';
import type { CreatorProfile } from '@/lib/creators';
import { useLocale, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Ou en est un createur de sa certification.
 *
 * Deux chemins, un seul suffit : beaucoup de scenes appreciees, ou
 * beaucoup d'avis en tout. On montre les deux jauges cote a cote pour
 * que chacun voie lequel est le plus proche, et une fois certifie, la
 * carte devient le sceau.
 */
export function CertificationCard({
  profile,
  className,
}: {
  profile: CreatorProfile;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const nombre = (n: number) => n.toLocaleString(locale);

  if (profile.certified) {
    return (
      <div
        className={cn(
          'panel flex items-center gap-4 border-accent/50 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklch,var(--color-accent)_16%,transparent),transparent_60%)] p-5',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icones/cinema-certifie.png" alt="" width={64} height={64} className="h-16 w-16 shrink-0" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-accent">{t.creators.certDoneTitle}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{t.creators.certDoneBody}</p>
        </div>
      </div>
    );
  }

  const chemins = [
    {
      label: t.creators.certPathPacks(profile.cert_min_up, profile.cert_packs_goal),
      valeur: profile.packs_10up,
      but: profile.cert_packs_goal,
    },
    {
      label: t.creators.certPathVotes(profile.cert_votes_goal),
      valeur: profile.up_total,
      but: profile.cert_votes_goal,
    },
  ];

  return (
    <div className={cn('panel space-y-4 p-5', className)}>
      <div className="flex items-start gap-4">
        {/* Le sceau en attente : grise, il dit ce qu'on vise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icones/cinema-certifie.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 opacity-40 grayscale"
        />
        <div className="space-y-1">
          <h2 className="font-bold">{t.creators.certProgressTitle}</h2>
          <p className="text-sm text-text-muted">{t.creators.certProgressBody}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        {chemins.map((chemin, rang) => (
          <div key={chemin.label} className="contents">
            {rang === 1 ? (
              <span className="text-center text-xs font-bold uppercase tracking-widest text-text-faint">
                {t.creators.certOr}
              </span>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm leading-snug text-text-muted">{chemin.label}</p>
              <Progress value={(chemin.valeur / chemin.but) * 100} />
              <p className="text-xs font-bold tabular-nums">
                {nombre(Math.min(chemin.valeur, chemin.but))} / {nombre(chemin.but)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={CERTIFICATION_GUIDE_HREF}
        className="lien-surligne inline-flex items-center gap-1 text-sm font-bold text-text"
      >
        {t.creators.certGuide}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
