'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

import { Button, Dialog, Toggle } from '@/components/ui';
import {
  COOKIE_SETTINGS_EVENT,
  readConsent,
  writeConsent,
} from '@/lib/consent';
import { useT } from '@/lib/i18n';

/**
 * Le bandeau des cookies, et son panneau de reglages.
 *
 * Le bandeau ne s'affiche que tant que personne n'a choisi. « Refuser »
 * et « Tout accepter » ont le meme poids : un refus cache derriere
 * « Personnaliser » n'est pas un choix libre. Le panneau se rouvre a tout
 * moment depuis le pied de page ou la page Cookies.
 *
 * Rien n'est rendu cote serveur : le choix vit dans un cookie que seul le
 * navigateur lit, et un bandeau rendu puis retire a l'hydratation
 * clignoterait a chaque page pour ceux qui ont deja repondu.
 */
export function CookieConsent() {
  const t = useT();
  const [bandeau, setBandeau] = useState(false);
  const [panneau, setPanneau] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    const choix = readConsent();
    setBandeau(choix === null);
    setPreferences(choix?.preferences ?? false);

    const ouvrir = () => {
      setPreferences(readConsent()?.preferences ?? false);
      setPanneau(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, ouvrir);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, ouvrir);
  }, []);

  function decider(prefs: boolean) {
    writeConsent(prefs);
    setPreferences(prefs);
    setBandeau(false);
    setPanneau(false);
  }

  return (
    <>
      {bandeau && !panneau ? (
        <div
          role="region"
          aria-label={t.cookies.bannerTitle}
          className="bandeau-cookies fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl sm:inset-x-6 sm:bottom-6"
        >
          {/* Un fond plein, pas du verre : le pied de page passait au
              travers et se lisait par-dessus le texte du bandeau. */}
          <div className="flex flex-col gap-4 rounded-card border border-[oklch(1_0_0/0.14)] bg-[oklch(0.15_0.004_85)] p-5 shadow-[0_24px_60px_-12px_oklch(0_0_0/0.8)] sm:flex-row sm:items-center">
            <Cookie className="hidden h-8 w-8 shrink-0 text-accent sm:block" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-text">{t.cookies.bannerTitle}</p>
              <p className="text-xs leading-relaxed text-text-muted">
                {t.cookies.bannerBody}{' '}
                <Link href="/cookies" className="font-bold text-link underline underline-offset-2">
                  {t.cookies.policyLink}
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPanneau(true)}>
                {t.cookies.customize}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => decider(false)}>
                {t.cookies.refuse}
              </Button>
              <Button size="sm" variant="primary" onClick={() => decider(true)}>
                {t.cookies.accept}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={panneau}
        onClose={() => setPanneau(false)}
        title={t.cookies.settingsTitle}
        footer={
          <>
            <Button variant="secondary" onClick={() => decider(preferences)}>
              {t.cookies.save}
            </Button>
            <Button variant="primary" onClick={() => decider(true)}>
              {t.cookies.accept}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-text-muted">{t.cookies.settingsBody}</p>

          <div className="flex items-start gap-3 rounded-card border border-border p-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-bold">{t.cookies.essentialTitle}</p>
              <p className="text-xs leading-relaxed text-text-muted">{t.cookies.essentialBody}</p>
            </div>
            <Toggle checked onChange={() => undefined} label={t.cookies.essentialTitle} disabled />
          </div>

          <div className="flex items-start gap-3 rounded-card border border-border p-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-bold">{t.cookies.preferencesTitle}</p>
              <p className="text-xs leading-relaxed text-text-muted">{t.cookies.preferencesBody}</p>
            </div>
            <Toggle
              checked={preferences}
              onChange={setPreferences}
              label={t.cookies.preferencesTitle}
            />
          </div>

          <p className="text-xs text-text-faint">
            {t.cookies.noTracking}{' '}
            <Link href="/cookies" className="font-bold text-link underline underline-offset-2">
              {t.cookies.policyLink}
            </Link>
          </p>
        </div>
      </Dialog>
    </>
  );
}

/** Rouvre le panneau : pour le pied de page et la page Cookies. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useT();
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
    >
      {t.cookies.manage}
    </button>
  );
}
