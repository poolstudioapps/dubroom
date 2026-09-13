'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Clapperboard, Pencil, ThumbsDown, ThumbsUp } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { Avatar } from '@/components/avatar';
import { CertificationCard } from '@/components/certification-card';
import { CertifiedBadge } from '@/components/certified-badge';
import { CommentThread } from '@/components/comment-thread';
import { LinkButton } from '@/components/link-button';
import { PackCard, packGridClass } from '@/components/pack-card';
import { PackStartDialog } from '@/components/pack-start-dialog';
import { Card, Spinner } from '@/components/ui';
import { useCreatorProfile } from '@/lib/creators';
import { useLocale, useT } from '@/lib/i18n';
import { PACKS_QUERY, type Pack } from '@/lib/packs';
import { cn } from '@/lib/utils';

/**
 * Le profil public d'un createur.
 *
 * Ce qu'on vient y chercher en arrivant depuis une scene : qui l'a faite,
 * ce qu'il a fait d'autre, ce que la communaute en pense, et un endroit
 * pour lui ecrire. La personne elle-meme voit la meme page — c'est la
 * qu'elle repond, vote et fait le menage dans son fil — plus sa
 * progression vers la certification.
 */
export function CreatorProfileClient({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const t = useT();
  const locale = useLocale();
  const profil = useCreatorProfile(userId);
  const packs = useQuery(PACKS_QUERY);
  const [doubler, setDoubler] = useState<Pack | null>(null);

  const sesPacks = useMemo(
    () =>
      (packs.data ?? [])
        .filter((p) => p.author_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [packs.data, userId],
  );

  const retour = (
    <Link
      href="/communaute"
      className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted hover:text-text"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t.creators.back}
    </Link>
  );

  if (profil.isLoading) {
    return (
      <AppShell>
        <p className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </p>
      </AppShell>
    );
  }

  const p = profil.data;
  if (!p) {
    return (
      <AppShell className="space-y-4">
        {retour}
        <Card className="space-y-2 py-10 text-center">
          <h1 className="text-lg font-bold">{t.creators.notFound}</h1>
          <p className="text-sm text-text-muted">{t.creators.notFoundBody}</p>
        </Card>
      </AppShell>
    );
  }

  const depuis = new Date(p.member_since).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  const nombre = (n: number) => n.toLocaleString(locale);

  const tuiles = [
    { label: t.creators.statPacks, valeur: p.pack_count, icone: Clapperboard, ton: 'text-accent' },
    { label: t.creators.statUp, valeur: p.up_total, icone: ThumbsUp, ton: 'text-ok-ink' },
    { label: t.creators.statDown, valeur: p.down_total, icone: ThumbsDown, ton: 'text-danger-ink' },
  ];

  return (
    <AppShell className="space-y-8">
      {retour}

      {/* ── Qui ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center gap-5">
        <Avatar name={p.display_name} path={p.avatar_path} size="lg" />
        {/* `min-w-48` : sur telephone, le bouton passe dessous au lieu
            d'ecraser le nom lettre par lettre. */}
        <div className="min-w-48 flex-1 space-y-1.5">
          <h1 className="titre flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl sm:text-4xl">
            <span className="min-w-0 break-words">{p.display_name}</span>
            {p.certified ? <CertifiedBadge withLabel className="text-sm" /> : null}
          </h1>
          <p className="text-sm text-text-faint">{t.creators.memberSince(depuis)}</p>
          {p.certified && !p.is_me ? (
            <p className="text-sm text-text-muted">{t.creators.certifiedPublic}</p>
          ) : null}
        </div>
        {p.is_me ? (
          <LinkButton href="/compte" variant="secondary">
            <Pencil className="h-4 w-4" aria-hidden />
            {t.creators.editProfile}
          </LinkButton>
        ) : null}
      </header>

      {/* ── Ce que la communaute en pense ──────────────────────────── */}
      <dl className="grid grid-cols-3 gap-3">
        {tuiles.map((tuile) => {
          const Icone = tuile.icone;
          return (
            <div key={tuile.label} className="panel flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
              <Icone className={cn('h-5 w-5 shrink-0 sm:h-7 sm:w-7', tuile.ton)} aria-hidden />
              <div className="min-w-0">
                <dd className="text-2xl font-bold tabular-nums sm:text-3xl">{nombre(tuile.valeur)}</dd>
                <dt className="text-xs font-bold uppercase tracking-wide text-text-faint">{tuile.label}</dt>
              </div>
            </div>
          );
        })}
      </dl>

      {/* La progression ne regarde que l'interesse. */}
      {p.is_me ? <CertificationCard profile={p} /> : null}

      {/* ── Ses scenes ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="titre titre-section flex items-baseline gap-2 text-xl">
          {p.is_me ? t.creators.packsTitleMine : t.creators.packsTitle(p.display_name)}
          {sesPacks.length > 0 ? (
            <span className="text-sm font-semibold text-text-faint">{sesPacks.length}</span>
          ) : null}
        </h2>

        {packs.isLoading ? <Spinner /> : null}

        {packs.isSuccess && sesPacks.length === 0 ? (
          <Card className="space-y-3 py-8 text-center">
            <p className="text-sm text-text-muted">
              {p.is_me ? t.creators.packsEmptyMine : t.creators.packsEmpty}
            </p>
            {p.is_me ? (
              <LinkButton href="/sessions/new?pour=communaute">{t.community.createPack}</LinkButton>
            ) : null}
          </Card>
        ) : null}

        {sesPacks.length > 0 ? (
          <ul className={cn('grid gap-4', packGridClass(sesPacks.length))}>
            {sesPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                showAuthor={false}
                onPlay={() => setDoubler(pack)}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {/* ── Son fil ────────────────────────────────────────────────── */}
      <CommentThread
        target={{ kind: 'profile', id: p.user_id }}
        intro={p.is_me ? t.creators.commentsIntroMine : t.creators.commentsIntro(p.display_name)}
      />

      <PackStartDialog pack={doubler} displayName={displayName} onClose={() => setDoubler(null)} />
    </AppShell>
  );
}
