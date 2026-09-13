import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser, supabaseServer } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { PackDetailClient } from './pack-detail-client';

/** L'onglet porte le titre de la scene. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const [{ id }, supabase, t] = await Promise.all([params, supabaseServer(), getDictionary()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('packs').select('title').eq('id', id).maybeSingle();
  const titre = (data as { title?: string } | null)?.title;
  return { title: titre ?? t.nav.community };
}

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
