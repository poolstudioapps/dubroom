import { SceneRoute } from '@/components/scene-route';
import { IngestScreen } from '@/components/scene/ingest-screen';

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="ingest">
      <IngestScreen />
    </SceneRoute>
  );
}
