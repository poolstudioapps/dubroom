'use client';

import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MailCheck } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { DiscordButton } from '@/components/discord-button';
import { TermsNotice } from '@/components/terms-consent';
import { Alert, Button, Input, Label, Spinner } from '@/components/ui';
import { EMAIL_CODE_ENABLED } from '@/config/constants';

import { recallPreference, rememberPreference } from '@/lib/consent';
import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

type Mode = 'password' | 'link';

/** Se souvient du dernier mode utilise : un habitue ne rechoisit pas. */
const MODE_KEY = 'dubup.loginMode' as const;
const EMAIL_KEY = 'dubup.lastEmail' as const;
const LONGUEUR_CODE = 6;

/**
 * La connexion.
 *
 * Par e-mail, le lien seul posait deux problemes. Il ouvrait un nouvel
 * onglet, et l'onglet de depart restait sur « lien envoye » sans jamais
 * bouger. Et selon la messagerie, il s'ouvrait dans un autre navigateur
 * que celui de la demande : l'echange de code echouait, faute de la cle
 * gardee par le premier.
 *
 * Desormais :
 *
 * - le lien est demande en flot implicite : le jeton revient dans le
 *   fragment de l'URL et s'installe dans n'importe quel navigateur, sans
 *   cle gardee par celui de la demande ;
 * - si le lien est ouvert dans ce meme navigateur, cet onglet le voit et
 *   continue tout seul ;
 * - des qu'un serveur d'envoi a nous permet le gabarit Dub'Up, le
 *   courriel porte aussi un code a six chiffres, qui se tape ici sans
 *   changer d'onglet (`EMAIL_CODE_ENABLED`).
 */
export function LoginForm() {
  const t = useT();

  const params = useSearchParams();
  const next = params.get('next') ?? '/sessions';

  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [adresse, setAdresse] = useState('');
  const [renvoye, setRenvoye] = useState(false);
  const sortie = useRef(false);

  useEffect(() => {
    // Le premier passage se fait forcement par lien : personne n'a de mot
    // de passe avant d'etre entre une fois.
    // Des preferences : relues seulement si on a accepte d'en garder.
    const storedMode = recallPreference(MODE_KEY) ?? recallPreference('dubroom.loginMode');
    if (storedMode === 'password') setMode('password');
    const storedEmail = recallPreference(EMAIL_KEY) ?? recallPreference('dubroom.lastEmail');
    if (storedEmail) setEmail(storedEmail);
  }, []);

  /** La liste blanche vaut pour tous les chemins d'entree (PRD §14). */
  const assertAllowed = useCallback(async (): Promise<boolean> => {
    const supabase = supabaseBrowser();
    const { data: allowed } = await supabase.rpc('app_is_allowed');
    if (allowed) return true;
    await supabase.auth.signOut();
    setError(t.auth.notAllowed);
    return false;
  }, [t.auth.notAllowed]);

  /** Une fois connecte, par n'importe quel chemin : on entre. */
  const entrer = useCallback(async () => {
    if (sortie.current) return;
    sortie.current = true;
    if (!(await assertAllowed())) {
      sortie.current = false;
      return;
    }
    // Navigation dure : le serveur doit voir les cookies fraichement poses.
    window.location.replace(next);
  }, [assertAllowed, next]);

  /*
   * Le lien a peut-etre ete ouvert dans un autre onglet de ce navigateur :
   * la session y est posee, dans les cookies que cet onglet partage. On
   * regarde a intervalle regulier et au retour sur l'onglet.
   */
  useEffect(() => {
    if (state !== 'sent') return;
    const supabase = supabaseBrowser();
    let actif = true;
    const verifier = async () => {
      if (!actif || sortie.current) return;
      const { data } = await supabase.auth.getSession();
      if (actif && data.session) await entrer();
    };
    const minuteur = window.setInterval(verifier, 2500);
    const auRetour = () => void verifier();
    window.addEventListener('focus', auRetour);
    document.addEventListener('visibilitychange', auRetour);
    const { data: abonnement } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void verifier();
    });
    return () => {
      actif = false;
      window.clearInterval(minuteur);
      window.removeEventListener('focus', auRetour);
      document.removeEventListener('visibilitychange', auRetour);
      abonnement.subscription.unsubscribe();
    };
  }, [state, entrer]);

  async function envoyerLien(address: string): Promise<boolean> {
    // Un client a part, en flot implicite, pour cette seule demande : le
    // client de l'application impose le flot a code, dont l'echange echoue
    // des que la messagerie ouvre le lien dans un autre navigateur.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    );
    // `/auth/callback` renvoie le fragment vers la page qui l'installe.
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
      return false;
    }
    return true;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setState('working');

    const address = email.trim().toLowerCase();
    rememberPreference(EMAIL_KEY, address);
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
      rememberPreference(MODE_KEY, 'password');
      await entrer();
      setState('idle');
      return;
    }

    if (!(await envoyerLien(address))) {
      setState('idle');
      return;
    }
    rememberPreference(MODE_KEY, 'link');
    setAdresse(address);
    setCode('');
    setState('sent');
  }

  async function validerCode(saisi: string) {
    if (saisi.length !== LONGUEUR_CODE || verifying) return;
    setError(null);
    setVerifying(true);
    const { error: authError } = await supabaseBrowser().auth.verifyOtp({
      email: adresse,
      token: saisi,
      type: 'email',
    });
    if (authError) {
      setError(t.auth.codeInvalid);
      setVerifying(false);
      return;
    }
    await entrer();
    setVerifying(false);
  }

  if (state === 'sent') {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <MailCheck className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="font-bold">{t.auth.sentTitle}</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              {EMAIL_CODE_ENABLED ? t.auth.sentBody(adresse) : t.auth.sentBodyLink(adresse)}
            </p>
          </div>
        </div>

        {EMAIL_CODE_ENABLED ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void validerCode(code);
          }}
        >
          <Label htmlFor="code">{t.auth.codeLabel}</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={LONGUEUR_CODE}
            value={code}
            placeholder="••••••"
            onChange={(e) => {
              const saisi = e.target.value.replace(/\D/g, '').slice(0, LONGUEUR_CODE);
              setCode(saisi);
              // Six chiffres, c'est complet : pas besoin d'aller cliquer.
              if (saisi.length === LONGUEUR_CODE) void validerCode(saisi);
            }}
            className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={code.length !== LONGUEUR_CODE}
            loading={verifying}
          >
            {t.auth.codeSubmit}
          </Button>
        </form>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}
        {renvoye ? <Alert tone="ok">{t.auth.sent}</Alert> : null}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-text-faint">
          <Spinner className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {EMAIL_CODE_ENABLED ? t.auth.codeHelp : t.auth.linkHelp}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <button
            type="button"
            className="min-h-11 text-xs font-bold text-link underline underline-offset-4"
            onClick={() => {
              setError(null);
              setRenvoye(false);
              setState('idle');
            }}
          >
            {t.auth.changeEmail}
          </button>
          <button
            type="button"
            className="min-h-11 text-xs font-bold text-link underline underline-offset-4"
            onClick={async () => {
              setError(null);
              setRenvoye(false);
              if (await envoyerLien(adresse)) setRenvoye(true);
            }}
          >
            {t.auth.resend}
          </button>
        </div>
        <p className="text-center text-xs text-text-faint">{t.auth.spamHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DiscordButton next={next} onError={setError} />

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

        <TermsNotice />

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
