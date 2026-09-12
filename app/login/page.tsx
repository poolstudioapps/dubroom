import { Suspense } from 'react';
import { APP_NAME, APP_TAGLINE, t } from '@/config/strings';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-sm text-text-muted">{APP_TAGLINE}</p>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">{t.auth.title}</h2>
          <p className="text-sm text-text-faint">{t.auth.subtitle}</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
