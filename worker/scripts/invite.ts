/**
 * Fabrique un lien de connexion a envoyer soi-meme.
 *
 * Le service de courriel integre de Supabase plafonne a deux messages par
 * heure tant qu'aucun SMTP personnel n'est configure : de quoi bloquer
 * une soiree des le troisieme joueur. Ce script court-circuite le
 * courriel — il ajoute l'adresse a la liste blanche si besoin, produit un
 * lien de connexion valide, et te laisse l'envoyer par le canal que vous
 * utilisez deja.
 *
 * Il vit dans le worker parce qu'il lui faut la cle service, qui ne doit
 * exister nulle part ailleurs (PRD §14).
 *
 *   npm run invite -- ami@exemple.fr
 *   npm run invite -- ami@exemple.fr https://dubroom-one.vercel.app /s/VQXAR8
 */

import { assertConfig, config } from '../src/config.ts';
import { db } from '../src/lib/db.ts';

assertConfig();

const [email, siteArg, nextArg] = process.argv.slice(2);
const site = siteArg ?? 'https://dubroom-one.vercel.app';
const next = nextArg ?? '/sessions';

if (!email || !email.includes('@')) {
  console.error('\n  Usage : npm run invite -- adresse@exemple.fr [site] [destination]\n');
  process.exit(1);
}

const normalized = email.trim().toLowerCase();

// Liste blanche : sans elle, le lien menerait a un refus poli.
const { error: allowError } = await db
  .from('allowed_emails')
  .upsert({ email: normalized }, { onConflict: 'email' });
if (allowError) {
  console.error(`\n  Ajout a la liste blanche impossible : ${allowError.message}\n`);
  process.exit(1);
}

const res = await fetch(`${config.supabaseUrl}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers: {
    apikey: config.supabaseServiceKey,
    Authorization: `Bearer ${config.supabaseServiceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'magiclink',
    email: normalized,
    redirect_to: `${site}/auth/callback?next=${encodeURIComponent(next)}`,
  }),
});

if (!res.ok) {
  console.error(`\n  Supabase a refuse : ${res.status} ${(await res.text()).slice(0, 300)}\n`);
  process.exit(1);
}

const payload = (await res.json()) as {
  action_link?: string;
  properties?: { action_link?: string };
};
const link = payload.properties?.action_link ?? payload.action_link;

if (!link) {
  console.error('\n  Reponse inattendue de Supabase.\n');
  process.exit(1);
}

console.log('');
console.log(`  ${normalized} est sur la liste blanche.`);
console.log('');
console.log('  Lien de connexion (valable une heure, un seul usage) :');
console.log('');
console.log(`  ${link}`);
console.log('');
console.log('  Envoie-le par le canal de ton choix. Aucun courriel n a ete emis,');
console.log('  donc aucun plafond n a ete consomme.');
console.log('');

await db.removeAllChannels();
db.realtime.disconnect();
