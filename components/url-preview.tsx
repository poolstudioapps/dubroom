'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import { useT } from '@/lib/i18n';

/**
 * Apercu d'une scene conservee sous forme de recette.
 *
 * Rien n'est heberge : on affiche le lecteur du service d'origine, sur
 * son domaine. C'est tout l'interet de ne garder que le lien — la scene
 * reste visible sans qu'on en detienne une copie.
 *
 * Deux niveaux, et la distinction fait tout :
 *
 *  - la VIGNETTE se charge d'emblee. C'est une image fixe, sans script
 *    ni cookie, et c'est elle qui transforme une liste de titres en
 *    catalogue ou l'on reconnait une scene d'un coup d'oeil ;
 *  - le LECTEUR, lui, n'est monte qu'au clic. Une grille de dix scenes
 *    chargerait sinon dix lecteurs tiers au premier affichage, avec ce
 *    que cela suppose de requetes et de traceurs.
 */
export function UrlPreview({
  url,
  title,
  flush,
  overlay,
}: {
  url: string;
  title: string;
  /** A fleur du conteneur : pas de cadre propre, pas de coins arrondis. */
  flush?: boolean;
  /** Ce qui se lit sur la vignette (duree, proprietaire), jamais sur le lecteur. */
  overlay?: React.ReactNode;
}) {
  const t = useT();

  const frame = flush
    ? 'border-b border-border'
    : 'rounded-2xl border border-border';

  const [open, setOpen] = useState(false);
  const [vignetteKo, setVignetteKo] = useState(false);
  const id = videoId(url);
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
        className={`group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-stage ${frame}`}
      >
        {id && !vignetteKo ? (
          // Une image, rien d'autre : pas de script, pas de cookie. Le
          // format 4/3 de la vignette est recadre sur le 16/9 de la
          // carte, sans quoi elle arriverait avec ses bandes noires.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setVignetteKo(true)}
            className="absolute inset-0 h-full w-full scale-[1.35] object-cover transition-transform duration-300 group-hover:scale-[1.42]"
          />
        ) : null}

        {/* Le mot « Aperçu » recouvrait les visages sur chaque carte. Il
            n'apparait plus qu'au survol, la ou le survol existe ; sur
            telephone, le bouton de lecture seul suffit. */}
        <span className="relative flex flex-col items-center gap-2 text-white drop-shadow-[0_2px_6px_rgb(0_0_0/0.8)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current" aria-hidden />
          </span>
          <span className="text-xs font-bold uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            {t.community.preview}
          </span>
        </span>
        {overlay}
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
 * L'identifiant de la video derriere un lien.
 *
 * Volontairement limite a YouTube, seul service que le worker sait
 * telecharger. Un lien qu'on ne reconnait pas n'est pas devine : il est
 * affiche tel quel, en lien sortant.
 */
export function videoId(raw: string): string | null {
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

  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

/** Convertit un lien en URL de lecteur integrable. */
function toEmbedUrl(raw: string): string | null {
  const id = videoId(raw);
  if (!id) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  // Domaine sans cookies : l'apercu ne depose pas de traceur publicitaire.
  const start = parsed.searchParams.get('t')?.replace(/[^0-9]/g, '');
  const params = new URLSearchParams({ rel: '0', modestbranding: '1', autoplay: '1' });
  if (start) params.set('start', start);

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
