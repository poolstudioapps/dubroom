'use client';

import { useState } from 'react';

import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';

import { humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Connexion par Discord.
 *
 * C'est le chemin le plus court pour ce produit : le groupe est deja sur
 * Discord, personne n'a de mot de passe a retenir, et surtout rien ne
 * passe par le courriel — donc aucun plafond d'envoi a subir.
 *
 * Discord fournit l'adresse du compte, et c'est elle qui est confrontee a
 * la liste blanche. Si elle differe de celle qui a ete invitee, la porte
 * reste fermee et le message dit laquelle ajouter.
 */
export function DiscordButton({
  next,
  onError,
}: {
  next: string;
  onError: (message: string) => void;
}) {
  const t = useT();

  const [working, setWorking] = useState(false);

  async function signIn() {
    setWorking(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      onError(humanizeError(error));
      setWorking(false);
    }
    // En cas de succes le navigateur part chez Discord : rien a faire ici.
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full bg-[#5865F2] text-white hover:brightness-110 [--btn-lip:#3b45c4]"
      loading={working}
      onClick={() => void signIn()}
    >
      {working ? null : <DiscordMark />}
      {t.auth.discord}
    </Button>
  );
}

/** Le logo, en SVG : rien a telecharger, et il suit la taille du texte. */
function DiscordMark() {
  return (
    <svg
      viewBox="0 0 127 96"
      className="h-5 w-5 fill-current"
      aria-hidden
      focusable="false"
    >
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
    </svg>
  );
}
