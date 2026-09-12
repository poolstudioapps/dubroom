import Link from 'next/link';

import { SiteNav } from '@/components/site-nav';
import { APP_NAME } from '@/config/strings';

/** Gabarit commun aux pages légales : lisibles, sobres, sans décor. */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <Link
          href="/"
          className="signage text-2xl text-[oklch(0.85_0.12_200)] sm:text-3xl"
        >
          {APP_NAME}
        </Link>
        <SiteNav />
      </header>

      <div className="rounded-[1.75rem] border-[3px] border-bezel-dark bg-bezel p-4 sm:p-6">
        <article className="rounded-[1.25rem] bg-screen p-5 sm:p-8">
          <h1 className="signage mb-6 text-3xl" style={{ textShadow: 'none' }}>
            {title}
          </h1>
          <div className="space-y-6 text-sm leading-relaxed text-text-muted [&_a]:font-bold [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-text">{title}</h2>
      {children}
    </section>
  );
}
