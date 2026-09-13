'use client';

import { useState } from 'react';
import { Headphones, Mic } from 'lucide-react';

import { SelectMenu } from '@/components/select-menu';
import { Button, Card } from '@/components/ui';
import type { AudioDevices } from '@/lib/audio/devices';
import { useT } from '@/lib/i18n';

/**
 * Le micro et la sortie du casque.
 *
 * Un casque-micro USB, une webcam et le micro de l'ordinateur branches en
 * meme temps : le navigateur prend celui du systeme, rarement le bon, et
 * on s'en rendait compte a la reecoute. Le choix se fait ici, avant la
 * prise, et reste le meme pour les suivantes.
 *
 * Tant que le micro n'est pas autorise, le navigateur ne donne pas le nom
 * des appareils : on propose de l'autoriser plutot qu'une liste de
 * « Micro 1, Micro 2 » impossible a reconnaitre.
 */
export function AudioDevicesCard({
  devices,
  recording,
}: {
  devices: AudioDevices;
  recording: boolean;
}) {
  const t = useT();
  const [refus, setRefus] = useState(false);

  const nom = (label: string, rang: number, genre: 'mic' | 'out') =>
    label || (genre === 'mic' ? t.studio.deviceMicN(rang + 1) : t.studio.deviceOutputN(rang + 1));

  return (
    <Card className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Headphones className="h-4 w-4 text-accent" aria-hidden />
        {t.studio.devicesTitle}
      </h2>

      {!devices.labelled ? (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-text-muted">{t.studio.devicesLocked}</p>
          <Button
            size="sm"
            onClick={async () => {
              setRefus(false);
              try {
                await devices.askPermission();
              } catch {
                setRefus(true);
              }
            }}
          >
            <Mic className="h-3.5 w-3.5" aria-hidden />
            {t.studio.devicesAllow}
          </Button>
          {refus ? <p className="text-xs text-danger-ink">{t.studio.micDenied}</p> : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-text-muted">{t.studio.deviceMic}</p>
            <SelectMenu
              label={t.studio.deviceMic}
              value={devices.micId}
              disabled={recording}
              onChange={devices.setMicId}
              options={[
                { value: '', label: t.studio.deviceDefault },
                ...devices.inputs.map((d, rang) => ({ value: d.deviceId, label: nom(d.label, rang, 'mic') })),
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-text-muted">{t.studio.deviceOutput}</p>
            {devices.outputSupported ? (
              <SelectMenu
                label={t.studio.deviceOutput}
                value={devices.outputId}
                disabled={recording}
                onChange={devices.setOutputId}
                options={[
                  { value: '', label: t.studio.deviceDefault },
                  ...devices.outputs.map((d, rang) => ({ value: d.deviceId, label: nom(d.label, rang, 'out') })),
                ]}
              />
            ) : (
              <p className="text-xs leading-relaxed text-text-faint">{t.studio.deviceOutputUnsupported}</p>
            )}
          </div>

          <p className="text-xs leading-relaxed text-text-faint">
            {recording ? t.studio.devicesDuringTake : t.studio.devicesHelp}
          </p>
        </div>
      )}
    </Card>
  );
}
