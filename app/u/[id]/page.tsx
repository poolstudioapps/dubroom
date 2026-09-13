import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser, supabaseServer } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CreatorProfileClient } from './creator-profile-client';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** L'onglet porte le nom du createur, pas un « Profil » anonyme. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const robots = { index: false, follow: false };
  if (!UUID.test(id)) return { robots };

  const [supabase, t] = await Promise.all([supabaseServer(), getDictionary()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.rpc as any)('get_creator_profile', { p_user_id: id });
  const nom = (data as { display_name?: string } | null)?.display_name;
  return { title: nom ?? t.creators.myPublicProfile, robots };
}

/** Le profil public d'un createur : ses scenes, ses votes, son fil. */
export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/u/${id}`)}`);

  return <CreatorProfileClient userId={id} displayName={displayNameFromEmail(user.email)} />;
}
