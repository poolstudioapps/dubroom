import { SceneRoute } from '@/components/scene-route';
import { StudioScreen } from '@/components/scene/studio-screen';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="studio" wide fill>
      <StudioScreen />
    </SceneRoute>
  );
}
