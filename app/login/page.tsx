import { Suspense } from 'react';
import { APP_NAME, APP_TAGLINE, t } from '@/config/strings';
import { LoginForm } from './login-form';

/** Ecran-titre : le poste allume, le logo, et une seule chose a faire. */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-[1.75rem] border-[3px] border-bezel-dark bg-bezel p-4 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.7),inset_0_2px_0_0_rgb(255_255_255/0.18)] sm:p-6">
          <div className="relative overflow-hidden rounded-[1.25rem] bg-screen px-6 py-10 shadow-[inset_0_0_0_3px_oklch(0.32_0.12_300),inset_0_0_40px_10px_rgb(0_0_0/0.12)] sm:px-10 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
              aria-hidden
            />

            <div className="relative space-y-8 text-center">
              <div className="space-y-2">
                <h1 className="signage text-5xl leading-[0.95] text-[oklch(0.55_0.17_235)] sm:text-7xl">
                  {APP_NAME}
                </h1>
                <p className="text-sm font-bold text-text-muted">{APP_TAGLINE}</p>
              </div>

              <div className="mx-auto max-w-sm space-y-4 text-left">
                <p className="text-center text-sm text-text-muted">
                  {t.auth.subtitle}
                </p>
                <Suspense>
                  <LoginForm />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* La console sous le poste. */}
        <div
          className="mx-auto -mt-1 flex w-[80%] items-center justify-between rounded-b-2xl border-x-[3px] border-b-[3px] border-console-dark bg-console px-6 py-3 shadow-[0_12px_24px_-8px_rgb(0_0_0/0.6)]"
          aria-hidden
        >
          <div className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-console-dark/70 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
            <span className="h-4 w-4 rounded-full bg-console-dark/70 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
          </div>
          <div className="grille h-3 w-32 rounded-sm bg-console-dark/40" />
          <div className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-accent shadow-[0_2px_0_oklch(0.5_0.15_143)]" />
            <span className="h-4 w-4 rounded-full bg-danger shadow-[0_2px_0_oklch(0.36_0.16_25)]" />
            <span className="h-4 w-4 rounded-full bg-warn shadow-[0_2px_0_oklch(0.5_0.12_75)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
