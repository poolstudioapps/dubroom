'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { FileVideo, Link2 } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { Alert, Button, Card, Input, Label, Progress } from '@/components/ui';
import { MAX_UPLOAD_BYTES, MAX_VIDEO_DURATION_MS } from '@/config/constants';
import { formatBytes, t } from '@/config/strings';
import { createSession, enqueueIngest, uploadSourceAndEnqueue } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { cn } from '@/lib/utils';

type Mode = 'upload' | 'youtube';

/** Lit la duree d'un fichier video sans le televerser (PRD §6.2). */
function probeDurationMs(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration * 1000 : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}

export function NewSessionForm({ displayName }: { displayName: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('upload');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function pickFile(picked: File | null) {
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (!picked.type.startsWith('video/') && !picked.name.match(/\.(mp4|mkv|mov|webm|avi)$/i)) {
      setError(t.create.wrongType);
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setError(t.create.fileTooLarge);
      return;
    }
    const duration = await probeDurationMs(picked);
    if (duration && duration > MAX_VIDEO_DURATION_MS) {
      setError(t.create.durationWarning);
      return;
    }
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  }

  const submit = useMutation({
    mutationFn: async () => {
      setError(null);
      const session = await createSession({
        title: title.trim() || 'Scène sans titre',
        sourceType: mode,
        sourceRef: mode === 'youtube' ? youtubeUrl.trim() : undefined,
        displayName,
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

  const canSubmit = mode === 'upload' ? !!file : youtubeUrl.trim().length > 10;

  return (
    <AppShell className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t.create.title}</h1>

      <div className="flex gap-2">
        <Button
          variant={mode === 'upload' ? 'primary' : 'secondary'}
          onClick={() => setMode('upload')}
        >
          <FileVideo className="h-4 w-4" aria-hidden />
          {t.create.tabUpload}
        </Button>
        <Button
          variant={mode === 'youtube' ? 'primary' : 'secondary'}
          onClick={() => setMode('youtube')}
        >
          <Link2 className="h-4 w-4" aria-hidden />
          {t.create.tabYoutube}
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t.create.titleLabel}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.create.titlePlaceholder}
          />
        </div>

        {mode === 'upload' ? (
          <div className="space-y-2">
            <input
              ref={fileInput}
              type="file"
              accept="video/*,.mkv"
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
                'flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-sm text-text-faint',
                'hover:border-border-strong hover:text-text-muted',
                file && 'border-accent/60 text-text',
              )}
            >
              {file ? (
                <>
                  <span className="font-medium">{file.name}</span>
                  <span className="text-xs">{formatBytes(file.size)}</span>
                </>
              ) : (
                t.create.dropzone
              )}
            </button>
            <Alert>{t.create.multiTrackWarning}</Alert>
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
            <Alert tone="warn">{t.create.youtubeWarning}</Alert>
          </div>
        )}

        {progress !== null ? (
          <div className="space-y-1">
            <Progress value={progress} indeterminate={progress === 0} />
            <p className="text-xs text-text-faint">{t.create.uploading}</p>
          </div>
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
    </AppShell>
  );
}
