'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import type { Locale } from '@/config/i18n';
import type { Theme } from '@/config/theme';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';

export function Providers({
  children,
  locale,
  theme,
}: {
  children: React.ReactNode;
  locale: Locale;
  theme: Theme;
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

  return (
    <QueryClientProvider client={client}>
      <I18nProvider locale={locale}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
