/**
 * Réveille le worker quand une tâche entre dans la file.
 *
 * Le worker ne tourne plus en permanence : c'est un job Cloud Run qui
 * traite ce qu'il trouve puis s'arrête. Encore faut-il que quelqu'un le
 * lance, et le plus tôt possible — une scène qui attend cinq minutes
 * qu'un minuteur passe, c'est cinq minutes où le groupe regarde un
 * écran de chargement.
 *
 * C'est donc la base qui prévient, par un déclencheur sur `jobs`. Cette
 * fonction fait le seul travail que Postgres ne sait pas faire : signer
 * un jeton pour Google.
 *
 * ─ Pourquoi tout ce détour pour un simple appel ─
 *
 * L'API de Cloud Run n'accepte que des jetons OAuth. Pour en obtenir un
 * sans intervention humaine, on signe une assertion avec la clé privée
 * d'un compte de service, et Google la rend contre un jeton d'accès.
 * C'est la danse standard, et elle tient en quarante lignes avec la
 * cryptographie du navigateur, présente dans Deno.
 *
 * Le compte de service n'a qu'un droit, `run.invoker` sur ce job précis.
 * Sa clé ne quitte jamais les secrets du projet Supabase : ni Vercel, ni
 * le navigateur, ni le dépôt n'en voient la couleur.
 */

const CLE = JSON.parse(Deno.env.get('GCP_SA_KEY') ?? '{}');
/**
 * Le mot de passe du déclencheur.
 *
 * La fonction est déclarée sans vérification de jeton, parce que c'est
 * Postgres qui l'appelle et qu'il n'a pas de session utilisateur à
 * présenter. Sans ce garde-fou elle serait donc ouverte à qui connaît
 * son adresse — et chaque appel démarre un GPU. Un en-tête partagé
 * suffit à fermer la porte.
 */
const JETON_REVEIL = Deno.env.get('REVEIL_TOKEN') ?? '';
const PROJET = Deno.env.get('GCP_PROJECT') ?? '';
const REGION = Deno.env.get('GCP_REGION') ?? 'europe-west1';
const JOB = Deno.env.get('GCP_JOB') ?? 'dubup-worker';

/** Encodage base64 sans remplissage, tel que JWT l'exige. */
function base64url(donnees: ArrayBuffer | string): string {
  const octets =
    typeof donnees === 'string'
      ? new TextEncoder().encode(donnees)
      : new Uint8Array(donnees);
  let binaire = '';
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** La clé privée du compte de service, au format que Web Crypto attend. */
async function importerCle(pem: string): Promise<CryptoKey> {
  const corps = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const brut = Uint8Array.from(atob(corps), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    brut,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * Un jeton d'accès Google, obtenu contre une assertion signée.
 *
 * Valable une heure, mais on n'en garde aucun : cette fonction ne tourne
 * qu'au moment où une tâche arrive, et garder un jeton en mémoire entre
 * deux réveils supposerait une instance qui survit, ce qui n'est pas le
 * cas.
 */
async function jetonGoogle(): Promise<string> {
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const charge = base64url(
    JSON.stringify({
      iss: CLE.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: maintenant,
      exp: maintenant + 3600,
    }),
  );

  const cle = await importerCle(CLE.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cle,
    new TextEncoder().encode(`${entete}.${charge}`),
  );

  const reponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${entete}.${charge}.${base64url(signature)}`,
    }),
  });

  const donnees = await reponse.json();
  if (!donnees.access_token) {
    throw new Error(`Jeton refusé par Google : ${JSON.stringify(donnees).slice(0, 200)}`);
  }
  return donnees.access_token;
}

Deno.serve(async (requete) => {
  try {
    if (!JETON_REVEIL || requete.headers.get('x-reveil-token') !== JETON_REVEIL) {
      return Response.json({ erreur: 'non autorisé' }, { status: 401 });
    }
    if (!CLE.private_key || !PROJET) {
      throw new Error('GCP_SA_KEY ou GCP_PROJECT manquant dans les secrets.');
    }

    const jeton = await jetonGoogle();
    const url =
      `https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1` +
      `/namespaces/${PROJET}/jobs/${JOB}:run`;

    const lancement = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
      body: '{}',
    });

    const corps = await lancement.text();

    /*
     * Un job déjà en cours n'est pas une erreur.
     *
     * Trois répliques enregistrées coup sur coup produisent trois
     * réveils, et Cloud Run refuse le deuxième et le troisième. C'est le
     * comportement voulu : le job qui tourne déjà videra la file de
     * toute façon. On répond donc « déjà réveillé » plutôt que de faire
     * échouer le déclencheur, qui reste ainsi silencieux dans les
     * journaux de la base.
     */
    if (!lancement.ok && lancement.status !== 409) {
      throw new Error(`Cloud Run a refusé : ${lancement.status} ${corps.slice(0, 300)}`);
    }

    return Response.json({
      reveille: lancement.ok,
      deja: lancement.status === 409,
    });
  } catch (erreur) {
    console.error('réveil impossible', erreur);
    return Response.json(
      { erreur: erreur instanceof Error ? erreur.message : String(erreur) },
      { status: 500 },
    );
  }
});
