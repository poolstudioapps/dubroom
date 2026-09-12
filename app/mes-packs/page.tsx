import { redirect } from 'next/navigation';

import { CommunityClient } from '@/app/communaute/community-client';
import { APP_NAME } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';

export const metadata = { title: `Mes packs — ${APP_NAME}` };

/**
 * Mes packs.
 *
 * Exactement la page Communaute, restreinte a ce que j'ai publie : deux
 * listes dessinees separement auraient diverge des la premiere retouche.
 */
export default async function MyPacksPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fmes-packs');

  return (
    <CommunityClient
      displayName={displayNameFromEmail(user.email)}
      scope="mine"
    />
  );
}
