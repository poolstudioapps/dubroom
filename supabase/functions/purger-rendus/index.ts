/**
 * Efface ce qui arrive a echeance, une heure apres le montage.
 *
 * Un rendu ne reste qu'une heure : le temps de le regarder, de le
 * telecharger, de le publier ou de redoubler la scene. Postgres sait quand
 * l'heure est passee, mais ne peut pas effacer un fichier du stockage ;
 * c'est ce que fait cette fonction.
 *
 * Pour une scene terminee, tout part ensemble : le rendu, la video, les
 * pistes separees et les prises. Pour une scene qu'on est en train de
 * redoubler, seul l'ancien rendu part — la video et les pistes servent a
 * la nouvelle manche.
 *
 * Avant d'effacer les pistes d'une scene publiee, on les garde dans son
 * pack : le prochain groupe n'aura pas a refaire la separation.
 *
 * Elle est appelee par `pg_cron`, au travers de `app_purger_rendus`, et
 * seulement quand il y a quelque chose a effacer. Un en-tete partage
 * ferme la porte a qui connaitrait son adresse.
 *
 * L'ordre compte : les fichiers d'abord, la fiche ensuite. Si un
 * effacement echoue, la fiche garde ses chemins et le passage suivant
 * reessaiera. L'inverse laisserait des fichiers que plus rien ne designe.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const JETON = Deno.env.get('PURGE_TOKEN') ?? '';
const BUCKET_RENDERS = 'renders';
const BUCKET_SOURCES = 'sources';
const BUCKET_TAKES = 'takes';

const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

interface Scene {
  id: string;
  status: string;
  render_path: string | null;
  render_vertical_path: string | null;
  published_pack_id: string | null;
  stem_voice_path: string | null;
  stem_music_path: string | null;
  stem_music_preview_path: string | null;
}

/** Tous les fichiers d'un dossier de scene, un niveau de sous-dossier compris. */
async function fichiersDe(bucket: string, dossier: string): Promise<string[]> {
  const { data, error } = await db.storage.from(bucket).list(dossier, { limit: 1000 });
  if (error) throw new Error(`${bucket}/${dossier} : ${error.message}`);
  const fichiers: string[] = [];
  for (const entree of data ?? []) {
    // Un objet sans identifiant est un dossier : les prises sont rangees
    // par joueur.
    if (entree.id === null) {
      const { data: enfants, error: erreur } = await db.storage
        .from(bucket)
        .list(`${dossier}/${entree.name}`, { limit: 1000 });
      if (erreur) throw new Error(`${bucket}/${dossier}/${entree.name} : ${erreur.message}`);
      for (const enfant of enfants ?? []) fichiers.push(`${dossier}/${entree.name}/${enfant.name}`);
    } else {
      fichiers.push(`${dossier}/${entree.name}`);
    }
  }
  return fichiers;
}

async function viderDossier(bucket: string, dossier: string) {
  const fichiers = await fichiersDe(bucket, dossier);
  if (fichiers.length === 0) return;
  const { error } = await db.storage.from(bucket).remove(fichiers);
  if (error) throw new Error(`${bucket}/${dossier} : ${error.message}`);
}

async function copier(depuis: string, vers: string) {
  await db.storage.from(BUCKET_SOURCES).remove([vers]);
  const { error } = await db.storage.from(BUCKET_SOURCES).copy(depuis, vers);
  if (error) throw new Error(`copie ${depuis} : ${error.message}`);
}

/** Garde les pistes d'une scene publiee dans son pack, s'il ne les a pas. */
async function garderSonsDansPack(scene: Scene) {
  if (!scene.published_pack_id || !scene.stem_voice_path || !scene.stem_music_path) return;

  const { data: pack, error } = await db
    .from('packs')
    .select('id, stem_music_path')
    .eq('id', scene.published_pack_id)
    .maybeSingle();
  if (error) throw new Error(`pack : ${error.message}`);
  if (!pack || pack.stem_music_path) return;

  const base = `packs/${pack.id}`;
  await copier(scene.stem_voice_path, `${base}/voice.flac`);
  await copier(scene.stem_music_path, `${base}/music.flac`);
  const apercu = scene.stem_music_preview_path ? `${base}/music-preview.m4a` : null;
  if (scene.stem_music_preview_path && apercu) await copier(scene.stem_music_preview_path, apercu);

  const miseAJour = await db
    .from('packs')
    .update({
      stem_voice_path: `${base}/voice.flac`,
      stem_music_path: `${base}/music.flac`,
      stem_music_preview_path: apercu,
    })
    .eq('id', pack.id);
  if (miseAJour.error) throw new Error(`pack : ${miseAJour.error.message}`);
}

Deno.serve(async (requete) => {
  if (!JETON || requete.headers.get('x-purge-token') !== JETON) {
    return Response.json({ erreur: 'non autorisé' }, { status: 401 });
  }

  const { data, error } = await db
    .from('sessions')
    .select(
      'id, status, render_path, render_vertical_path, published_pack_id, stem_voice_path, stem_music_path, stem_music_preview_path',
    )
    .not('render_path', 'is', null)
    .lte('render_expires_at', new Date().toISOString())
    .limit(100);

  if (error) {
    console.error('lecture impossible', error.message);
    return Response.json({ erreur: error.message }, { status: 500 });
  }

  let supprimes = 0;
  const echecs: string[] = [];

  for (const scene of (data ?? []) as Scene[]) {
    try {
      const terminee = scene.status === 'done';

      // Les pistes d'abord dans le pack : effacees, elles seraient perdues.
      if (terminee) await garderSonsDansPack(scene);

      const rendus = [scene.render_path, scene.render_vertical_path].filter(
        (chemin): chemin is string => typeof chemin === 'string' && chemin.length > 0,
      );
      const effacement = await db.storage.from(BUCKET_RENDERS).remove(rendus);
      if (effacement.error) throw new Error(`rendu : ${effacement.error.message}`);

      if (terminee) {
        await viderDossier(BUCKET_SOURCES, scene.id);
        await viderDossier(BUCKET_TAKES, scene.id);
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
          ...(terminee
            ? {
                video_path: null,
                stem_voice_path: null,
                stem_music_path: null,
                stem_music_preview_path: null,
                upload_path: null,
                purged_at: new Date().toISOString(),
              }
            : {}),
        })
        .eq('id', scene.id);
      if (miseAJour.error) throw new Error(`fiche : ${miseAJour.error.message}`);

      supprimes += 1;
    } catch (erreur) {
      echecs.push(`${scene.id} : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }
  }

  if (echecs.length > 0) console.error('purge incomplète', echecs);
  return Response.json({ supprimes, echecs: echecs.length });
});
