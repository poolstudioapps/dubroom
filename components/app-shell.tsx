'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui';
import { APP_NAME, t } from '@/config/strings';
import { supabaseBrowser } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  className,
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div
          className={cn(
            'mx-auto flex h-14 items-center justify-between px-4',
            wide ? 'max-w-[110rem]' : 'max-w-5xl',
          )}
        >
          <Link href="/sessions" className="text-sm font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t.auth.signOut}</span>
          </Button>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full flex-1 px-4 py-6',
          wide ? 'max-w-[110rem]' : 'max-w-5xl',
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
