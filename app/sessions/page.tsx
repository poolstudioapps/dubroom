import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { SessionsClient } from './sessions-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.nav.sessions };
}

export default async function SessionsPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <SessionsClient userId={user.id} displayName={displayNameFromEmail(user.email)} />
  );
}
