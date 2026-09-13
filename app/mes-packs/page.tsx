import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/supabase/server';

/**
 * Mes packs.
 *
 * Ils vivent sur le profil public : c'est la qu'on les voit comme les
 * autres les voient, et qu'on les modifie ou les retire. L'adresse reste
 * pour les liens deja partages.
 */
export default async function MyPacksPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fmes-packs');
  redirect(`/u/${user.id}`);
}
