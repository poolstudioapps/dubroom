'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Spinner } from '@/components/ui';
import { t } from '@/config/strings';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Rattrape les liens en flot implicite.
 *
 * Le jeton est dans le fragment de l'URL, donc invisible du serveur. On
 * le lit ici, on installe la session, on verifie la liste blanche, puis
 * on efface le fragment de l'historique pour qu'un jeton valide ne traine
 * pas dans la barre d'adresse ni dans un partage de lien.
 */
export function HashSessionFallback({ landing }: { landing: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
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
