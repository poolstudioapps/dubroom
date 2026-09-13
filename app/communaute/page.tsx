import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CommunityClient } from './community-client';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [user, params] = await Promise.all([currentUser(), searchParams]);
  const q = Array.isArray(params.q) ? (params.q[0] ?? '') : (params.q ?? '');
  if (!user) {
    const suite = q ? `/communaute?q=${encodeURIComponent(q)}` : '/communaute';
    redirect(`/login?next=${encodeURIComponent(suite)}`);
  }

  return <CommunityClient displayName={displayNameFromEmail(user.email)} initialQuery={q} />;
}
