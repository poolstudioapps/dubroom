import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';

/**
 * Gabarit commun aux pages legales : lisibles, sobres, sans decor.
 *
 * Il porte lui-meme le pied de page. Les deux pages l'ajoutaient chacune
 * derriere le gabarit, dans un conteneur a elles : la largeur du texte et
 * celle du pied de page finissaient par ne plus coincider.
 */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-[min(52rem,94vw)]">
        <SiteHeader />

        <main className="tv-frame rounded-[1.75rem] border-[3px] border-bezel-dark bg-bezel p-4 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.7)] sm:p-6">
          <article className="tv-screen rounded-[1.25rem] bg-screen p-5 shadow-[inset_0_0_0_3px_oklch(0.32_0.12_300)] sm:p-8">
            <h1 className="titre mb-6 text-3xl">
              {title}
            </h1>
            <div className="space-y-7 text-sm leading-relaxed text-text-muted [&_a]:font-bold [&_a]:text-link [&_a]:underline [&_a]:underline-offset-4">
              {children}
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </div>
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
