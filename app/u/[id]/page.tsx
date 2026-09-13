import { notFound, redirect } from 'next/navigation';

import { APP_NAME } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CreatorProfileClient } from './creator-profile-client';

export const metadata = { title: `Profil · ${APP_NAME}`, robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Le profil public d'un createur : ses scenes, ses votes, son fil. */
export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/u/${id}`)}`);

  return <CreatorProfileClient userId={id} displayName={displayNameFromEmail(user.email)} />;
}
