'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CircleCheck, Clapperboard, TriangleAlert } from 'lucide-react';

import { Badge, Spinner } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { SessionRow } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

const EN_COURS = ['render_queued', 'rendering'] as const;

/**
 * Les rendus qui tournent, pour chacun de ceux qui y ont joue.
 *
 * On peut quitter l'ecran de montage : la scene se retrouve ici. Tant
 * qu'un rendu tourne, la liste se rafraichit toute seule ; une fois pret,
 * il reste visible le temps que la video existe, puis laisse la place.
 */
export function PendingRenders({ className }: { className?: string }) {
  const t = useT();

  const rendus = useQuery({
    queryKey: ['pending-renders'],
    queryFn: async () => {
      const { data, error } = await supabaseBrowser()
        .from('sessions')
        .select('*')
        .or(
          `status.in.(render_queued,rendering,render_failed),and(status.eq.done,render_expires_at.gt.${new Date().toISOString()})`,
        )
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
    refetchInterval: (query) =>
      query.state.data?.some((s) => (EN_COURS as readonly string[]).includes(s.status)) ? 10_000 : false,
  });

  const liste = rendus.data ?? [];
  if (liste.length === 0) return null;

  return (
    <section className={cn('panel space-y-3 p-5', className)} aria-labelledby="rendus-en-cours">
      <div className="space-y-1">
        <h2 id="rendus-en-cours" className="flex items-center gap-2 font-bold">
          <Clapperboard className="h-4 w-4 text-accent" aria-hidden />
          {t.sessions.rendersTitle}
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">{t.sessions.rendersBody}</p>
      </div>

      <ul className="divide-y divide-border">
        {liste.map((session) => {
          const enCours = (EN_COURS as readonly string[]).includes(session.status);
          const echec = session.status === 'render_failed';
          return (
            <li key={session.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                {enCours ? (
                  <Spinner className="h-5 w-5 text-accent" />
                ) : echec ? (
                  <TriangleAlert className="h-5 w-5 text-danger" aria-hidden />
                ) : (
                  <CircleCheck className="h-5 w-5 text-ok" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{session.title ?? t.common.untitled}</p>
                <p className="text-xs text-text-faint">
                  {enCours ? t.sessions.rendersSoon : echec ? t.render.failed : t.sessions.rendersReady}
                </p>
              </div>
              {enCours ? (
                <Badge tone="neutral">
                  {session.status === 'rendering' ? t.sessions.rendersRunning : t.sessions.rendersQueued}
                </Badge>
              ) : (
                <Link
                  href={`/s/${session.code}`}
                  className="inline-flex min-h-9 items-center rounded-md px-3 text-sm font-bold text-link underline underline-offset-4"
                >
                  {t.sessions.rendersWatch}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
