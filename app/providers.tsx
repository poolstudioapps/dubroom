'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { Locale } from '@/config/i18n';
import { I18nProvider } from '@/lib/i18n';

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Le lobby et les ecrans d'attente sont pousses par Realtime ;
            // le refetch automatique ne sert qu'a rattraper une websocket
            // tombee, pas a piloter l'affichage.
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  // L'hydratation est faite : le script d'apparition peut marquer les
  // elements sans que React y voie un HTML different du sien.
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '');
    document.dispatchEvent(new Event('dubblers:hydrated'));
  }, []);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </QueryClientProvider>
  );
}
