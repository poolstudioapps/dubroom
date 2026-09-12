'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { Alert, Button, Card, Input, Label, Spinner } from '@/components/ui';

import { joinSession } from '@/lib/actions';
import { useScene, type SceneData } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
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
  expect: SceneScreen;
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

  useEffect(() => {
    if (!status || !scene.data) return;
    const target = screenForStatus(status, isHost);
    if (target !== expect) router.replace(sceneHref(code, target));
  }, [status, isHost, expect, code, router, scene.data]);

  if (lookup.isLoading || (sessionId && scene.isLoading)) {
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

function JoinForm({ code, defaultName }: { code: string; defaultName: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  const join = useMutation({
    mutationFn: () => joinSession(code, name.trim() || defaultName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session-by-code', code] }),
    onError: (e) => setError(humanizeError(e)),
  });

  return (
    <Card className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Rejoindre la scène</h1>
        <p className="text-sm text-text-faint">
          Code <span className="font-mono uppercase">{code}</span>
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
          join.mutate();
        }}
      >
        Rejoindre
      </Button>
    </Card>
  );
}
