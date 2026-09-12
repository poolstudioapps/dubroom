'use client';

import { Badge } from '@/components/ui';
import type { SessionStatus } from '@/lib/supabase/database.types';

const LABELS: Record<
  SessionStatus,
  { text: string; tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent' }
> = {
  draft: { text: 'Brouillon', tone: 'neutral' },
  ingest_queued: { text: 'En file', tone: 'warn' },
  ingesting: { text: 'Import en cours', tone: 'accent' },
  ingest_failed: { text: 'Import échoué', tone: 'danger' },
  prepping: { text: 'À préparer', tone: 'accent' },
  lobby: { text: 'Lobby ouvert', tone: 'accent' },
  recording: { text: 'Enregistrement', tone: 'accent' },
  render_queued: { text: 'Rendu en file', tone: 'warn' },
  rendering: { text: 'Rendu en cours', tone: 'accent' },
  render_failed: { text: 'Rendu échoué', tone: 'danger' },
  done: { text: 'Terminée', tone: 'ok' },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const { text, tone } = LABELS[status];
  return <Badge tone={tone}>{text}</Badge>;
}
