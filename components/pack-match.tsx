'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Clapperboard, Sparkles } from 'lucide-react';

import { PackStartDialog } from '@/components/pack-start-dialog';
import { Badge, Button, Card, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatDuration, formatTimecode } from '@/config/strings';
import { useT } from '@/lib/i18n';
import { PACKS_QUERY, listPackLines } from '@/lib/packs';
import { videoId } from '@/components/url-preview';

/**
 * Cette scene existe deja.
 *
 * Quand le lien colle pointe vers une video que le groupe a deja
 * preparee, tout refaire coute plusieurs minutes d'attente, une
 * separation et une transcription — pour un resultat qui sera le meme,
 * ou presque.
 *
 * « Ou presque » est la raison d'etre du bouton de droite. Le texte du
 * pack est celui qu'une autre personne a corrige : elle a pu le tronquer,
 * fusionner deux personnages, ou ecrire n'importe quoi. On propose donc,
 * on n'impose pas — et pour choisir en connaissance de cause, on montre
 * d'abord les repliques telles qu'il faudra les dire.
 *
 * Reprendre la scene ouvre le meme choix que le catalogue : importer la
 * video soi-meme, ou la laisser telecharger par le PC de l'hote.
 */
export function PackMatch({
  url,
  displayName,
  onDismiss,
}: {
  url: string;
  displayName: string;
  onDismiss: () => void;
}) {
  const t = useT();
  const [ouvert, setOuvert] = useState(false);

  /*
   * Le meme cache que le catalogue, et donc la meme fonction.
   *
   * Une seconde fonction sous la meme cle aurait rendu le contenu
   * dependant de l'ecran monte en premier. `retry: false` garde le
   * raccourci discret : un catalogue injoignable fait disparaitre la
   * carte, il n'empeche pas d'importer.
   */
  const packs = useQuery({ ...PACKS_QUERY, retry: false });

  const cible = videoId(url);
  const pack = cible
    ? (packs.data ?? []).find((p) => p.source_url && videoId(p.source_url) === cible)
    : undefined;

  const lignes = useQuery({
    queryKey: ['pack-lines', pack?.id],
    enabled: !!pack,
    queryFn: () => listPackLines(pack!.id),
  });

  if (!pack) return null;

  return (
    <Card className="space-y-3 border-2 border-select">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-select/20 text-select">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-bold">{t.create.matchTitle}</h2>
          <p className="text-xs leading-relaxed text-text-muted">
            {t.create.matchBody}
          </p>
        </div>
      </div>

      <div className="panel space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-bold">{pack.title}</p>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-faint">
            {formatDuration(pack.duration_ms)} ·{' '}
            {t.community.lineCount(pack.line_count)}
            <Badge>{t.community.genreNames[pack.genre]}</Badge>
          </span>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {pack.characters.map((character) => (
            <li
              key={character.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-bold"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: characterColorVar(character.color) }}
                aria-hidden
              />
              {character.name}
            </li>
          ))}
        </ul>
      </div>

      {/*
        Le texte, avant de decider. Il defile dans sa propre boite : une
        scene de cent repliques ne doit pas repousser les deux boutons
        hors de l'ecran.
      */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-faint">
          {t.create.matchLines}
        </h3>
        {lignes.isLoading ? (
          <Spinner />
        ) : (
          <ul className="max-h-56 space-y-0.5 overflow-y-auto rounded-card bg-surface-sunken p-2 text-sm">
            {(lignes.data ?? []).map((ligne, i) => (
              <li key={`${ligne.start_ms}-${i}`} className="flex gap-2 px-1 py-0.5">
                <span className="w-12 shrink-0 font-mono text-xs text-text-faint">
                  {formatTimecode(ligne.start_ms)}
                </span>
                <span
                  className="w-20 shrink-0 truncate text-xs font-bold"
                  style={{
                    color: `color-mix(in oklch, ${characterColorVar(ligne.characterColor)} 72%, black)`,
                  }}
                >
                  {ligne.characterName}
                </span>
                <span className="min-w-0 flex-1 leading-snug">{ligne.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" className="flex-1" onClick={() => setOuvert(true)}>
          <Clapperboard className="h-4 w-4" aria-hidden />
          {t.create.matchUse}
        </Button>
        <Button variant="secondary" onClick={onDismiss}>
          {t.create.matchScratch}
        </Button>
      </div>

      <PackStartDialog
        pack={ouvert ? pack : null}
        displayName={displayName}
        onClose={() => setOuvert(false)}
      />
    </Card>
  );
}
