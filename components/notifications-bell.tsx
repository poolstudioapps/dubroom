'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CircleCheck,
  Clapperboard,
  Heart,
  MessageSquare,
  Timer,
  Trash2,
} from 'lucide-react';

import { profileHref } from '@/lib/creators';
import { useLocale, useT } from '@/lib/i18n';
import {
  invalidateNotifications,
  markNotificationsRead,
  useNotifications,
  type NotificationItem,
} from '@/lib/notifications';
import { packHref } from '@/lib/packs';
import { cn } from '@/lib/utils';

const ICONES = {
  render_started: Clapperboard,
  render_done: CircleCheck,
  render_expiring: Timer,
  render_deleted: Trash2,
  pack_like: Heart,
  comment: MessageSquare,
} as const;

/** « il y a 3 min », dans la langue de la page. */
function depuis(date: string, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const secondes = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const paliers: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unite, taille] of paliers) {
    if (Math.abs(secondes) >= taille) return format.format(Math.round(secondes / taille), unite);
  }
  return format.format(0, 'minute');
}

/**
 * La cloche, a droite du compte.
 *
 * Une pastille compte ce qui n'a pas ete vu. Ouvrir la liste marque tout
 * comme lu, mais les nouvelles restent soulignees tant qu'elle est
 * ouverte : sinon on ne saurait plus lesquelles venaient d'arriver.
 */
export function NotificationsBell({ userId }: { userId: string | null }) {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();
  const liste = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const [fraiches, setFraiches] = useState<Set<string>>(new Set());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /*
   * Un son quand une notification arrive.
   *
   * On compare aux non lues deja connues, compte compris : un like de
   * plus sur une ligne regroupee sonne aussi. Rien au premier chargement —
   * ouvrir une page ne doit pas tinter pour des nouvelles d'hier — ni quand
   * elles passent a « lues ». Un navigateur qui refuse la lecture avant
   * tout geste sur la page reste muet, sans erreur.
   */
  const connues = useRef<Set<string> | null>(null);
  const son = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!liste.data) return;
    const cles = new Set(liste.data.filter((n) => !n.read_at).map((n) => `${n.id}:${n.count}`));
    const avant = connues.current;
    connues.current = cles;
    if (!avant || ![...cles].some((cle) => !avant.has(cle))) return;
    son.current ??= new Audio('/sons/notification.mp3');
    son.current.volume = 0.7;
    son.current.currentTime = 0;
    void son.current.play().catch(() => undefined);
  }, [liste.data]);

  if (!userId) return null;

  const items = liste.data ?? [];
  const nonLues = items.filter((n) => !n.read_at);

  function basculer() {
    const suivant = !open;
    setOpen(suivant);
    if (suivant && nonLues.length > 0) {
      setFraiches(new Set(nonLues.map((n) => n.id)));
      void markNotificationsRead()
        .then(() => invalidateNotifications(qc, userId))
        .catch(() => undefined);
    }
  }

  function texte(n: NotificationItem): string {
    const titre = n.data.title?.trim() || t.common.untitled;
    const qui = n.actors[0] ?? '?';
    const autres = Math.max(0, n.count - 1);
    switch (n.kind) {
      case 'render_started':
        return t.notifications.renderStarted(titre);
      case 'render_done':
        return t.notifications.renderDone(titre);
      case 'render_expiring':
        return t.notifications.renderExpiring(titre, n.data.minutes ?? 1);
      case 'render_deleted':
        return t.notifications.renderDeleted(titre);
      case 'pack_like':
        return t.notifications.packLike(qui, autres, titre);
      case 'comment':
        if (n.data.reply) return t.notifications.reply(qui, autres);
        return n.pack_id
          ? t.notifications.packComment(qui, autres, titre)
          : t.notifications.profileComment(qui, autres);
    }
  }

  function lien(n: NotificationItem): string {
    if (n.session_code) return `/s/${n.session_code}`;
    if (n.pack_id) return packHref(n.pack_id);
    if (n.profile_id) return profileHref(n.profile_id);
    return '/';
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.notifications.label(nonLues.length)}
        onClick={basculer}
        className="btn-3d btn-secondary flex h-11 w-11 items-center justify-center"
      >
        <Bell className="h-5 w-5" aria-hidden />
      </button>
      {/*
        La pastille est posee a cote du bouton, pas dedans : les boutons
        rognent ce qui depasse de leur arrondi, et elle etait coupee sous
        le bord. Ici elle passe par-dessus le coin.
      */}
      {nonLues.length > 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold tabular-nums text-accent-ink shadow-[0_2px_6px_rgb(0_0_0/0.6)] ring-2 ring-black/70"
        >
          {nonLues.length > 9 ? '9+' : nonLues.length}
        </span>
      ) : null}

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]"
        >
          <p className="border-b-2 border-border px-4 py-2.5 text-sm font-bold">
            {t.notifications.title}
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-text-faint">
              {liste.isLoading ? t.common.loading : t.notifications.empty}
            </p>
          ) : (
            <ul className="max-h-[min(28rem,70vh)] overflow-y-auto">
              {items.map((n) => {
                const Icone = ICONES[n.kind];
                const neuve = fraiches.has(n.id) || !n.read_at;
                return (
                  <li key={n.id}>
                    <Link
                      href={lien(n)}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-surface',
                        neuve && 'bg-accent/10',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          n.kind === 'render_expiring' || n.kind === 'render_deleted'
                            ? 'bg-warn/15 text-warn-ink'
                            : 'bg-accent/15 text-accent',
                        )}
                      >
                        <Icone className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className={cn('block leading-snug', neuve ? 'font-bold' : 'text-text-muted')}>
                          {texte(n)}
                        </span>
                        <span className="block text-xs text-text-faint">{depuis(n.created_at, locale)}</span>
                      </span>
                      {neuve ? (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
