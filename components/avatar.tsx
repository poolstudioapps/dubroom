'use client';

import { useAvatarUrl } from '@/lib/profile';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-7 w-7 text-[0.65rem]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const;

/**
 * La pastille d'un joueur.
 *
 * Sans photo, on affiche ses initiales sur un fond tire de son nom : deux
 * personnes sans photo restent distinguables, ce qu'une silhouette grise
 * generique ne permet pas.
 *
 * L'image n'est jamais passee par l'optimiseur de Next : le bucket est
 * prive, l'URL est signee et change toutes les heures.
 */
export function Avatar({
  name,
  path,
  size = 'md',
  className,
}: {
  name: string;
  path?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const url = useAvatarUrl(path);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-bezel-dark font-bold uppercase',
        SIZES[size],
        className,
      )}
      style={
        url.data ? undefined : { backgroundColor: tintFor(name), color: '#10121a' }
      }
      aria-hidden
    >
      {url.data ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url.data} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).slice(0, 2);
}

/** Une teinte stable, tiree du nom : la meme personne garde la sienne. */
function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return `oklch(0.82 0.14 ${hash})`;
}
