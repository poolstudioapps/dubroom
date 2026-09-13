'use client';

import { Clapperboard, Trash2 } from 'lucide-react';

import { PackVote } from '@/components/pack-vote';
import { UrlPreview } from '@/components/url-preview';
import { Button } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatBytes, formatDuration } from '@/config/strings';
import { useT } from '@/lib/i18n';
import type { Pack } from '@/lib/packs';

/** Au-dela, les personnages se resument en « +3 ». */
const PASTILLES_MAX = 4;

/**
 * Combien de colonnes pour ce nombre de scenes.
 *
 * A un element, quatre colonnes laissent trois quarts de vide ; a douze,
 * une seule oblige a faire defiler pour comparer. La carte, elle, reste
 * la meme partout.
 */
export function packGridClass(count: number): string {
  if (count <= 1) return 'max-w-sm';
  if (count === 2) return 'sm:grid-cols-2 lg:max-w-4xl';
  return 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';
}

/**
 * Une scene du catalogue.
 *
 * La meme carte sert le catalogue et l'ecran de creation : deux dessins
 * separes avaient deja diverge, l'un en grille d'affiches, l'autre en
 * liste serree ou le bouton changeait de place d'une ligne a l'autre.
 *
 * Tout ce qui se lit d'un coup d'oeil est sur l'image — la duree, et si
 * la scene est la sienne — comme sur n'importe quel catalogue de videos.
 * Le corps ne garde que le titre, une ligne de details et la
 * distribution. Les etiquettes qui disaient la meme chose sur chaque
 * carte (« Recette », « Autre ») ont disparu : elles ne distinguaient
 * rien.
 */
export function PackCard({
  pack,
  starting,
  locked,
  onPlay,
  onDelete,
  showMine = true,
  showVote = true,
}: {
  pack: Pack;
  /** Cette scene est en train de demarrer. */
  starting: boolean;
  /** Une autre scene demarre : on ne lance pas deux parties a la fois. */
  locked: boolean;
  onPlay: () => void;
  onDelete?: () => void;
  showMine?: boolean;
  showVote?: boolean;
}) {
  const t = useT();

  const details = [
    t.community.lineCount(pack.line_count),
    pack.genre !== 'autre' ? t.community.genreNames[pack.genre] : null,
    pack.source_lang ? (t.community.langNames[pack.source_lang] ?? pack.source_lang) : null,
    pack.kind === 'media' ? formatBytes(pack.size_bytes) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const surImage = (
    <>
      {showMine && pack.is_mine ? (
        <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink shadow">
          {t.community.mine}
        </span>
      ) : null}
      <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white tabular-nums">
        {formatDuration(pack.duration_ms)}
      </span>
    </>
  );

  const visibles = pack.characters.slice(0, PASTILLES_MAX);
  const reste = pack.characters.length - visibles.length;

  return (
    <li className="panel carte-pack flex flex-col overflow-hidden">
      {pack.kind === 'url' && pack.source_url ? (
        <UrlPreview url={pack.source_url} title={pack.title} flush overlay={surImage} />
      ) : (
        // Une scene sans lien n'a pas de vignette : un aplat de la meme
        // taille garde la grille alignee.
        <div className="relative flex aspect-video items-center justify-center border-b border-border bg-stage text-stage-faint">
          <Clapperboard className="h-8 w-8" aria-hidden />
          {surImage}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-bold leading-snug" title={pack.title}>
              {pack.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-faint">{details}</p>
          </div>
          {showVote ? <PackVote pack={pack} compact /> : null}
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label={t.community.characterCount(pack.character_count)}>
          {visibles.map((character) => (
            <li
              key={character.name}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: characterColorVar(character.color) }}
                aria-hidden
              />
              <span className="truncate">{character.name}</span>
            </li>
          ))}
          {reste > 0 ? (
            <li className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-text-faint">
              +{reste}
            </li>
          ) : null}
        </ul>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            className="flex-1"
            loading={starting}
            disabled={locked}
            onClick={onPlay}
          >
            {starting ? null : <Clapperboard className="h-4 w-4" aria-hidden />}
            {t.community.play}
          </Button>
          {onDelete ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`${t.community.remove} : ${pack.title}`}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
