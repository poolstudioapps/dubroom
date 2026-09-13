import { redirect } from 'next/navigation';

import { APP_NAME } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { PackDetailClient } from './pack-detail-client';

export const metadata = { title: `Communauté · ${APP_NAME}` };

/**
 * La page d'une scene du catalogue.
 *
 * Reservee aux invites comme le catalogue lui-meme : le detail d'une
 * scene, c'est son texte, et son texte est celui d'une oeuvre protegee.
 */
export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, { id }] = await Promise.all([currentUser(), params]);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/communaute/${id}`)}`);

  return <PackDetailClient packId={id} displayName={displayNameFromEmail(user.email)} />;
}
