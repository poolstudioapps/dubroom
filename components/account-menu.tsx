'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Contact, LogOut, Package, Settings, User } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { Avatar } from '@/components/avatar';
import { NotificationsBell } from '@/components/notifications-bell';

import { profileHref } from '@/lib/creators';
import { useMyPackCount, useMyProfile } from '@/lib/profile';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Le bouton de compte, en haut a droite.
 *
 * C'est la place attendue, et elle libere la barre d'onglets : « se
 * deconnecter » y occupait un bouton permanent pour une action qu'on
 * fait une fois par mois, pendant que le pseudo et la photo n'etaient
 * visibles nulle part.
 */
export function AccountMenu() {
  const t = useT();

  const router = useRouter();
  const profile = useMyProfile();
  const packs = useMyPackCount();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Fermeture au clic dehors et a la touche d'echappement : un menu qui
  // ne se ferme que par son propre bouton est un piege.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = profile.data?.display_name ?? '';

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    // La cloche a droite du compte : c'est la derniere chose de la ligne,
    // la ou l'oeil finit sa lecture de l'en-tete.
    <div className="flex items-center gap-2">
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.account.menuLabel}
        onClick={() => setOpen((value) => !value)}
        className="btn-3d btn-secondary flex h-11 items-center gap-2 pl-1.5 pr-3"
      >
        <Avatar name={name} path={profile.data?.avatar_path} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-bold sm:inline">
          {name || '…'}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]"
        >
          <div className="border-b-2 border-border px-3 py-2">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="text-xs text-text-faint">{t.account.menuHint}</p>
          </div>

          <MenuItem href="/compte" onSelect={() => setOpen(false)}>
            <User className="h-4 w-4" aria-hidden />
            {t.account.title}
          </MenuItem>

          {profile.data?.user_id ? (
            <MenuItem href={profileHref(profile.data.user_id)} onSelect={() => setOpen(false)}>
              <Contact className="h-4 w-4" aria-hidden />
              {t.creators.myPublicProfile}
            </MenuItem>
          ) : null}

          {(packs.data ?? 0) > 0 ? (
            // Ses packs vivent sur son profil public : c'est la qu'on les modifie.
            <MenuItem
              href={profile.data?.user_id ? profileHref(profile.data.user_id) : '/mes-packs'}
              onSelect={() => setOpen(false)}
            >
              <Package className="h-4 w-4" aria-hidden />
              {t.nav.myPacks}
            </MenuItem>
          ) : null}

          <MenuItem href="/sessions" onSelect={() => setOpen(false)}>
            <Settings className="h-4 w-4" aria-hidden />
            {t.nav.sessions}
          </MenuItem>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2 border-t-2 border-border px-3 py-2.5 text-left text-sm font-bold text-danger hover:bg-surface"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t.auth.signOut}
          </button>
        </div>
      ) : null}
    </div>
    <NotificationsBell userId={profile.data?.user_id ?? null} />
    </div>
  );
}

function MenuItem({
  href,
  onSelect,
  children,
}: {
  href: string;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold hover:bg-surface"
    >
      {children}
    </Link>
  );
}
