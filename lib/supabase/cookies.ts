import type { CookieOptions } from '@supabase/ssr';

/**
 * La duree de vie de la connexion.
 *
 * Le probleme n'etait ni la base ni le jeton : le projet est deja regle
 * sans peremption ni delai d'inactivite, et le jeton de rafraichissement
 * tourne tout seul. Ce qui coupait la session, c'est le cookie. Sans
 * `maxAge`, un navigateur en fait un cookie de session : il disparait a
 * la fermeture de la fenetre, et la personne se retrouve devant l'ecran
 * de connexion le lendemain sans que rien n'ait expire cote serveur.
 *
 * Quatre cents jours parce que c'est le plafond impose par Chrome depuis
 * 2022 : demander davantage ne donne rien de plus, et donne l'illusion
 * d'avoir regle la question.
 *
 * Un mot sur l'idee de lier la session a l'adresse IP : c'est la
 * mauvaise piste dans les deux sens. Une adresse n'est pas un secret,
 * elle n'authentifie donc personne ; et elle change tout le temps —
 * passage du wifi aux donnees mobiles, redemarrage de box, reseau
 * partage, relais de confidentialite — ce qui deconnecterait les gens
 * plus souvent qu'aujourd'hui, pas moins. Un jeton de rafraichissement
 * qui tourne, dans un cookie durable, fait le travail et se revoque.
 */
export const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  maxAge: AUTH_COOKIE_MAX_AGE,
  path: '/',
  // `lax` et non `strict` : le retour d'un lien de connexion ou de
  // Discord est une navigation depuis un autre domaine, et `strict`
  // retiendrait le cookie precisement a ce moment-la.
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

/** Applique la duree voulue sans ecraser ce que Supabase a decide. */
export function withAuthCookieOptions(options?: CookieOptions): CookieOptions {
  return { ...AUTH_COOKIE_OPTIONS, ...options, maxAge: AUTH_COOKIE_MAX_AGE };
}
