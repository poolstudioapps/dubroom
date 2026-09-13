/**
 * La politique de securite du contenu (CSP), et le nonce qui va avec.
 *
 * Elle dit au navigateur d'ou une page a le droit de charger des scripts,
 * des images, des medias, et a qui elle a le droit de parler. Un script
 * injecte par une faille — un nom de personnage mal echappe, une
 * dependance compromise — ne s'execute alors pas : il n'a pas le nonce,
 * un secret tire a chaque requete par le middleware.
 *
 * Les sources sont volontairement courtes. Le produit ne parle qu'a
 * Supabase (donnees, stockage, temps reel), affiche des vignettes et un
 * lecteur YouTube sur la fiche d'un pack, et, si un captcha est
 * configure, charge celui de Cloudflare. Tout le reste est ferme.
 */

export interface ContexteCsp {
  /** L'adresse du projet Supabase : `https://xxx.supabase.co`. */
  supabaseUrl: string;
  /** En developpement, Next a besoin d'`eval` pour le rechargement a chaud. */
  dev: boolean;
  /** Sur une previsualisation Vercel, la barre d'outils de Vercel s'injecte. */
  preview: boolean;
  /** Le captcha Cloudflare Turnstile est active sur la connexion. */
  turnstile: boolean;
}

/** Seize octets aleatoires, en base64 : un nonce par requete. */
export function nonceAleatoire(): string {
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  let binaire = '';
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire);
}

export function politiqueDeContenu(nonce: string, ctx: ContexteCsp): string {
  const supabase = new URL(ctx.supabaseUrl).origin;
  const supabaseWs = supabase.replace(/^https:/, 'wss:');

  const script = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  const connect = ["'self'", supabase, supabaseWs];
  const frame = ['https://www.youtube-nocookie.com'];
  const img = ["'self'", 'data:', 'blob:', supabase, 'https://i.ytimg.com'];

  if (ctx.dev) script.push("'unsafe-eval'");
  if (ctx.turnstile) {
    script.push('https://challenges.cloudflare.com');
    frame.push('https://challenges.cloudflare.com');
  }
  if (ctx.preview) {
    script.push('https://vercel.live');
    connect.push('https://vercel.live', 'wss://ws-us3.pusher.com');
    frame.push('https://vercel.live');
    img.push('https://vercel.live', 'https://vercel.com');
  }

  const directives = [
    `default-src 'self'`,
    `script-src ${script.join(' ')}`,
    // Les styles en ligne : les couleurs des personnages et les positions
    // des curseurs se posent en attribut `style`.
    `style-src 'self' 'unsafe-inline'`,
    `img-src ${img.join(' ')}`,
    // Les videos et pistes viennent du stockage Supabase, par URL signee ;
    // les prises qu'on vient d'enregistrer, d'un blob local.
    `media-src 'self' blob: ${supabase}`,
    `connect-src ${connect.join(' ')}`,
    `font-src 'self' data:`,
    `worker-src 'self' blob:`,
    `frame-src ${frame.join(' ')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
  ];
  if (!ctx.dev) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}
