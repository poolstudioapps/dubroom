import { SceneRoute } from '@/components/scene-route';
import { LobbyScreen } from '@/components/scene/lobby-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="lobby">
      <LobbyScreen />
    </SceneRoute>
  );
}
