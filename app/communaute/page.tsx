import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CommunityClient } from './community-client';

export default async function CommunityPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fcommunaute');

  return <CommunityClient displayName={displayNameFromEmail(user.email)} />;
}
