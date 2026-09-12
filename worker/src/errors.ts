/**
 * Deux familles d'erreurs, et la distinction traverse tout le worker
 * (PRD §20.3).
 *
 * `UserError` : le message est affiche tel quel dans l'interface, et le
 * job n'est pas retente — reessayer trois fois de telecharger une video
 * privee ne la rendra pas publique.
 *
 * `SystemError` : panne technique. Le message technique est logge, un
 * message generique est affiche, et le job repasse en file.
 */

export class UserError extends Error {
  readonly kind = 'user' as const;
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class SystemError extends Error {
  readonly kind = 'system' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SystemError';
  }
}

export function isUserError(error: unknown): error is UserError {
  return error instanceof UserError;
}

/** Message a stocker dans `jobs.error`, donc visible par l'utilisateur. */
export function publicMessage(error: unknown): string {
  if (isUserError(error)) return error.message;
  return 'Le traitement a échoué. Regarde les logs du worker pour le détail.';
}

export function technicalMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}
