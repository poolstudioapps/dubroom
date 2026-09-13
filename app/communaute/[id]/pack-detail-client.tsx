'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  ExternalLink,
  FileVideo,
  Pencil,
  PencilLine,
} from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { Avatar } from '@/components/avatar';
import { CertifiedBadge } from '@/components/certified-badge';
import { CommentThread } from '@/components/comment-thread';
import { PackFacetsDialog } from '@/components/pack-facets-dialog';
import { PackStartDialog } from '@/components/pack-start-dialog';
import { PackVote } from '@/components/pack-vote';
import { UrlPreview } from '@/components/url-preview';
import { Button, Card, Spinner } from '@/components/ui';
import { GUIDE_VIDEO_HREF, characterColorVar } from '@/config/constants';
import { formatDuration } from '@/config/strings';
import { profileHref } from '@/lib/creators';
import { useLocale, useT } from '@/lib/i18n';
import { PACKS_QUERY, fusionnerVoix, listPackLines } from '@/lib/packs';

/** Les premieres repliques montrees ; le reste se decouvre en jouant. */
const EXTRAIT = 6;

/**
 * Le detail d'une scene du catalogue.
 *
 * Tout ce qu'on veut savoir avant de reunir trois amis : de quoi il
 * s'agit, combien de temps ca dure, qui parle et combien, dans quelle
 * langue, et ce que les autres en ont pense. Puis le bouton pour la
 * doubler, et — toujours — le rappel qu'il faudra apporter la video,
 * avec le guide pour la recuperer.
 *
 * La scene vient du catalogue deja charge : voter ici ou sur la carte,
 * c'est le meme cache, et les deux restent d'accord.
 */
export function PackDetailClient({
  packId,
  displayName,
}: {
  packId: string;
  displayName: string;
}) {
  const t = useT();
  const locale = useLocale();
  const packs = useQuery(PACKS_QUERY);
  const pack = packs.data?.find((p) => p.id === packId) ?? null;

  const lignes = useQuery({
    queryKey: ['pack-lines', packId],
    queryFn: () => listPackLines(packId),
    enabled: !!pack,
    staleTime: 300_000,
  });

  const [doubler, setDoubler] = useState(false);
  const [retouche, setRetouche] = useState(false);

  // Qui parle, et combien : le premier critere pour distribuer les roles.
  const distribution = useMemo(() => {
    const parNom = new Map<string, { lignes: number; ms: number }>();
    for (const ligne of lignes.data ?? []) {
      const stat = parNom.get(ligne.characterName) ?? { lignes: 0, ms: 0 };
      stat.lignes += 1;
      stat.ms += Math.max(0, ligne.end_ms - ligne.start_ms);
      parNom.set(ligne.characterName, stat);
    }
    return parNom;
  }, [lignes.data]);

  const retour = (
    <Link
      href="/communaute"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted hover:text-text"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t.community.detailBack}
    </Link>
  );

  if (packs.isLoading) {
    return (
      <AppShell>
        <p className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </p>
      </AppShell>
    );
  }

  if (!pack) {
    return (
      <AppShell className="space-y-4">
        {retour}
        <Card className="space-y-2 py-10 text-center">
          <h1 className="text-lg font-bold">{t.community.detailNotFound}</h1>
          <p className="text-sm text-text-muted">{t.community.detailNotFoundBody}</p>
        </Card>
      </AppShell>
    );
  }

  const date = new Date(pack.created_at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const faits = [
    { label: t.community.detailDuration, valeur: formatDuration(pack.duration_ms) },
    { label: t.community.detailLines, valeur: String(pack.line_count) },
    { label: t.community.detailCharacters, valeur: String(pack.character_count) },
    {
      label: t.community.filterLang,
      valeur: pack.source_lang
        ? (t.community.langNames[pack.source_lang] ?? pack.source_lang)
        : t.community.langUnknown,
    },
    { label: t.community.filterGenre, valeur: t.community.genreNames[pack.genre] ?? pack.genre },
  ];
  // Une replique a plusieurs voix se lit une fois, avec tous ses noms.
  const repliques = fusionnerVoix(lignes.data ?? []);
  const extrait = repliques.slice(0, EXTRAIT);
  const resteLignes = repliques.length - extrait.length;

  return (
    <AppShell className="space-y-6">
      {retour}

      {/*
        Trois blocs, deux ordres. Sur telephone : l'entete, puis ce qu'on
        vient chercher pour decider (les chiffres et le bouton), puis le
        reste. Sur ordinateur, les chiffres et le bouton restent a droite
        pendant qu'on lit le texte et les commentaires.
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:items-start">
        {/* ── L'entete ──────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <div className="overflow-hidden rounded-card">
            {pack.kind === 'url' && pack.source_url ? (
              <UrlPreview url={pack.source_url} title={pack.title} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-card border border-border bg-stage text-stage-faint">
                <Clapperboard className="h-10 w-10" aria-hidden />
              </div>
            )}
          </div>

          <header className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="titre min-w-0 text-balance text-3xl sm:text-4xl">{pack.title}</h1>
              <div className="flex items-center gap-2">
                <PackVote key={`${pack.id}:${pack.my_vote}:${pack.score}`} pack={pack} />
                {pack.can_edit ? (
                  <Button size="sm" variant="ghost" onClick={() => setRetouche(true)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {t.community.detailEdit}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Le createur mene a son profil : ses autres scenes, ses votes,
                et un endroit pour lui ecrire. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Link
                href={profileHref(pack.author_id)}
                className="group inline-flex flex-wrap items-center gap-2 text-sm text-text-muted hover:text-text"
              >
                <Avatar name={pack.author_name} path={pack.author_avatar} size="sm" />
                <span className="group-hover:underline group-hover:underline-offset-4">
                  {t.community.detailPublishedBy(pack.author_name, date)}
                </span>
                {pack.author_certified ? <CertifiedBadge withLabel /> : null}
              </Link>
              {/* La fiche a bouge depuis sa publication : son createur l'a
                  retouchee. On le dit, date comprise. */}
              {pack.edited_at ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-text"
                  title={new Date(pack.edited_at).toLocaleString(locale)}
                >
                  <PencilLine className="h-3 w-3 text-accent" aria-hidden />
                  {t.community.editedByCreator(
                    new Date(pack.edited_at).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  )}
                </span>
              ) : null}
            </div>

            {pack.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label={t.community.tagsLabel}>
                {pack.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/communaute?q=${encodeURIComponent(`#${tag}`)}`}
                      aria-label={t.community.tagSearch(tag)}
                      className="inline-flex rounded-full bg-select/15 px-3 py-1 text-xs font-bold text-select transition-colors hover:bg-select/25"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {pack.description ? (
              <p className="max-w-prose text-sm leading-relaxed text-text-muted">
                {pack.description}
              </p>
            ) : null}
          </header>
        </div>

        {/* ── Les chiffres, le bouton, le guide ─────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Card className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {faits.map((fait) => (
                <div key={fait.label} className="min-w-0">
                  <dt className="text-xs font-bold uppercase tracking-wide text-text-faint">
                    {fait.label}
                  </dt>
                  <dd className="truncate text-sm font-bold">{fait.valeur}</dd>
                </div>
              ))}
            </dl>
            <Button variant="primary" size="lg" className="w-full" onClick={() => setDoubler(true)}>
              <Clapperboard className="h-4 w-4" aria-hidden />
              {t.community.play}
            </Button>
          </Card>

          {/* Le guide, systematiquement : une scene du catalogue ne vient
              jamais avec sa video. */}
          <Card className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <FileVideo className="h-4 w-4 text-link" aria-hidden />
              {t.community.detailVideoTitle}
            </h2>
            <p className="text-xs leading-relaxed text-text-muted">
              {pack.source_url ? t.community.detailVideoBody : t.community.detailNoSource}
            </p>
            {pack.source_url ? (
              <a
                href={pack.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-sunken px-3 text-sm font-bold text-text transition-colors hover:border-accent/50"
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 truncate">{t.community.openSource}</span>
              </a>
            ) : null}
            <Link
              href={GUIDE_VIDEO_HREF}
              className="lien-surligne inline-flex items-center gap-1 pt-1 text-sm font-bold text-text"
            >
              {t.community.detailVideoAction}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Card>
        </aside>

        {/* ── Distribution, texte, commentaires ─────────────────────── */}
        <div className="space-y-10 lg:col-start-1 lg:row-start-2">
          <section className="space-y-3">
            <h2 className="titre titre-section text-xl">{t.community.detailCast}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {pack.characters.map((personnage) => {
                const stat = distribution.get(personnage.name);
                return (
                  <li
                    key={personnage.name}
                    className="panel flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: characterColorVar(personnage.color) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-bold">{personnage.name}</span>
                    {stat ? (
                      <span className="shrink-0 text-xs text-text-faint">
                        {t.community.lineCount(stat.lignes)} · {formatDuration(stat.ms)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          {extrait.length > 0 ? (
            <section className="space-y-3">
              <h2 className="titre titre-section text-xl">{t.community.detailScript}</h2>
              <ol className="panel divide-y divide-border overflow-hidden">
                {extrait.map((ligne) => (
                  <li key={`${ligne.start_ms}-${ligne.characterName}`} className="flex gap-3 px-4 py-3">
                    <span className="w-12 shrink-0 pt-0.5 font-mono text-xs text-text-faint tabular-nums">
                      {formatDuration(ligne.start_ms)}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex items-center gap-1.5 text-xs font-bold">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: characterColorVar(ligne.characterColor) }}
                          aria-hidden
                        />
                        {ligne.characterName}
                      </p>
                      <p className="text-sm leading-relaxed text-text-muted">{ligne.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {resteLignes > 0 ? (
                <p className="text-xs text-text-faint">{t.community.detailScriptMore(resteLignes)}</p>
              ) : null}
            </section>
          ) : null}

          <CommentThread target={{ kind: 'pack', id: pack.id }} />
        </div>
      </div>

      <PackStartDialog
        pack={doubler ? pack : null}
        displayName={displayName}
        onClose={() => setDoubler(false)}
      />
      <PackFacetsDialog pack={pack} open={retouche} onClose={() => setRetouche(false)} />
    </AppShell>
  );
}
