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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-lg font-semibold">Connexion impossible</h1>
      <p className="text-sm text-text-muted">{message}</p>
      <Link
        href="/login"
        className="text-sm text-accent underline underline-offset-4"
      >
        Revenir à la connexion
      </Link>
    </main>
  );
}
