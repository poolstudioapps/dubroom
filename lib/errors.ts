import { t } from '@/config/strings';

/**
 * Les fonctions Postgres levent des codes stables (`HOST_ONLY`,
 * `CHARACTER_TAKEN`…). On les traduit ici, une fois, plutot que de
 * laisser fuiter un message SQL dans l'interface.
 */
const MESSAGES: Record<string, string> = {
  NOT_ALLOWED: t.auth.notAllowed,
  SESSION_NOT_FOUND: t.sessions.codeNotFound,
  SESSION_LOCKED: t.errors.sessionLocked,
  HOST_ONLY: t.errors.hostOnly,
  FORBIDDEN: t.errors.forbidden,
  NOT_A_PARTICIPANT: t.errors.forbidden,
  NOT_YOUR_CHARACTER: t.errors.forbidden,
  CHARACTER_NOT_FOUND: t.errors.notFound,
  CHARACTER_TAKEN: 'Ce personnage vient d’être pris par quelqu’un d’autre.',
  CHARACTERS_UNASSIGNED: t.lobby.startBlockedCharacters,
  PLAYERS_NOT_READY: t.lobby.startBlockedReady,
  TAKES_MISSING: t.studio.renderBlocked,
  CANNOT_KICK_HOST: 'L’hôte ne peut pas être exclu.',
  CLIP_NOT_FOUND: t.errors.notFound,
  LINE_NOT_FOUND: t.errors.notFound,
  TAKE_NOT_FOUND: t.errors.notFound,
  PARTICIPANT_NOT_FOUND: t.errors.notFound,
  EMPTY_NAME: 'Le nom ne peut pas être vide.',
  CROSS_SESSION: 'Ces éléments n’appartiennent pas à la même scène.',
  INVALID_EMAIL: 'Cette adresse ne ressemble pas à une adresse e-mail.',
  CANNOT_REVOKE_SELF: 'Tu ne peux pas te retirer toi-même de la liste.',
  PACK_NOT_FOUND: 'Cette scène n’est plus disponible.',
  ALREADY_PUBLISHED: 'Cette scène est déjà dans la communauté.',
  NO_SOURCE_URL:
    'Cette scène vient d’un fichier importé. Seules les scènes créées depuis un lien peuvent rejoindre la communauté.',
  PACK_NEEDS_URL:
    'Seule une scène créée depuis un lien peut être partagée. Une vidéo importée reste privée à ton groupe.',
  NOTHING_TO_PUBLISH: 'Cette scène n’a aucun personnage à partager.',
  PACK_FORBIDDEN: 'Seule la personne qui a publié cette scène peut la modifier.',
  PACK_TITLE_REQUIRED: 'Donne un titre à la scène.',
  PACK_LANG_REQUIRED: 'Choisis la langue parlée dans la scène.',
  PACK_GENRE_REQUIRED: 'Choisis le genre de la scène.',
  PACK_URL_REQUIRED:
    'Indique le lien d’où vient la vidéo (YouTube ou autre) : il sert d’aperçu et permet aux autres de la récupérer.',
  ALREADY_IN_CATALOGUE: 'Cette scène vient déjà du catalogue.',
  COMMENT_EMPTY: 'Le commentaire est vide.',
  COMMENT_TOO_LONG: 'Le commentaire dépasse 1 000 caractères.',
  COMMENT_TOO_FAST: 'Doucement : attends quelques secondes avant de republier.',
  COMMENT_NOT_FOUND: 'Ce commentaire a été supprimé.',
  LOBBY_CLOSED:
    'Ce salon est fermé : il est resté vingt minutes sans activité. L’hôte peut le rouvrir.',
  SESSION_EXPIRED: t.studio.expiredBody,
  SOURCES_PURGED: t.result.redoUnavailable,
  PACK_HAS_MEDIA: 'Cette scène démarre sans vidéo à fournir.',
  ADMIN_ONLY: 'Réservé aux administrateurs.',
  PROFILE_NOT_FOUND: 'Ce profil n’existe pas.',
  CANNOT_REPORT_SELF: 'Tu ne peux pas signaler ton propre commentaire.',
  OWNER_ONLY: 'Réservé aux propriétaires du projet.',
  OWNER_LOCKED: 'Le rôle d’un propriétaire ne se change pas depuis l’application.',
  INVALID_ROLE: 'Ce rôle n’existe pas.',
  GUEST_NOT_FOUND: 'Cette adresse n’est pas dans la liste des invités.',
};

/** Erreur porteuse d'un message deja lisible par l'utilisateur. */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message?: string, status = 400) {
    super(message ?? MESSAGES[code] ?? t.common.unknownError);
    this.code = code;
    this.status = status;
  }
}

/** Traduit une erreur Postgres/PostgREST en message francais. */
export function humanizeError(error: unknown): string {
  if (error instanceof AppError) return error.message;

  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  // Les exceptions plpgsql arrivent sous la forme `CODE: details`.
  const code = raw.split(':')[0]?.trim() ?? '';
  if (MESSAGES[code]) return MESSAGES[code];

  // Violation d'unicite du code de session.
  if (raw.includes('sessions_code_key')) {
    return 'Ce code est déjà pris, réessaie.';
  }

  return raw || t.common.unknownError;
}

/** Statut HTTP a renvoyer pour une erreur donnee. */
export function errorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  const raw =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  const code = raw.split(':')[0]?.trim() ?? '';
  if (
    [
      'HOST_ONLY',
      'FORBIDDEN',
      'NOT_A_PARTICIPANT',
      'NOT_YOUR_CHARACTER',
      'NOT_ALLOWED',
    ].includes(code)
  ) {
    return 403;
  }
  if (code.endsWith('_NOT_FOUND')) return 404;
  return 400;
}
