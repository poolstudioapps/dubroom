import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CommunityClient } from './community-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.nav.community };
}

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
