import { SceneRoute } from '@/components/scene-route';
import { IngestScreen } from '@/components/scene/ingest-screen';

/**
 * Point d'entree d'un lien partage. On ne connait pas encore le statut
 * de la scene ici : ScenePage le lit puis redirige vers le bon ecran.
 */
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
