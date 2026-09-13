import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { AccountClient } from './account-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.account.title };
}

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  // Par quel chemin cette personne se connecte. Utile a afficher : on ne
  // propose pas un mot de passe de la meme facon a quelqu'un qui arrive
  // par Discord.
  const providers = (user.identities ?? []).map((identity) => identity.provider);

  return (
    <AccountClient
      userId={user.id}
      email={user.email ?? ''}
      providers={providers}
      createdAt={user.created_at}
    />
  );
}
