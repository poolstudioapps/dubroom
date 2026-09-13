'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CircleHelp, FileVideo, Library, Link2, Upload } from 'lucide-react';

import { useLocale, useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { PackMatch } from '@/components/pack-match';
import { PackSourcePicker } from '@/components/pack-source-picker';
import { PhaseProgress } from '@/components/scene/phase-progress';
import { SelectMenu } from '@/components/select-menu';
import { Alert, Badge, Button, Card, Input, Label, Toggle } from '@/components/ui';
import { GUIDE_VIDEO_HREF } from '@/config/constants';
import { formatBytes } from '@/config/strings';
import { createSession, enqueueIngest, uploadSourceAndEnqueue } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { PACK_LANGS } from '@/lib/packs';
import { PART_ENVOI } from '@/lib/progress';
import { isAdmin, useMyRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { VIDEO_ACCEPT, checkVideoFile } from '@/lib/video-file';

type Mode = 'upload' | 'pack' | 'youtube';

/**
 * Nouvelle scene.
 *
 * Deux facons de commencer pour tout le monde, dites en clair avant le
 * premier clic : importer sa video pour une scene toute neuve, ou partir
 * d'une scene deja preparee par le groupe en apportant la video. Les deux
 * sont traitees en ligne.
 *
 * Le lien YouTube est une troisieme voie, reservee aux administrateurs :
 * elle passe par le worker du PC de l'hote, le seul que YouTube laisse
 * telecharger. La base refuse ce chemin aux autres (`ADMIN_ONLY`) ; l'ecran
 * ne le montre donc pas, plutot que de proposer un bouton qui echouerait.
 */
export function NewSessionForm({
  displayName,
  pourCommunaute = false,
}: {
  displayName: string;
  /** Arrivee par « Créer un pack pour la communauté ». */
  pourCommunaute?: boolean;
}) {
  const t = useT();
  const locale = useLocale();

  const router = useRouter();
  const role = useMyRole();
  const admin = isAdmin(role.data);
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('upload');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  /**
   * Le raccourci a-t-il ete ecarte ?
   *
   * Une fois qu'on a lu le texte du pack et decide de refaire la scene,
   * la carte n'a plus rien a dire : elle disparait pour ce lien-la, et
   * revient si on en colle un autre.
   */
  const [ecarte, setEcarte] = useState('');
  const [isSong, setIsSong] = useState(false);
  // La langue de l'interface par defaut : c'est le cas de la plupart des
  // scenes. Le champ reste la, bien visible, pour la changer.
  const [langue, setLangue] = useState<string>(
    (PACK_LANGS as readonly string[]).includes(locale) ? locale : '',
  );

  // Un membre sans le role ne reste pas sur un onglet qui n'existe pas
  // pour lui.
  useEffect(() => {
    if (mode === 'youtube' && role.isSuccess && !admin) setMode('upload');
  }, [mode, admin, role.isSuccess]);

  async function pickFile(picked: File | null) {
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    // Les memes controles que le depart d'un pack avec sa propre video,
    // dont la limite de taille du stockage : un fichier trop lourd partait,
    // puis echouait a la fin de l'envoi.
    const { problem } = await checkVideoFile(picked);
    if (problem) {
      setError(
        problem === 'wrongType'
          ? t.create.wrongType
          : problem === 'tooLarge'
            ? t.create.fileTooLarge
            : t.create.durationWarning,
      );
      return;
    }
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  }

  const submit = useMutation({
    mutationFn: async () => {
      setError(null);
      const session = await createSession({
        title: title.trim() || t.common.untitled,
        sourceType: mode === 'youtube' ? 'youtube' : 'upload',
        sourceRef: mode === 'youtube' ? youtubeUrl.trim() : undefined,
        displayName,
        isSong,
        sourceLang: langue,
      });

      if (mode === 'upload') {
        if (!file) throw new Error(t.create.dropzone);
        setProgress(0);
        await uploadSourceAndEnqueue(session, file, setProgress);
      } else {
        await enqueueIngest(session.id, null);
      }
      return session;
    },
    onSuccess: (session) => router.push(`/s/${session.code}`),
    onError: (e) => {
      setProgress(null);
      setError(humanizeError(e));
    },
  });

  const canSubmit = !!langue && (mode === 'upload' ? !!file : youtubeUrl.trim().length > 10);

  const sources: { mode: Mode; icon: typeof FileVideo; label: string }[] = [
    { mode: 'upload', icon: FileVideo, label: t.create.tabUpload },
    { mode: 'pack', icon: Library, label: t.create.tabPack },
    ...(admin ? [{ mode: 'youtube' as const, icon: Link2, label: t.create.tabYoutube }] : []),
  ];

  const intro =
    mode === 'upload'
      ? t.create.introUpload
      : mode === 'pack'
        ? t.create.introPack
        : t.create.introYoutube;

  return (
    <AppShell className="space-y-6 sm:space-y-8">
      <header className="mx-auto w-full max-w-2xl space-y-5 text-center">
        <div className="space-y-2">
          <h1 className="titre text-3xl sm:text-4xl">
            {pourCommunaute ? t.create.communityTitle : t.create.title}
          </h1>
          <p className="text-balance text-sm leading-relaxed text-text-muted">
            {pourCommunaute ? t.create.communityBody : t.create.subtitle}
          </p>
        </div>

        {/* Venue du bouton de la communaute : la suite est dite avant de
            commencer, sinon on cherche en vain un bouton « publier » ici. */}
        {pourCommunaute ? (
          <ol className="panel grid gap-3 p-4 text-left sm:grid-cols-3">
            {t.community.howSteps.map((etape, rang) => (
              <li key={etape.title} className="flex gap-3 sm:flex-col sm:gap-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
                  {rang + 1}
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-bold text-text">{etape.title}</span>
                  <span className="block text-xs leading-relaxed text-text-muted">{etape.body}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {/*
          Un selecteur segmente, pas des boutons : les cases se partagent la
          largeur a parts egales, et sous 640 px l'icone passe au-dessus du
          mot pour que le libelle ne soit jamais coupe.
        */}
        <div
          role="group"
          aria-label={t.create.title}
          className={cn('panel source-onglets', sources.length === 2 && 'source-onglets-deux')}
        >
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <button
                key={source.mode}
                type="button"
                aria-pressed={mode === source.mode}
                onClick={() => setMode(source.mode)}
                className="source-onglet"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{source.label}</span>
                {source.mode === 'youtube' ? (
                  <Badge tone="accent" className="hidden sm:inline-flex">
                    {t.create.adminBadge}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="text-balance text-sm leading-relaxed text-text-faint">{intro}</p>
      </header>

      {/* Le catalogue prend toute la largeur ; un formulaire, non. */}
      {mode === 'pack' ? (
        <PackSourcePicker displayName={displayName} />
      ) : (
        <Card className="mx-auto w-full max-w-xl space-y-5">
          {/* Ce qui va se passer, avant de le lancer : trois etapes, et le
              temps que prend celle qui fait attendre. */}
          {mode === 'upload' ? (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">
                {t.create.uploadStepsTitle}
              </h2>
              <ol className="grid gap-3 sm:grid-cols-3">
                {t.create.uploadSteps.map((etape, rang) => (
                  <li
                    key={etape}
                    className="flex gap-3 text-xs leading-relaxed text-text-muted sm:flex-col sm:gap-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
                      {rang + 1}
                    </span>
                    <span>{etape}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="title">{t.create.titleLabel}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.create.titlePlaceholder}
            />
          </div>

          {/*
            La langue, demandee des le depart : elle regle la transcription
            et, une fois la scene publiee, son filtre dans la communaute.
            Demandee seulement a la publication, elle arrivait trop tard
            pour la premiere et etait souvent laissee au hasard.
          */}
          <div className="space-y-1.5">
            <Label>{t.create.langLabel}</Label>
            <SelectMenu
              label={t.create.langLabel}
              value={langue}
              placeholder={t.community.pickLang}
              onChange={setLangue}
              options={PACK_LANGS.map((code) => ({
                value: code as string,
                label: t.community.langNames[code] ?? code,
              }))}
            />
            <p className="text-xs text-text-faint">{t.create.langHelp}</p>
          </div>

          {mode === 'upload' ? (
            <div className="space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept={VIDEO_ACCEPT}
                className="hidden"
                onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  'flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong px-4 text-center text-sm text-text-muted transition-colors',
                  'hover:border-select hover:bg-select/5 hover:text-text',
                  file && 'border-select bg-select/10 text-text',
                )}
              >
                {file ? (
                  <>
                    <FileVideo className="h-7 w-7 text-select" aria-hidden />
                    <span className="break-all font-bold">{file.name}</span>
                    <span className="text-xs text-text-faint">
                      {formatBytes(file.size)}
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-7 w-7 text-text-faint" aria-hidden />
                    <span>{t.create.dropzone}</span>
                    <span className="text-xs text-text-faint">{t.create.limits}</span>
                  </>
                )}
              </button>
              {/* Une precision, pas un avertissement : le cadre en tiretes
                la faisait lire comme un probleme a regler. */}
              <p className="text-xs leading-relaxed text-text-faint">
                {t.create.multiTrackWarning}
              </p>
              <Link
                href={GUIDE_VIDEO_HREF}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-link hover:underline"
              >
                <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                {t.guide.createLink}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="yt">{t.create.youtubeLabel}</Label>
                <Input
                  id="yt"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder={t.create.youtubePlaceholder}
                />
              </div>

              {/*
                Le lien pointe peut-etre vers une scene deja preparee. Si
                c'est le cas, on le dit avant de lancer plusieurs minutes
                de traitement pour refaire ce qui existe.
              */}
              {youtubeUrl.trim() && ecarte !== youtubeUrl.trim() ? (
                <PackMatch
                  url={youtubeUrl.trim()}
                  displayName={displayName}
                  onDismiss={() => setEcarte(youtubeUrl.trim())}
                />
              ) : null}

              <Alert tone="warn">{t.create.youtubeWarning}</Alert>
              <Link
                href={GUIDE_VIDEO_HREF}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-link hover:underline"
              >
                <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                {t.guide.createLink}
              </Link>
            </div>
          )}

          {/*
            Une reprise ne se prepare pas comme une scene de film : il n'y
            a rien a transcrire, et le decoupage suit la voix du morceau.
            La question se pose ici, avant le traitement, parce qu'apres
            il est trop tard et qu'on aura paye la transcription pour
            rien.
          */}
          <div className="panel flex items-start gap-3 p-3">
            <Toggle checked={isSong} onChange={setIsSong} label={t.create.songLabel} />
            <div className="space-y-0.5">
              <p className="text-sm font-bold">{t.create.songLabel}</p>
              <p className="text-xs text-text-faint">{t.create.songHelp}</p>
            </div>
          </div>

          {/* Plus de case « garder la scene » ici : elle publiait sans
            langue ni genre. On publie apres le rendu, criteres compris. */}
          <p className="text-xs text-text-faint">{t.create.shareLater}</p>

          {/* La meme barre que la preparation : l'envoi en occupe le debut,
              et l'ecran suivant reprend la ou celle-ci s'arrete. */}
          {progress !== null ? (
            <PhaseProgress
              titre={t.progress.preparing}
              phase={t.progress.phases.upload}
              valeur={(progress * PART_ENVOI) / 100}
            />
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Button
            variant="primary"
            className="w-full"
            disabled={!canSubmit}
            loading={submit.isPending}
            onClick={() => submit.mutate()}
          >
            {mode === 'upload' ? t.create.submitUpload : t.create.submitYoutube}
          </Button>
        </Card>
      )}
    </AppShell>
  );
}
