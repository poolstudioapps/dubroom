import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { NewSessionForm } from './new-session-form';

export default async function NewSessionPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  return <NewSessionForm displayName={displayNameFromEmail(user.email)} />;
}
