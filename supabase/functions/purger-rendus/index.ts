/**
 * Supprime les rendus arrives a echeance.
 *
 * Un rendu ne reste qu'une heure : le temps de le regarder et de le
 * telecharger. Postgres sait quand l'heure est passee, mais ne peut pas
 * effacer un fichier du stockage ; c'est ce que fait cette fonction.
 *
 * Elle est appelee par `pg_cron`, au travers de `app_purger_rendus`, et
 * seulement quand il y a quelque chose a effacer. Un en-tete partage
 * ferme la porte a qui connaitrait son adresse.
 *
 * L'ordre compte : le fichier d'abord, la fiche ensuite. Si l'effacement
 * du fichier echoue, la fiche garde son chemin et le passage suivant
 * reessaiera. L'inverse laisserait un fichier que plus rien ne designe.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const JETON = Deno.env.get('PURGE_TOKEN') ?? '';
const BUCKET_RENDERS = 'renders';

const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (requete) => {
  if (!JETON || requete.headers.get('x-purge-token') !== JETON) {
    return Response.json({ erreur: 'non autorisé' }, { status: 401 });
  }

  const { data, error } = await db
    .from('sessions')
    .select('id, render_path, render_vertical_path')
    .not('render_path', 'is', null)
    .lte('render_expires_at', new Date().toISOString())
    .limit(100);

  if (error) {
    console.error('lecture impossible', error.message);
    return Response.json({ erreur: error.message }, { status: 500 });
  }

  let supprimes = 0;
  const echecs: string[] = [];

  for (const scene of data ?? []) {
    const chemins = [scene.render_path, scene.render_vertical_path].filter(
      (chemin): chemin is string => typeof chemin === 'string' && chemin.length > 0,
    );

    const effacement = await db.storage.from(BUCKET_RENDERS).remove(chemins);
    if (effacement.error) {
      echecs.push(`${scene.id} : ${effacement.error.message}`);
      continue;
    }

    const miseAJour = await db
      .from('sessions')
      .update({
        render_path: null,
        render_vertical_path: null,
        render_size_bytes: null,
        render_vertical_size_bytes: null,
        render_expires_at: null,
        render_deleted_at: new Date().toISOString(),
      })
      .eq('id', scene.id);
    if (miseAJour.error) {
      echecs.push(`${scene.id} : ${miseAJour.error.message}`);
      continue;
    }

    supprimes += 1;
  }

  if (echecs.length > 0) console.error('purge incomplète', echecs);
  return Response.json({ supprimes, echecs: echecs.length });
});
