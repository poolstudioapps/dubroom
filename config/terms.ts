/**
 * La version des conditions generales en vigueur.
 *
 * Une date, pas un numero : c'est ce qu'on cherche quand on veut savoir
 * ce que quelqu'un a accepte, et ca se compare tout seul.
 *
 * Changer cette valeur redemande l'acceptation a tout le monde a la
 * connexion suivante. Ce n'est donc pas a faire pour une correction de
 * ponctuation, mais uniquement quand les regles changent vraiment.
 */
export const TERMS_VERSION = '2026-09-12';

/** La meme date, ecrite pour etre lue en haut de la page. */
export const TERMS_VERSION_LABEL = '12 septembre 2026';

/**
 * Ou l'acceptation attend entre le clic et la connexion.
 *
 * La case est cochee avant d'etre connecte : au moment ou l'on demande
 * un lien magique, il n'y a pas encore de compte a qui attacher la
 * reponse. Elle patiente donc ici, et la premiere page connectee
 * l'inscrit au profil.
 */
export const TERMS_STORAGE_KEY = 'dubup.termsAccepted';
