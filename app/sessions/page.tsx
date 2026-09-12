import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { SessionsClient } from './sessions-client';

export default async function SessionsPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <SessionsClient userId={user.id} displayName={displayNameFromEmail(user.email)} />
  );
}
