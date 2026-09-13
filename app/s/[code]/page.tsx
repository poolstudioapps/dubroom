import { SceneRoute } from '@/components/scene-route';

/**
 * Point d'entree d'un lien partage.
 *
 * Il n'affiche aucun ecran : il lit le statut de la scene et envoie
 * directement sur le bon. Il montrait l'ecran de preparation le temps de
 * rediriger, ce qui faisait passer une scene en studio pour une scene
 * encore en cours d'import.
 */
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <SceneRoute code={code} expect={null}>
      {null}
    </SceneRoute>
  );
}
