import { spawn } from 'node:child_process';
import { SystemError } from '../errors.ts';

/**
 * Unique facon d'appeler un binaire depuis le worker (PRD §20.2).
 *
 * Pas de `exec`, pas de `shell: true` : les chemins Windows contiennent
 * des espaces et les filtergraphs ffmpeg contiennent des caracteres que
 * le shell interpreterait. Chaque argument est un element du tableau.
 */
export function run(
  bin: string,
  args: string[],
  opts: {
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
    timeoutMs?: number;
    cwd?: string;
  } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: opts.cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, opts.timeoutMs)
      : null;

    child.stdout.on('data', (d: Buffer) => {
      const text = d.toString();
      stdout += text;
      opts.onStdout?.(text);
    });

    child.stderr.on('data', (d: Buffer) => {
      const text = d.toString();
      // ffmpeg est tres bavard sur stderr : on ne garde que la fin,
      // seule porteuse de l'erreur en cas d'echec.
      stderr = (stderr + text).slice(-16_000);
      opts.onStderr?.(text);
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new SystemError(`${bin} introuvable ou non exécutable`, { cause: err }));
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        reject(new SystemError(`${bin} a dépassé son délai d'exécution`));
        return;
      }
      // Un code 0 accompagne de stderr n'est pas une erreur.
      if (code === 0) resolve({ stdout, stderr });
      else
        reject(
          new SystemError(
            `${bin} a terminé avec le code ${code}\n${stderr.slice(-2000)}`,
          ),
        );
    });
  });
}
