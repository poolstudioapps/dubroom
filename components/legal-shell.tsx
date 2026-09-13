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
      {/* L'en-tete et le pied de page a la largeur du site ; le texte, a
          la largeur qui se lit. Le tout a 52 rem renvoyait les boutons de
          l'en-tete a la ligne. */}
      <div className="flex w-full max-w-[min(84rem,94vw)] flex-1 flex-col">
        <SiteHeader />

        <main className="mx-auto w-full max-w-3xl flex-1 py-5 sm:py-8">
          <article className="panel p-5 sm:p-8">
            <h1 className="titre mb-6 text-3xl sm:text-4xl">{title}</h1>
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
