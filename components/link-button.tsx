import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Un lien habille en bouton, pour les appels a l'action des pages.
 *
 * Ce sont les memes classes que les boutons de l'accueil : recopiees a
 * la main dans chaque page, elles avaient deja commence a diverger d'une
 * hauteur et d'une marge a l'autre.
 */
const STYLES = {
  primary:
    'btn-3d btn-primary bg-accent text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover',
  secondary:
    'btn-3d btn-secondary btn-bascule bg-surface-raised text-text [--btn-lip:var(--color-border-strong)]',
} as const;

const TAILLES = {
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-7 text-base',
} as const;

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof STYLES;
  size?: keyof typeof TAILLES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wide',
        STYLES[variant],
        TAILLES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
