'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (conteneur: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

/**
 * Le captcha de la connexion, Cloudflare Turnstile.
 *
 * Il n'existe que si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est renseignee, et
 * Supabase ne verifie le jeton que si la cle secrete lui a ete donnee :
 * les deux se configurent ensemble, au moment d'ouvrir le site. Sans lui,
 * n'importe qui peut demander un lien de connexion pour n'importe quelle
 * adresse, autant de fois qu'il veut : de quoi noyer une messagerie, et
 * epuiser notre quota d'envoi pour tout le monde.
 *
 * Chaque jeton ne sert qu'une fois : le formulaire remonte le composant
 * apres chaque tentative (par sa `key`) pour en obtenir un neuf.
 */
export function Turnstile({
  siteKey,
  nonce,
  onToken,
}: {
  siteKey: string;
  /** Le nonce de la politique de securite du contenu, pour le script. */
  nonce?: string;
  onToken: (token: string | null) => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [pret, setPret] = useState(() => typeof window !== 'undefined' && !!window.turnstile);
  const rappel = useRef(onToken);
  rappel.current = onToken;

  useEffect(() => {
    const cible = conteneur.current;
    if (!pret || !cible || widget.current || !window.turnstile) return;
    widget.current = window.turnstile.render(cible, {
      sitekey: siteKey,
      theme: 'dark',
      size: 'flexible',
      callback: (token: string) => rappel.current(token),
      'expired-callback': () => rappel.current(null),
      'error-callback': () => rappel.current(null),
    });
    return () => {
      if (widget.current) {
        try {
          window.turnstile?.remove(widget.current);
        } catch {
          // Le widget a deja disparu avec la page.
        }
        widget.current = null;
      }
    };
  }, [pret, siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        nonce={nonce}
        strategy="afterInteractive"
        onReady={() => setPret(true)}
      />
      <div ref={conteneur} className="min-h-[65px]" />
    </>
  );
}
