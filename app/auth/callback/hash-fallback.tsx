'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Spinner } from '@/components/ui';
import { t } from '@/config/strings';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Rattrape ce que le serveur ne peut pas voir.
 *
 * Supabase renvoie deux choses dans le FRAGMENT de l'URL, jamais transmis
 * au serveur : le jeton quand tout va bien, et la raison de l'echec quand
 * le lien a expire ou a deja servi. Sans ce composant, les deux cas
 * finissaient sur le meme message trompeur, « ce lien est incomplet ».
 */
export function HashSessionFallback({ landing }: { landing: string }) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // Echec annonce par Supabase : on rend la vraie raison.
    const errorCode = params.get('error_code') ?? params.get('error');
    if (errorCode) {
      const expired =
        errorCode.includes('expired') ||
        (params.get('error_description') ?? '').toLowerCase().includes('expired');
      router.replace(`/auth/error?reason=${expired ? 'expired' : 'exchange'}`);
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) {
      router.replace('/auth/error?reason=missing_code');
      return;
    }

    const supabase = supabaseBrowser();

    void (async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        router.replace('/auth/error?reason=exchange');
        return;
      }

      const { data: allowed } = await supabase.rpc('app_is_allowed');
      if (!allowed) {
        await supabase.auth.signOut();
        router.replace('/auth/error?reason=not_allowed');
        return;
      }

      // Navigation dure, et non `router.replace` : les cookies de session
      // viennent d'etre poses cote navigateur, et le serveur doit les
      // recevoir au prochain rendu. Un changement de route cote client
      // repartirait du rendu precedent, encore anonyme.
      window.location.replace(landing);
    })();
  }, [landing, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="plate rounded-card flex items-center gap-3 px-6 py-4">
        <Spinner />
        <span className="text-sm text-text-muted">{t.common.loading}</span>
      </div>
    </main>
  );
}
