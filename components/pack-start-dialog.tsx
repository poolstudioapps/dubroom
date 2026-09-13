'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CircleHelp, ExternalLink, FileVideo, MonitorDown, Upload } from 'lucide-react';

import { PhaseProgress } from '@/components/scene/phase-progress';
import { Alert, Badge, Button, Dialog } from '@/components/ui';
import { GUIDE_VIDEO_HREF } from '@/config/constants';
import { formatBytes, formatDuration } from '@/config/strings';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { startFromPack, startFromPackWithFile, type Pack } from '@/lib/packs';
import { useMyProfile } from '@/lib/profile';
import { PART_ENVOI } from '@/lib/progress';
import { isAdmin, useMyRole } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { checkVideoFile } from '@/lib/video-file';

/**
 * L'ecart de duree au-dela duquel on previent.
 *
 * Un meme extrait, recupere par deux outils differents, peut differer de
 * quelques centaines de millisecondes. Au-dela de deux secondes, c'est
 * une autre mise en ligne, une introduction en plus ou une fin coupee :
 * les repliques du pack tomberaient a cote.
 */
const ECART_TOLERE_MS = 2000;

/**
 * Doubler une scene du catalogue : d'ou vient la video ?
 *
 * Une scene publiee ne garde que son lien YouTube et sa preparation. Il
 * y avait un seul chemin, le telechargement par le PC de l'hote, et il
 * echouait en silence des que personne n'avait lance le worker. Il y en
 * a deux, et le plus sur est propose en premier : le joueur apporte le
 * fichier, et tout se prepare en ligne.
 *
 * On montre la duree attendue avant le choix du fichier, et on compare
 * apres : c'est la seule chose qui dise, sans rien lancer, qu'il s'agit
 * bien de la meme video.
 */
export function PackStartDialog({
  pack,
  displayName,
  onClose,
}: {
  pack: Pack | null;
  displayName: string;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const profile = useMyProfile();
  // Le telechargement automatique passe par le PC de l'hote : il n'est
  // propose qu'aux administrateurs, les seuls que la base y autorise.
  const role = useMyRole();
  const admin = isAdmin(role.data);
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [duree, setDuree] = useState<number | null>(null);
  const [verification, setVerification] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Une autre scene, un autre fichier : rien ne passe d'une ouverture a
  // la suivante.
  useEffect(() => {
    setFile(null);
    setDuree(null);
    setProgress(null);
    setError(null);
  }, [pack?.id]);

  const nom = profile.data?.display_name ?? displayName;

  const auto = useMutation({
    mutationFn: (p: Pack) => startFromPack(p.id, nom),
    onSuccess: (session) => router.push(`/s/${session.code}/lobby`),
    onError: (e) => setError(humanizeError(e)),
  });

  const avecFichier = useMutation({
    mutationFn: ({ p, f }: { p: Pack; f: File }) =>
      startFromPackWithFile(p, f, nom, setProgress),
    onSuccess: (session) => router.push(`/s/${session.code}`),
    onError: (e) => {
      setProgress(null);
      setError(humanizeError(e));
    },
  });

  const occupe = auto.isPending || avecFichier.isPending;

  async function choisir(picked: File | null) {
    setError(null);
    setFile(null);
    setDuree(null);
    if (!picked) return;

    setVerification(true);
    const { problem, durationMs } = await checkVideoFile(picked);
    setVerification(false);

    if (problem === 'wrongType') {
      setError(t.create.wrongType);
    } else if (problem === 'tooLarge') {
      setError(t.packStart.tooLarge);
    } else if (problem === 'tooLong') {
      setError(t.create.durationWarning);
    } else {
      setFile(picked);
      setDuree(durationMs);
    }
  }

  const recette = pack?.kind === 'url';
  const ecart = pack && file && duree ? Math.abs(duree - pack.duration_ms) : 0;

  return (
    <Dialog
      open={!!pack}
      onClose={occupe ? () => undefined : onClose}
      title={pack?.title ?? ''}
    >
      {pack ? (
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          {!recette ? (
            <>
              <p className="leading-relaxed">{t.packStart.mediaBody}</p>
              <Button
                variant="primary"
                className="w-full"
                loading={auto.isPending}
                onClick={() => auto.mutate(pack)}
              >
                {t.community.play}
              </Button>
            </>
          ) : (
            <>
              <p className="leading-relaxed">
                {admin ? t.packStart.intro : t.packStart.introMember}
              </p>

              {/* ── Premier chemin : le fichier ─────────────────────── */}
              <section className="panel space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-text">
                    <FileVideo className="h-4 w-4 text-link" aria-hidden />
                    {t.packStart.fileTitle}
                  </h3>
                  {admin ? <Badge tone="accent">{t.packStart.recommended}</Badge> : null}
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {t.packStart.fileBody}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {pack.source_url ? (
                    <a
                      href={pack.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-bold text-link hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {t.packStart.openSource}
                    </a>
                  ) : null}
                  {/* Dans un nouvel onglet : le fichier deja choisi et la
                      scene ouverte ne doivent pas se perdre pour lire le guide. */}
                  <Link
                    href={GUIDE_VIDEO_HREF}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-bold text-link hover:underline"
                  >
                    <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                    {t.packStart.howTo}
                  </Link>
                </div>

                <input
                  ref={fileInput}
                  type="file"
                  accept="video/*,.mkv"
                  className="hidden"
                  onChange={(e) => {
                    void choisir(e.target.files?.[0] ?? null);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void choisir(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={cn(
                    'flex min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border-strong px-3 py-4 text-center text-sm text-text-muted transition-colors',
                    'hover:border-select hover:bg-select/5 hover:text-text disabled:opacity-60',
                    file && 'border-select bg-select/10 text-text',
                  )}
                >
                  {file ? (
                    <>
                      <span className="break-all font-bold">{file.name}</span>
                      <span className="text-xs text-text-faint">
                        {formatBytes(file.size)}
                        {duree ? ` · ${formatDuration(duree)}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-text-faint" aria-hidden />
                      <span>{verification ? t.common.loading : t.packStart.drop}</span>
                      <span className="text-xs text-text-faint">
                        {t.packStart.expected(formatDuration(pack.duration_ms))}
                      </span>
                    </>
                  )}
                </button>

                {file && ecart > ECART_TOLERE_MS ? (
                  <Alert tone="warn">
                    {t.packStart.mismatch(
                      formatDuration(pack.duration_ms),
                      formatDuration(duree ?? 0),
                    )}
                  </Alert>
                ) : null}

                {progress !== null ? (
                  <PhaseProgress
                    titre={t.progress.preparing}
                    phase={t.progress.phases.upload}
                    valeur={(progress * PART_ENVOI) / 100}
                  />
                ) : null}

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={!file || auto.isPending}
                  loading={avecFichier.isPending}
                  onClick={() => file && avecFichier.mutate({ p: pack, f: file })}
                >
                  {t.packStart.fileSubmit}
                </Button>
              </section>

              {admin ? (
                <>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-text-faint">
                <span className="h-px flex-1 bg-border" aria-hidden />
                {t.packStart.or}
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              {/* ── Second chemin : le PC de l'hote ─────────────────── */}
              {/* Le texte garde une largeur minimale : sans elle, sur
                  telephone, il se reduisait a un mot par ligne plutot que de
                  laisser le bouton passer dessous. */}
              <section className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-[13rem] flex-1 space-y-0.5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-text">
                    <MonitorDown className="h-4 w-4 text-text-faint" aria-hidden />
                    {t.packStart.autoTitle}
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    {t.packStart.autoBody}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={avecFichier.isPending}
                  loading={auto.isPending}
                  onClick={() => auto.mutate(pack)}
                >
                  {t.packStart.autoSubmit}
                </Button>
              </section>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
