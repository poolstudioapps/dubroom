import Link from 'next/link';
import { Footer } from '@/components/footer';
import { getDictionary } from '@/lib/i18n-server';

/**
 * Les raisons qui ne dependent pas du dictionnaire.
 *
 * Elles restent en francais pour l'instant : ce sont des messages
 * d'echec d'authentification, lus avant meme qu'une langue ait pu etre
 * choisie dans un compte.
 */
const REASONS: Record<string, string> = {
  expired:
    'Ce lien a expiré ou a déjà servi. Les liens de connexion ne valent qu’une heure et qu’une fois. Demandes-en un nouveau.',
  exchange: 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.',
  missing_code: 'Ce lien est incomplet. Demande-en un nouveau.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; email?: string }>;
}) {
  const { reason, email } = await searchParams;
  const t = await getDictionary();
  const message =
    reason === 'not_allowed'
      ? email
        ? t.auth.notAllowedWith(email)
        : t.auth.notAllowed
      : (REASONS[reason ?? ''] ?? t.common.unknownError);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <main className="plate rounded-card space-y-4 p-6">
        <h1 className="signage text-2xl" style={{ textShadow: 'none' }}>
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
