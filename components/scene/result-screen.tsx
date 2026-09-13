'use client';

import { useEffect, useState } from 'react';
import { Clock, Hourglass } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { ExportCard } from '@/components/scene/export-card';
import { PublishCard } from '@/components/scene/publish-card';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Card, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { useRenderUrl } from '@/lib/data';

/**
 * Les minutes qui restent avant la suppression du rendu.
 *
 * Revue toutes les vingt secondes : la minute est la bonne unite, et
 * l'ecran reste ouvert pendant qu'on regarde la scene.
 */
function useMinutesRestantes(echeance: string | null): number | null {
  const calculer = () =>
    echeance ? Math.ceil((new Date(echeance).getTime() - Date.now()) / 60_000) : null;
  const [minutes, setMinutes] = useState(calculer);

  useEffect(() => {
    setMinutes(calculer());
    if (!echeance) return;
    const minuteur = window.setInterval(() => setMinutes(calculer()), 20_000);
    return () => window.clearInterval(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echeance]);

  return minutes;
}

/**
 * Le resultat.
 *
 * Le rendu ne reste qu'une heure : rien n'est garde sur nos serveurs au
 * dela. L'ecran le dit avant tout le reste, avec le temps qui reste, et
 * une fois l'heure passee il dit ce qui s'est passe plutot que de laisser
 * tourner un lecteur vide.
 */
export function ResultScreen() {
  const t = useT();

  const { session, characters, participants } = useSceneCtx();
  const url = useRenderUrl(session);
  const minutes = useMinutesRestantes(session.render_expires_at);
  const supprime = !session.render_path;

  const nameOf = (participantId: string | null) =>
    participants.find((p) => p.id === participantId)?.display_name ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="titre text-3xl">
          {session.title ?? t.result.title}
        </h1>
        <p className="text-sm text-text-faint">{t.result.shareHint}</p>
      </header>

      {!supprime && minutes !== null ? (
        <Alert tone="warn" className="flex items-start gap-2">
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {minutes > 1 ? t.result.expiresIn(`${minutes} min`) : t.result.expiresSoon}
          </span>
        </Alert>
      ) : null}

      {supprime ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Clock className="h-8 w-8 text-text-faint" aria-hidden />
          <h2 className="text-lg font-bold">{t.result.expiredTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed text-text-muted">
            {t.result.expiredBody}
          </p>
        </Card>
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-black">
            {url.data ? (
              // Aucun sous-titre incruste, aucune piste de sous-titres :
              // le MP4 ne contient que l'image et l'audio remixe (PRD §12.5).
              <video src={url.data} controls playsInline className="aspect-video w-full" />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <Spinner />
              </div>
            )}
          </div>

          {/* Les deux formats et le partage vivent dans leur propre carte. */}
          <ExportCard />
        </>
      )}

      {/* La question du partage vient juste apres la scene, pendant qu'on
          l'a encore sous les yeux : plus bas, elle passait inapercue. */}
      <PublishCard ask />

      <Card className="space-y-3">
        <h2 className="text-sm font-bold">{t.result.cast}</h2>
        <ul className="space-y-1.5">
          {characters.map((character) => (
            <li key={character.id} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: characterColorVar(character.color) }}
                aria-hidden
              />
              <span className="font-medium">{character.name}</span>
              <span className="text-text-faint">
                {character.is_released
                  ? t.result.voiceOriginal
                  : (nameOf(character.assigned_to) ?? t.result.voiceOriginal)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {session.purged_at && !supprime ? (
        <p className="text-xs leading-relaxed text-text-faint">
          {t.result.sourcePurged}
        </p>
      ) : null}
    </div>
  );
}
