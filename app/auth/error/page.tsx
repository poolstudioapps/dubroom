import Link from 'next/link';
import { Footer } from '@/components/footer';
import { getDictionary } from '@/lib/i18n-server';


export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; email?: string }>;
}) {
  const { reason, email } = await searchParams;
  const t = await getDictionary();
    /*
   * Les raisons d'echec, traduites comme le reste.
   *
   * Elles etaient restees en francais au motif qu'on les lit avant
   * d'avoir choisi une langue. C'etait faux : le dictionnaire est deja
   * charge sur cette page, et la langue vient de l'en-tete du navigateur
   * bien avant qu'un compte existe.
   */
  const raisons: Record<string, string> = {
    expired: t.auth.linkExpired,
    exchange: t.auth.linkUsed,
    missing_code: t.auth.linkIncomplete,
  };

  const message =
    reason === 'not_allowed'
      ? email
        ? t.auth.notAllowedWith(email)
        : t.auth.notAllowed
      : (raisons[reason ?? ''] ?? t.common.unknownError);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <main className="plate rounded-card space-y-4 p-6">
        <h1 className="titre text-2xl">
          {t.auth.errorTitle}
        </h1>
        <p className="text-sm text-text-muted">{message}</p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-bold text-[oklch(0.45_0.17_255)] underline underline-offset-4"
        >
          {t.auth.backToSignIn}
        </Link>
      </main>

      {/* Une page d'echec sans issue est une impasse : le pied de page
          rend au moins les mentions et le choix de la langue. */}
      <Footer />
    </div>
  );
}
