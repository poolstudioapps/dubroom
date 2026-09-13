'use client';

import { Badge } from '@/components/ui';
import { useT } from '@/lib/i18n';
import type { SessionStatus } from '@/lib/supabase/database.types';

/**
 * La couleur de chaque statut.
 *
 * Elle vit ici et non dans les traductions : c'est une decision de
 * lecture, pas de langue. Un import echoue est rouge dans les dix.
 */
const TONS: Record<SessionStatus, 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'> = {
  draft: 'neutral',
  ingest_queued: 'warn',
  ingesting: 'accent',
  ingest_failed: 'danger',
  prepping: 'accent',
  lobby: 'accent',
  recording: 'accent',
  render_queued: 'warn',
  rendering: 'accent',
  render_failed: 'danger',
  done: 'ok',
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const t = useT();
  return <Badge tone={TONS[status]}>{t.status[status]}</Badge>;
}
