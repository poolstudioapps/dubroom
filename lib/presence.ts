'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Qui est sur l'ecran d'attente, en direct.
 *
 * Savoir que tout le monde a fini ne suffit pas a lancer le rendu : un
 * joueur qui a enregistre sa derniere prise peut etre en train de la
 * reecouter, de refaire la precedente, ou d'avoir ferme l'onglet. L'hote
 * veut savoir qui attend vraiment.
 *
 * C'est de la presence Realtime, pas une colonne : elle disparait d'elle
 * meme quand l'onglet se ferme, la ou un drapeau en base resterait leve
 * pour toujours apres une coupure.
 *
 * Chaque joueur du studio ecoute le canal ; il ne s'y declare « en
 * attente » que lorsqu'il est effectivement sur l'ecran d'attente.
 */
export function useWaitingRoom(
  sessionId: string,
  participantId: string | null,
  waiting: boolean,
): { waiting: Set<string>; online: Set<string> } {
  const [etat, setEtat] = useState({ waiting: new Set<string>(), online: new Set<string>() });
  const canal = useRef<RealtimeChannel | null>(null);
  const [abonne, setAbonne] = useState(false);

  useEffect(() => {
    if (!participantId) return;
    const db = supabaseBrowser();
    const channel = db.channel(`attente:${sessionId}`, {
      config: { presence: { key: participantId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ waiting?: boolean }>();
        const enAttente = new Set<string>();
        const enLigne = new Set<string>();
        for (const [cle, metas] of Object.entries(state)) {
          enLigne.add(cle);
          if (metas.some((m) => m.waiting)) enAttente.add(cle);
        }
        setEtat({ waiting: enAttente, online: enLigne });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setAbonne(true);
      });

    canal.current = channel;
    return () => {
      setAbonne(false);
      canal.current = null;
      void db.removeChannel(channel);
    };
  }, [sessionId, participantId]);

  useEffect(() => {
    if (!abonne || !canal.current) return;
    void canal.current.track({ waiting });
  }, [abonne, waiting]);

  return etat;
}
