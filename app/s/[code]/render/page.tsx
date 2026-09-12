import { SceneRoute } from '@/components/scene-route';
import { RenderScreen } from '@/components/scene/render-screen';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="render">
      <RenderScreen />
    </SceneRoute>
  );
}
