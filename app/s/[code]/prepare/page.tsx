import { SceneRoute } from '@/components/scene-route';
import { PrepareScreen } from '@/components/scene/prepare-screen';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="prepare" wide>
      <PrepareScreen />
    </SceneRoute>
  );
}
