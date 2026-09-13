import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { NewSessionForm } from './new-session-form';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ pour?: string }>;
}): Promise<Metadata> {
  const [params, t] = await Promise.all([searchParams, getDictionary()]);
  return { title: params.pour === 'communaute' ? t.create.communityTitle : t.create.title };
}

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ pour?: string }>;
}) {
  const [user, params] = await Promise.all([currentUser(), searchParams]);
  if (!user) redirect('/login');

  return (
    <NewSessionForm
      displayName={displayNameFromEmail(user.email)}
      pourCommunaute={params.pour === 'communaute'}
    />
  );
}
