'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { Alert, Button, Card, Input, Label } from '@/components/ui';

import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

/** Longueur minimale exigee. Supabase en impose six, on est plus strict. */
const MIN_LENGTH = 8;

/**
 * Definir un mot de passe.
 *
 * L'entree dans le produit se fait par lien de connexion, et c'est bien :
 * personne n'a de mot de passe avant d'avoir ete invite. Mais revenir par
 * sa boite mail a chaque soiree est penible, et le service de courriel
 * gratuit de Supabase plafonne a deux envois par heure. Un mot de passe
 * rend les retours immediats, sans toucher a la liste blanche : elle
 * reste verifiee a chaque connexion, quel que soit le chemin.
 */
export function PasswordCard({ bare }: { bare?: boolean } = {}) {
  const t = useT();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const { error: updateError } = await supabaseBrowser().auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setPassword('');
      setDone(true);
      window.localStorage.setItem('dubup.loginMode', 'password');
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const Shell = bare ? BareShell : Card;

  return (
    <Shell className="space-y-3">
      {bare ? null : (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-text-muted" aria-hidden />
          <h2 className="text-sm font-bold">{t.auth.passwordSectionTitle}</h2>
        </div>
      )}
      <p className="text-xs leading-relaxed text-text-faint">
        {t.auth.passwordSectionHelp}
      </p>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setDone(false);
          if (password.length < MIN_LENGTH) {
            setError(t.auth.passwordTooShort);
            return;
          }
          save.mutate();
        }}
      >
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t.auth.passwordNew}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-w-48 flex-1"
        />
        <Button type="submit" loading={save.isPending} disabled={!password}>
          {t.auth.passwordSave}
        </Button>
      </form>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {done ? <Alert tone="ok">{t.auth.passwordSaved}</Alert> : null}
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
