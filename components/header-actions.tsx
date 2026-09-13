'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogIn, Plus } from 'lucide-react';

import { Alert, Button, Dialog, Input } from '@/components/ui';
import { joinSession } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useMyProfile } from '@/lib/profile';
import { normalizeSessionCode } from '@/lib/utils';

/**
 * Creer, rejoindre : les deux gestes du produit, en haut a droite.
 *
 * Ils vivaient au fond de « Mes scenes », qu'il fallait ouvrir d'abord.
 * Poses a cote du compte, on les trouve depuis n'importe quelle page.
 *
 * Sans compte, les deux menent a la connexion, avec la destination en
 * memoire : on revient ensuite exactement la ou l'on voulait aller.
 */
export function HeaderActions({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  const router = useRouter();
  const [rejoindre, setRejoindre] = useState(false);

  const creer = signedIn
    ? '/sessions/new'
    : `/login?next=${encodeURIComponent('/sessions/new')}`;

  return (
    <>
      <Link
        href={creer}
        aria-label={t.nav.create}
        className="btn-3d btn-primary inline-flex h-11 items-center justify-center gap-2 bg-accent px-3 text-sm font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover sm:px-4"
      >
        <Plus className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t.nav.create}</span>
      </Link>

      <button
        type="button"
        aria-label={t.nav.join}
        onClick={() =>
          signedIn
            ? setRejoindre(true)
            : router.push(`/login?next=${encodeURIComponent('/sessions')}`)
        }
        className="btn-3d btn-secondary btn-bascule inline-flex h-11 items-center justify-center gap-2 bg-surface-raised px-3 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)] sm:px-4"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t.nav.join}</span>
      </button>

      {signedIn ? (
        <JoinDialog open={rejoindre} onClose={() => setRejoindre(false)} />
      ) : null}
    </>
  );
}

function JoinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const profile = useMyProfile();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const join = useMutation({
    mutationFn: () =>
      joinSession(normalizeSessionCode(code), profile.data?.display_name ?? 'Joueur'),
    onSuccess: (session) => {
      onClose();
      setCode('');
      router.push(`/s/${session.code}`);
    },
    onError: (e) => setError(humanizeError(e)),
  });

  return (
    <Dialog open={open} onClose={onClose} title={t.sessions.joinByCode}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          join.mutate();
        }}
      >
        <p className="leading-relaxed">{t.nav.joinHelp}</p>
        <div className="flex gap-2">
          <Input
            value={code}
            autoFocus
            onChange={(e) => setCode(normalizeSessionCode(e.target.value))}
            placeholder={t.sessions.codePlaceholder}
            maxLength={6}
            aria-label={t.sessions.joinByCode}
            className="min-w-0 flex-1 font-mono uppercase tracking-[0.3em]"
          />
          <Button
            type="submit"
            variant="primary"
            loading={join.isPending}
            disabled={code.length < 6}
          >
            {t.sessions.join}
          </Button>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Dialog>
  );
}
