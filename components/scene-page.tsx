'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { Alert, Button, Card, Input, Label, Spinner } from '@/components/ui';

import { joinSession } from '@/lib/actions';
import { useScene, type SceneData } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { useMyProfile } from '@/lib/profile';
import { supabaseBrowser } from '@/lib/supabase/client';
import { sceneHref, screenForStatus, type SceneScreen } from '@/lib/routes';

interface SceneContextValue extends SceneData {
  userId: string;
  isHost: boolean;
  refetch: () => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useSceneCtx(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error('useSceneCtx hors de ScenePage');
  return value;
}

/**
 * Enveloppe commune aux six ecrans d'une scene.
 *
 * Elle traite trois choses que chaque ecran aurait sinon dupliquees :
 * l'arrivee d'un joueur qui n'est pas encore participant, le maintien de
 * l'ecran en phase avec le statut de la session, et l'exclusion.
 */
export function ScenePage({
  code,
  userId,
  defaultName,
  expect,
  wide,
  fill,
  children,
}: {
  code: string;
  userId: string;
  defaultName: string;
  /** L'ecran de cette route, ou `null` pour l'entree qui ne fait que rediriger. */
  expect: SceneScreen | null;
  wide?: boolean;
  fill?: boolean;
  children: React.ReactNode;
}) {
  const t = useT();

  const router = useRouter();
  const qc = useQueryClient();

  // RLS masque la session tant qu'on n'est pas participant : une reponse
  // vide n'est donc pas une erreur, c'est l'invitation a rejoindre.
  const lookup = useQuery({
    queryKey: ['session-by-code', code],
    queryFn: async () => {
      const { data, error } = await supabaseBrowser()
        .from('sessions')
        .select('id')
        .eq('code', code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return (data as { id: string } | null)?.id ?? null;
    },
  });

  const sessionId = lookup.data ?? '';
  const scene = useScene(sessionId, userId);

  const status = scene.data?.session.status;
  const isHost = scene.data?.session.host_id === userId;
  const target = status ? screenForStatus(status, isHost) : null;

  /*
   * Un studio ferme pour inactivite renvoie a l'accueil.
   *
   * Vingt minutes sans une prise et la base le ferme : rester sur un
   * studio ou plus rien ne s'enregistre serait un piege. L'accueil dit
   * pourquoi, dans une fenetre.
   */
  const expiree = status === 'recording' && !!scene.data?.session.closed_at;
  useEffect(() => {
    if (expiree) router.replace('/?expiree=1');
  }, [expiree, router]);

  useEffect(() => {
    if (expiree) return;
    if (target && target !== expect) router.replace(sceneHref(code, target));
  }, [target, expect, code, router, expiree]);

  /*
   * Tant qu'on n'est pas sur le bon ecran, on n'en montre aucun.
   *
   * L'ecran demande s'affichait le temps que la redirection parte : un
   * lien de scene ouvrait une seconde la preparation d'une scene deja en
   * studio, et un lobby qui passait en enregistrement restait visible,
   * boutons compris, pendant qu'on changeait de page. On voyait des pages
   * qui n'avaient plus rien a faire la.
   */
  if (
    expiree ||
    lookup.isLoading ||
    (sessionId && scene.isLoading) ||
    (target && target !== expect)
  ) {
    return (
      <AppShell wide={wide}>
        <div className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </div>
      </AppShell>
    );
  }

  if (!sessionId) {
    return (
      <AppShell>
        <JoinForm code={code} defaultName={defaultName} />
      </AppShell>
    );
  }

  if (scene.error || !scene.data) {
    return (
      <AppShell>
        <Alert tone="danger">{humanizeError(scene.error)}</Alert>
      </AppShell>
    );
  }

  if (scene.data.me?.is_kicked) {
    return (
      <AppShell>
        <Alert tone="danger">{t.studio.kicked}</Alert>
      </AppShell>
    );
  }

  const value: SceneContextValue = {
    ...scene.data,
    userId,
    isHost,
    refetch: () => void qc.invalidateQueries({ queryKey: ['scene', sessionId] }),
  };

  return (
    <SceneContext.Provider value={value}>
      <AppShell wide={wide} fill={fill}>
        {children}
      </AppShell>
    </SceneContext.Provider>
  );
}

/**
 * Entrer dans une scene par son lien.
 *
 * On entre directement, sous le pseudo du profil : demander de confirmer
 * un nom deja choisi une fois pour toutes faisait un ecran de plus a
 * chaque invitation. Le formulaire ne revient que si l'entree echoue —
 * salon ferme, code inconnu —, pour dire pourquoi et laisser reessayer.
 */
function JoinForm({ code, defaultName }: { code: string; defaultName: string }) {
  const t = useT();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const tente = useRef(false);

  const join = useMutation({
    mutationFn: (nom: string) => joinSession(code, nom.trim() || defaultName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-by-code', code] }),
    onError: (e) => setError(humanizeError(e)),
  });

  useEffect(() => {
    if (tente.current || profile.isLoading) return;
    tente.current = true;
    const pseudo = profile.data?.display_name?.trim() || defaultName;
    setName(pseudo);
    join.mutate(pseudo);
  }, [profile.isLoading, profile.data?.display_name, defaultName, join]);

  if (!error) {
    return (
      <Card className="mx-auto flex max-w-sm items-center justify-center gap-3 py-8 text-sm text-text-muted">
        <Spinner />
        {t.sessions.joining}
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="titre text-2xl">{t.sessions.joinTitle}</h1>
        <p className="text-sm text-text-faint">
          {t.sessions.joinCode} <span className="font-mono uppercase">{code}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Ton nom, pour que les autres te reconnaissent</Label>
        <Input
          id="name"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button
        variant="primary"
        className="w-full"
        loading={join.isPending}
        onClick={() => {
          setError(null);
          join.mutate(name);
        }}
      >
        Rejoindre
      </Button>
    </Card>
  );
}
