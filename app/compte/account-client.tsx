'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  HardDrive,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { Avatar } from '@/components/avatar';
import { GuestListCard } from '@/components/guest-list-card';
import { PasswordCard } from '@/components/password-card';
import {
  Alert,
  Badge,
  Button,
  Card,
  Disclosure,
  Input,
  Label,
  Progress,
  Spinner,
} from '@/components/ui';
import { STORAGE_QUOTA_BYTES } from '@/config/constants';
import { formatBytes } from '@/config/strings';
import { useStorageUsage } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import {
  profileKeys,
  pruneAvatars,
  uploadAvatar,
  useMyProfile,
  useUpdateProfile,
} from '@/lib/profile';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Mon compte.
 *
 * Rassemble ce qui etait eparpille : le pseudo etait devine depuis
 * l'adresse e-mail et invisible, le mot de passe et la liste d'invites
 * vivaient dans « Mes scenes », et la photo n'existait pas.
 *
 * L'ordre suit ce qu'on vient y faire : d'abord qui je suis, ensuite
 * comment j'entre, enfin ce que ca occupe.
 */
export function AccountClient({
  userId,
  email,
  providers,
  createdAt,
}: {
  userId: string;
  email: string;
  providers: string[];
  createdAt?: string;
}) {
  const t = useT();

  const router = useRouter();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const usage = useStorageUsage();

  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const current = profile.data;
  const displayName = name ?? current?.display_name ?? '';

  const photo = useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadAvatar(userId, file);
      await update.mutateAsync({ avatarPath: path });
      // L'ancienne photo n'a plus de raison d'occuper le bucket.
      await pruneAvatars(userId, path);
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const removePhoto = useMutation({
    mutationFn: async () => {
      await update.mutateAsync({ avatarPath: null });
      await pruneAvatars(userId, null);
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const saveName = useMutation({
    mutationFn: () => update.mutateAsync({ displayName: displayName.trim() }),
    onSuccess: () => {
      setSaved(true);
      setName(null);
      void qc.invalidateQueries({ queryKey: profileKeys.me });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const used = usage.data ?? 0;
  const dirty = name !== null && name.trim() !== current?.display_name;
  const viaDiscord = providers.includes('discord');

  return (
    <AppShell className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="titre text-3xl">
          {t.account.title}
        </h1>
        <p className="text-sm text-text-muted">{t.account.subtitle}</p>
      </header>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {profile.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </div>
      ) : null}

      {/* ── Qui je suis ──────────────────────────────────────────────── */}
      {current ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={displayName} path={current.avatar_path} size="lg" />

            <div className="space-y-2">
              <p className="text-sm font-bold">{t.account.photo}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={photo.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {current.avatar_path ? t.account.photoChange : t.account.photoAdd}
                </Button>
                {current.avatar_path ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={removePhoto.isPending}
                    onClick={() => {
                      setError(null);
                      removePhoto.mutate();
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {t.account.photoRemove}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-text-faint">{t.account.photoHelp}</p>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setError(null);
                photo.mutate(file);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pseudo">{t.account.displayName}</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="pseudo"
                value={displayName}
                maxLength={40}
                className="min-w-48 flex-1"
                onChange={(e) => {
                  setSaved(false);
                  setName(e.target.value);
                }}
              />
              <Button
                variant="primary"
                disabled={!dirty || !displayName.trim()}
                loading={saveName.isPending}
                onClick={() => {
                  setError(null);
                  saveName.mutate();
                }}
              >
                {t.common.save}
              </Button>
            </div>
            <p className="text-xs text-text-faint">{t.account.displayNameHelp}</p>
            {saved ? <Alert tone="ok">{t.account.saved}</Alert> : null}
          </div>
        </Card>
      ) : null}

      {/* ── Comment j'entre ──────────────────────────────────────────── */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-text-muted" aria-hidden />
          <h2 className="text-sm font-bold">{t.account.accessTitle}</h2>
        </div>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-text-faint">{t.account.email}</dt>
          <dd className="font-medium break-all">{email}</dd>

          <dt className="text-text-faint">{t.account.method}</dt>
          <dd className="flex flex-wrap gap-1.5">
            <Badge tone={viaDiscord ? 'accent' : 'neutral'}>
              {viaDiscord ? 'Discord' : t.account.methodEmail}
            </Badge>
          </dd>

          {createdAt ? (
            <>
              <dt className="text-text-faint">{t.account.since}</dt>
              <dd className="font-medium">
                {new Date(createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </>
          ) : null}
        </dl>

        <p className="text-xs leading-relaxed text-text-faint">
          {t.account.emailLocked}
        </p>
      </Card>

      <Disclosure
        title={t.auth.passwordSectionTitle}
        icon={<KeyRound className="h-4 w-4" aria-hidden />}
      >
        <PasswordCard bare />
      </Disclosure>

      <Disclosure
        title={t.guests.title}
        icon={<UserPlus className="h-4 w-4" aria-hidden />}
      >
        <GuestListCard bare />
      </Disclosure>

      <Disclosure
        title={t.sessions.storageTitle}
        icon={<HardDrive className="h-4 w-4" aria-hidden />}
        hint={t.sessions.storageUsed(
          formatBytes(used),
          formatBytes(STORAGE_QUOTA_BYTES),
        )}
      >
        <Progress value={Math.round((used / STORAGE_QUOTA_BYTES) * 100)} />
        <p className="text-xs leading-relaxed text-text-faint">
          {t.sessions.storageHelp}
        </p>
      </Disclosure>

      <div className="pt-2">
        <Button variant="secondary" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden />
          {t.auth.signOut}
        </Button>
      </div>
    </AppShell>
  );
}
