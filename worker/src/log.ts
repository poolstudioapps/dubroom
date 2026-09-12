/**
 * Logs structures (PRD §18).
 *
 * `session_id` et `step` sont systematiques : c'est le seul endroit ou
 * l'on pourra comprendre ce qui s'est passe dans un pipeline de cinq
 * minutes, plusieurs heures apres coup.
 */

export interface LogContext {
  sessionId?: string;
  jobId?: string;
  step?: string;
  [key: string]: unknown;
}

function emit(level: 'info' | 'warn' | 'error', message: string, ctx: LogContext = {}) {
  const time = new Date().toISOString().slice(11, 23);
  const parts = Object.entries(ctx)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`);
  const suffix = parts.length > 0 ? `  ${parts.join(' ')}` : '';
  const line = `${time} ${level.toUpperCase().padEnd(5)} ${message}${suffix}`;

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  info: (message: string, ctx?: LogContext) => emit('info', message, ctx),
  warn: (message: string, ctx?: LogContext) => emit('warn', message, ctx),
  error: (message: string, ctx?: LogContext) => emit('error', message, ctx),
};

/** Logger pre-rempli pour la duree d'un job. */
export function scopedLog(base: LogContext) {
  return {
    info: (message: string, ctx?: LogContext) => log.info(message, { ...base, ...ctx }),
    warn: (message: string, ctx?: LogContext) => log.warn(message, { ...base, ...ctx }),
    error: (message: string, ctx?: LogContext) => log.error(message, { ...base, ...ctx }),
  };
}

export type ScopedLog = ReturnType<typeof scopedLog>;
