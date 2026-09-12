import { SceneRoute } from '@/components/scene-route';
import { ResultScreen } from '@/components/scene/result-screen';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect="result">
      <ResultScreen />
    </SceneRoute>
  );
}
