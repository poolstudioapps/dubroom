'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { t } from '@/config/strings';

/**
 * Apercu d'une scene conservee sous forme de recette.
 *
 * Rien n'est heberge : on affiche le lecteur du service d'origine, sur
 * son domaine. C'est tout l'interet de ne garder que le lien — la scene
 * reste visible sans qu'on en detienne une copie.
 *
 * Le lecteur n'est monte qu'au clic. Une grille de dix scenes chargerait
 * sinon dix lecteurs tiers au premier affichage, avec ce que cela
 * suppose de requetes et de traceurs.
 */
export function UrlPreview({
  url,
  title,
  flush,
}: {
  url: string;
  title: string;
  /** A fleur du conteneur : pas de cadre propre, pas de coins arrondis. */
  flush?: boolean;
}) {
  const frame = flush
    ? 'border-b border-border'
    : 'rounded-md border-2 border-bezel-dark';

  const [open, setOpen] = useState(false);
  const embed = toEmbedUrl(url);

  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={`flex aspect-video items-center justify-center bg-stage text-xs font-bold text-stage-faint hover:text-stage-text ${frame}`}
      >
        {t.community.openSource}
      </a>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t.community.preview} : ${title}`}
        className={`group flex aspect-video w-full items-center justify-center bg-stage ${frame}`}
      >
        <span className="flex flex-col items-center gap-2 text-stage-faint group-hover:text-stage-text">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink">
            <Play className="h-5 w-5 fill-current" aria-hidden />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide">
            {t.community.preview}
          </span>
        </span>
      </button>
    );
  }

  return (
    <iframe
      src={embed}
      title={title}
      allow="accelerometer; encrypted-media; picture-in-picture"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={`aspect-video w-full bg-stage ${frame}`}
    />
  );
}

/**
 * Convertit un lien en URL de lecteur integrable.
 *
 * Volontairement limite a YouTube, seul service que le worker sait
 * telecharger. Un lien qu'on ne reconnait pas n'est pas devine : il est
 * affiche tel quel, en lien sortant.
 */
function toEmbedUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');
  let id: string | null = null;

  if (host === 'youtu.be') id = parsed.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
    else if (parsed.pathname.startsWith('/embed/')) id = parsed.pathname.slice(7);
    else if (parsed.pathname.startsWith('/shorts/')) id = parsed.pathname.slice(8);
  }

  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;

  // Domaine sans cookies : l'apercu ne depose pas de traceur publicitaire.
  const start = parsed.searchParams.get('t')?.replace(/[^0-9]/g, '');
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (start) params.set('start', start);

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
