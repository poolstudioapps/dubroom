import { redirect } from 'next/navigation';

import { ScenePage } from '@/components/scene-page';
import type { SceneScreen } from '@/lib/routes';
import { currentUser } from '@/lib/supabase/server';
import { displayNameFromEmail } from '@/lib/utils';

/**
 * Partie serveur commune aux six routes d'une scene : verification de la
 * session utilisateur, puis passage de relais au client.
 */
export async function SceneRoute({
  code,
  expect,
  wide,
  fill,
  children,
}: {
  code: string;
  expect: SceneScreen;
  wide?: boolean;
  fill?: boolean;
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <ScenePage
      code={code}
      userId={user.id}
      defaultName={displayNameFromEmail(user.email)}
      expect={expect}
      wide={wide}
      fill={fill}
    >
      {children}
    </ScenePage>
  );
}
