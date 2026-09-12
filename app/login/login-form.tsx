'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Alert, Button, Input, Label } from '@/components/ui';
import { t } from '@/config/strings';
import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/sessions';

  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setState('sending');

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: authError } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    if (authError) {
      setError(humanizeError(authError));
      setState('idle');
      return;
    }
    setState('sent');
  }

  if (state === 'sent') {
    return <Alert tone="ok">{t.auth.sent}</Alert>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t.auth.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={state === 'sending'}
      >
        {state === 'sending' ? t.auth.sending : t.auth.send}
      </Button>

      <p className="text-xs text-text-faint">
        L’accès est réservé aux adresses invitées.
      </p>
    </form>
  );
}
