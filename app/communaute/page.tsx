import type { Metadata } from 'next';

import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';
import { CommunityClient } from './community-client';
import { CommunityPreview } from './community-preview';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  // Visible sans compte, mais fermee aux moteurs : voir `INDEXABLE_PATHS`.
  return { title: t.nav.community, description: t.community.subtitle };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [user, params] = await Promise.all([currentUser(), searchParams]);
  const q = Array.isArray(params.q) ? (params.q[0] ?? '') : (params.q ?? '');

  // Sans compte : les scenes les mieux notees, le reste sous un voile.
  if (!user) return <CommunityPreview />;

  return <CommunityClient displayName={displayNameFromEmail(user.email)} initialQuery={q} />;
}
