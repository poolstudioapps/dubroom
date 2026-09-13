'use client';

import { BadgeCheck } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Le signe d'un createur certifie.
 *
 * Une pastille doree, et le mot en toutes lettres quand il y a la place :
 * une icone seule se lit comme une decoration.
 */
export function CertifiedBadge({
  withLabel = false,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  const t = useT();
  return (
    <span
      title={t.creators.certified}
      aria-label={withLabel ? undefined : t.creators.certified}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-accent',
        withLabel &&
          'rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-bold',
        className,
      )}
    >
      <BadgeCheck className={withLabel ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5'} aria-hidden />
      {withLabel ? t.creators.certified : null}
    </span>
  );
}
