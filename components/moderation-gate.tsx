'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Ban, LogOut, TriangleAlert } from 'lucide-react';

import { Button, Dialog } from '@/components/ui';
import { acknowledgeWarnings, moderationKey, useMyModeration } from '@/lib/creators';
import { useT } from '@/lib/i18n';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Ce que la moderation a a dire a la personne connectee.
 *
 * Un commentaire signale cinq fois disparait : son auteur doit le savoir
 * au prochain passage, pas le decouvrir en cherchant son message. On lui
 * montre ce qui a ete retire et ou il en est — au troisieme
 * avertissement, l'acces est suspendu. Une fois suspendu, plus rien ne
 * s'utilise : on le dit, et on propose de se deconnecter.
 */
export function ModerationGate() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const moderation = useMyModeration();

  const lu = useMutation({
    mutationFn: acknowledgeWarnings,
    onSettled: () => void qc.invalidateQueries({ queryKey: moderationKey }),
  });

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const data = moderation.data;
  if (!data) return null;

  if (data.banned) {
    return (
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="acces-suspendu"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <div className="panel max-w-md space-y-4 p-6 text-center">
          <Ban className="mx-auto h-10 w-10 text-danger" aria-hidden />
          <h2 id="acces-suspendu" className="titre text-2xl">
            {t.moderation.bannedTitle}
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">{t.moderation.bannedBody}</p>
          <Button variant="secondary" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden />
            {t.auth.signOut}
          </Button>
        </div>
      </div>
    );
  }

  if (data.warnings.length === 0) return null;

  return (
    <Dialog
      open
      onClose={() => lu.mutate()}
      title={t.moderation.warningTitle}
      footer={
        <Button variant="primary" loading={lu.isPending} onClick={() => lu.mutate()}>
          {t.moderation.acknowledge}
        </Button>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="flex gap-2 leading-relaxed">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
          {t.moderation.warningBody(data.warnings.length)}
        </p>
        <ul className="space-y-2">
          {data.warnings.map((w) => (
            <li key={w.id} className="space-y-1 rounded-card bg-surface-sunken p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-text-faint">
                {t.moderation.warningExcerpt}
              </p>
              <p className="whitespace-pre-line break-words text-text-muted">{w.excerpt}</p>
            </li>
          ))}
        </ul>
        <p className="font-bold text-danger-ink">
          {t.moderation.warningCount(Math.min(data.warning_count, 3))}
        </p>
      </div>
    </Dialog>
  );
}
