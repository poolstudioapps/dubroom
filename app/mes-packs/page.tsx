import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CommunityClient } from '@/app/communaute/community-client';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.nav.myPacks };
}

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
    <CommunityClient displayName={displayNameFromEmail(user.email)} scope="mine" />
  );
}
