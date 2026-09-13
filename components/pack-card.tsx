'use client';

import Link from 'next/link';
import { Clapperboard, MessageSquare, Pencil, Trash2, Users } from 'lucide-react';

import { CertifiedBadge } from '@/components/certified-badge';
import { PackVote } from '@/components/pack-vote';
import { UrlPreview } from '@/components/url-preview';
import { Button } from '@/components/ui';
import { formatBytes, formatDuration } from '@/config/strings';
import { profileHref } from '@/lib/creators';
import { useT } from '@/lib/i18n';
import { packHref, type Pack } from '@/lib/packs';

/** Les etiquettes au-dela restent sur la page de la scene. */
const TAGS_MAX = 3;

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
 * La meme carte sert le catalogue, le profil et l'ecran de creation : deux
 * dessins separes avaient deja diverge.
 *
 * Tout ce qui se lit d'un coup d'oeil est sur l'image — la duree, et si
 * la scene est la sienne — comme sur n'importe quel catalogue de videos.
 * Le corps garde le titre, une ligne de details, et deux chiffres : les
 * roles a doubler et les commentaires. La liste des personnages, elle,
 * est sur la page de la scene : sur la carte elle poussait les boutons et
 * ne disait rien qu'un nombre ne dise mieux.
 *
 * Le bouton reste en retrait et ne prend la couleur d'action qu'au
 * survol : douze boutons pleins dans une grille criaient ensemble, et
 * plus aucun ne ressortait.
 */
export function PackCard({
  pack,
  onPlay,
  onDelete,
  onEdit,
  starting = false,
  locked = false,
  showMine = true,
  showVote = true,
  showAuthor = true,
}: {
  pack: Pack;
  onPlay: () => void;
  /** Absent : pas de corbeille. */
  onDelete?: () => void;
  /** Absent : pas de crayon. Le createur, sur son profil. */
  onEdit?: () => void;
  /** Cette scene est en train de demarrer. */
  starting?: boolean;
  /** Une autre scene demarre : on ne lance pas deux parties a la fois. */
  locked?: boolean;
  showMine?: boolean;
  showVote?: boolean;
  /** Inutile sur le profil du createur : toutes les cartes sont de lui. */
  showAuthor?: boolean;
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

      {/*
        Le corps entier mene a la page de la scene : le lien du titre
        s'etire sur toute la carte sous le texte. Ce qui s'actionne sur
        place — vote, etiquettes, boutons — passe au-dessus.
      */}
      <div className="relative flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-bold leading-snug" title={pack.title}>
              <Link
                href={packHref(pack.id)}
                className="after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:after:rounded-b-card focus-visible:after:ring-2 focus-visible:after:ring-select"
              >
                {pack.title}
              </Link>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-faint">{details}</p>
            {/* Le createur, au-dessus du lien de la carte : son nom mene a
                son profil, pas a la scene. */}
            {showAuthor ? (
              <Link
                href={profileHref(pack.author_id)}
                className="relative z-10 mt-1 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-text-muted hover:text-text hover:underline"
              >
                <span className="truncate">{t.community.byAuthor(pack.author_name)}</span>
                {pack.author_certified ? <CertifiedBadge /> : null}
              </Link>
            ) : null}
          </div>
          {showVote ? (
            <div className="relative z-10">
              <PackVote pack={pack} compact />
            </div>
          ) : null}
        </div>

        {pack.tags.length > 0 ? (
          <ul className="relative z-10 -mt-1 flex flex-wrap gap-x-2 gap-y-1">
            {pack.tags.slice(0, TAGS_MAX).map((tag) => (
              <li key={tag}>
                <Link
                  href={`/communaute?q=${encodeURIComponent(`#${tag}`)}`}
                  className="text-xs font-bold text-link hover:underline"
                  aria-label={t.community.tagSearch(tag)}
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-text-faint" aria-hidden />
            {t.community.charactersToDub(pack.character_count)}
          </span>
          <span
            className="inline-flex items-center gap-1.5"
            aria-label={t.community.commentsCount(pack.comment_count)}
            title={t.community.commentsCount(pack.comment_count)}
          >
            <MessageSquare className="h-3.5 w-3.5 text-text-faint" aria-hidden />
            {pack.comment_count}
          </span>
        </p>

        <div className="relative z-10 mt-auto flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            className="btn-bascule flex-1"
            loading={starting}
            disabled={locked}
            onClick={onPlay}
          >
            {starting ? null : <Clapperboard className="h-4 w-4" aria-hidden />}
            {t.community.play}
          </Button>
          {onEdit ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`${t.community.detailEdit} : ${pack.title}`}
              title={t.community.detailEdit}
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`${t.community.remove} : ${pack.title}`}
              title={t.community.remove}
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
