'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { Alert, Badge, Button, Card, Input, Spinner } from '@/components/ui';

import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

interface Guest {
  email: string;
  added_at: string;
  has_account: boolean;
}

/**
 * La liste des invites.
 *
 * Le besoin d'ajouter quelqu'un arrive toujours au pire moment : un
 * joueur se connecte par Discord avec une adresse differente de celle
 * qu'on avait prevue, tout le monde attend. Avoir la liste dans
 * l'application evite d'aller chercher un terminal au milieu d'une
 * soiree.
 */
export function GuestListCard({ bare }: { bare?: boolean } = {}) {
  const t = useT();

  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const guests = useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: queryError } = await (supabaseBrowser().rpc as any)(
        'list_guests',
      );
      if (queryError) throw queryError;
      return (data ?? []) as Guest[];
    },
  });

  const mutate = useMutation({
    mutationFn: async (input: {
      fn: 'allow_guest' | 'revoke_guest';
      email: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await (supabaseBrowser().rpc as any)(input.fn, {
        p_email: input.email,
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      setEmail('');
      void qc.invalidateQueries({ queryKey: ['guests'] });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  // Dans un tiroir, le titre est deja porte par l'entete du tiroir : le
  // repeter ferait deux fois le meme mot a deux lignes d'intervalle.
  const Shell = bare ? BareShell : Card;

  return (
    <Shell className="space-y-3">
      {bare ? null : (
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-text-muted" aria-hidden />
          <h2 className="text-sm font-bold">{t.guests.title}</h2>
        </div>
      )}
      <p className="text-xs leading-relaxed text-text-faint">{t.guests.help}</p>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutate.mutate({ fn: 'allow_guest', email });
        }}
      >
        <Input
          type="email"
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-48 flex-1"
        />
        <Button
          type="submit"
          loading={mutate.isPending}
          disabled={!email.includes('@')}
        >
          {t.guests.add}
        </Button>
      </form>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {guests.isLoading ? (
        <Spinner />
      ) : (
        <ul className="space-y-1">
          {guests.data?.map((guest) => (
            <li
              key={guest.email}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate">{guest.email}</span>
              <div className="flex shrink-0 items-center gap-1">
                <Badge tone={guest.has_account ? 'ok' : 'neutral'}>
                  {guest.has_account ? t.guests.joined : t.guests.pending}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t.guests.remove}
                  title={t.guests.remove}
                  onClick={() => {
                    setError(null);
                    mutate.mutate({ fn: 'revoke_guest', email: guest.email });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

/** Le meme contenu, sans la plaque : le tiroir en fournit deja une. */
function BareShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
