import { redirect } from 'next/navigation';

import { APP_NAME } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';
import { AccountClient } from './account-client';

export const metadata = { title: `Mon compte · ${APP_NAME}` };

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
