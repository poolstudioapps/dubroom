import { safeLanding } from '@/lib/auth-landing';
import { HashSessionFallback } from './hash-fallback';

/**
 * Page dediee au flot implicite.
 *
 * Elle existe parce que le jeton arrive dans le fragment de l'URL et que
 * seul le navigateur peut le lire. Le fragment survit a la redirection
 * depuis /auth/callback : c'est ce qui permet de separer proprement les
 * deux flots sans perdre l'information en route.
 */
export default async function AuthHashPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <HashSessionFallback landing={safeLanding(next)} />;
}
