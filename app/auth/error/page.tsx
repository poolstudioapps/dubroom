import Link from 'next/link';
import { t } from '@/config/strings';

const REASONS: Record<string, string> = {
  not_allowed: t.auth.notAllowed,
  exchange: 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.',
  missing_code: 'Ce lien est incomplet. Demande-en un nouveau.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = REASONS[reason ?? ''] ?? t.common.unknownError;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <div className="plate rounded-card space-y-4 p-6">
        <h1 className="signage text-2xl" style={{ textShadow: 'none' }}>
          Connexion impossible
        </h1>
        <p className="text-sm text-text-muted">{message}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-bold text-[oklch(0.45_0.17_255)] underline underline-offset-4"
        >
          Revenir à la connexion
        </Link>
      </div>
    </main>
  );
}
