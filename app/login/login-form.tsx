'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useT } from '@/lib/i18n';
import { DiscordButton } from '@/components/discord-button';
import { TermsConsent } from '@/components/terms-consent';
import { Alert, Button, Input, Label } from '@/components/ui';
import { TERMS_STORAGE_KEY, TERMS_VERSION } from '@/config/terms';

import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

type Mode = 'password' | 'link';

/** Se souvient du dernier mode utilise : un habitue ne rechoisit pas. */
const MODE_KEY = 'dubup.loginMode';
const EMAIL_KEY = 'dubup.lastEmail';

export function LoginForm() {
  const t = useT();

  const params = useSearchParams();
  const next = params.get('next') ?? '/sessions';

  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  /**
   * L'acceptation des conditions.
   *
   * Elle n'est pas prise ici pour la forme : le compte n'existe pas
   * encore quand on demande un lien, donc la reponse attend dans le
   * navigateur et la premiere page connectee l'inscrit au profil. Une
   * case deja cochee n'est pas un consentement, elle repart donc a vide
   * a chaque visite tant que rien n'a ete accepte.
   */
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Le premier passage se fait forcement par lien : personne n'a de mot
    // de passe avant d'etre entre une fois.
    // Qui a deja accepte la version en cours ne se le voit pas
    // redemander a chaque connexion.
    if (window.localStorage.getItem(TERMS_STORAGE_KEY) === TERMS_VERSION) {
      setAccepted(true);
    }
    const storedMode =
      window.localStorage.getItem(MODE_KEY) ??
      window.localStorage.getItem('dubroom.loginMode');
    if (storedMode === 'password') setMode('password');
    const storedEmail =
      window.localStorage.getItem(EMAIL_KEY) ??
      window.localStorage.getItem('dubroom.lastEmail');
    if (storedEmail) setEmail(storedEmail);
  }, []);

  /** La liste blanche vaut pour tous les chemins d'entree (PRD §14). */
  async function assertAllowed(): Promise<boolean> {
    const supabase = supabaseBrowser();
    const { data: allowed } = await supabase.rpc('app_is_allowed');
    if (allowed) return true;
    await supabase.auth.signOut();
    setError(t.auth.notAllowed);
    return false;
  }

  /**
   * Le passage oblige, commun aux trois chemins d'entree.
   *
   * Il ne se contente pas de refuser : il amene la case sous les yeux.
   * Elle est en bas d'un formulaire, et quelqu'un qui vient de cliquer
   * sur Discord ne regarde pas la.
   */
  function acceptTerms(): boolean {
    if (!accepted) {
      setError(t.terms.required);
      document
        .getElementById('terms-consent')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    window.localStorage.setItem(TERMS_STORAGE_KEY, TERMS_VERSION);
    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!acceptTerms()) return;
    setError(null);
    setState('working');

    const address = email.trim().toLowerCase();
    window.localStorage.setItem(EMAIL_KEY, address);
    const supabase = supabaseBrowser();

    if (mode === 'password') {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: address,
        password,
      });
      if (authError) {
        setError(
          authError.message.toLowerCase().includes('invalid')
            ? t.auth.badCredentials
            : humanizeError(authError),
        );
        setState('idle');
        return;
      }
      if (!(await assertAllowed())) {
        setState('idle');
        return;
      }
      window.localStorage.setItem(MODE_KEY, 'password');
      // Navigation dure : le serveur doit voir les cookies fraichement poses.
      window.location.replace(next);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: redirectTo },
    });

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('rate limit')
          ? t.auth.rateLimited
          : humanizeError(authError),
      );
      setState('idle');
      return;
    }
    window.localStorage.setItem(MODE_KEY, 'link');
    setState('sent');
  }

  if (state === 'sent') {
    return <Alert tone="ok">{t.auth.sent}</Alert>;
  }

  return (
    <div className="space-y-4">
      <DiscordButton next={next} onError={setError} guard={acceptTerms} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-strong" />
        <span className="text-xs font-bold text-text-faint uppercase">
          {t.auth.orSeparator}
        </span>
        <span className="h-px flex-1 bg-border-strong" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode === 'password' ? (
          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        ) : null}

        <TermsConsent checked={accepted} onChange={setAccepted} />

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={state === 'working'}
        >
          {mode === 'password' ? t.auth.signIn : t.auth.send}
        </Button>

        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center text-center text-xs font-bold text-link underline underline-offset-4"
          onClick={() => {
            setError(null);
            setPassword('');
            setMode(mode === 'password' ? 'link' : 'password');
          }}
        >
          {mode === 'password' ? t.auth.switchToLink : t.auth.switchToPassword}
        </button>

        <p className="text-center text-xs text-text-faint">{t.auth.inviteOnly}</p>
      </form>
    </div>
  );
}
