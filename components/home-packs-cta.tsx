'use client';

import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { Card } from '@/components/ui';

import { useMyPackCount } from '@/lib/profile';

/**
 * L'invitation a publier un pack, sur l'accueil.
 *
 * Elle prend le relais de l'onglet « Mes packs », qui n'apparait pas tant
 * qu'on n'a rien publie : un onglet vide ne donne envie de rien, alors
 * qu'une invitation placee la ou l'on regarde deja, si.
 *
 * Quand des packs existent, l'onglet est la et ce bloc s'efface : dire
 * deux fois la meme chose au meme endroit fatigue la page.
 */
export function HomePacksCta() {
  const t = useT();

  const packs = useMyPackCount();

  if (packs.isLoading || (packs.data ?? 0) > 0) return null;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Package className="h-4 w-4 text-link" aria-hidden />
          {t.home.packsCtaTitle}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-text-muted">
          {t.home.packsCtaBody}
        </p>
      </div>

      <Link
        href="/sessions/new"
        className="btn-3d btn-secondary inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-surface-raised px-5 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
      >
        {t.home.packsCtaAction}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </Card>
  );
}
