# PRD — Dub’Up (nom de travail)

> Studio de doublage collaboratif dans le navigateur. Une scène de film, des amis, chacun prend un personnage, enregistre ses répliques de son côté, et on découvre le résultat mixé à la fin.

**Version** : 1.1
**Auteur** : Alexandre Perret (Pool Studio)
**Destinataire** : Claude Code
**Statut** : prêt pour implémentation
**Révision** : v1.1 — worker local, file d'attente, purge après rendu, annexe d'intégration (§20)

---

## 1. Contexte et vision

### 1.1 Le produit en une phrase

Un site web privé où un groupe d'amis importe une scène de film, se répartit les personnages, et redouble la scène chacun de son côté — le résultat final étant une vidéo où les voix originales sont remplacées par les leurs, la musique et l'ambiance d'origine étant préservées.

### 1.2 Pourquoi ça marche techniquement

Le verrou historique de ce type de produit, c'est d'obtenir la bande-son sans les voix. On le résout par **séparation de sources** sur la piste audio de la scène elle-même : le stem « fond » produit est par construction déjà aligné à l'image, à l'échantillon près. Aucun calage temporel n'est nécessaire.

### 1.3 Références

- **Dubba** (dubba.studio) — le plus proche du concept visé : navigateur seul, séparation IA, bande rythmo, sessions multi-joueurs.
- **The Choicer Voicer** / **Voxalike** / **What The Dub** — versions jeu, packs préparés.
- Le vocabulaire et l'ergonomie du **doublage professionnel** (bande rythmo) sont volontairement repris : c'est ce qui rend l'exercice jouable sans montage.

### 1.4 Public et accès

Usage strictement privé : l'auteur et ses amis. Pas d'inscription ouverte, pas de catalogue public, pas de partage hors du cercle. Cette contrainte simplifie beaucoup de choses (pas de modération, pas de scaling, pas de conformité produit) et doit être tenue.

---

## 2. Objectifs et non-objectifs

### 2.1 Objectifs V1

| # | Objectif | Critère de réussite |
|---|---|---|
| O1 | Ingérer une scène (upload MP4 ou lien YouTube) et en produire automatiquement un projet doublable | < 5 min entre l'import et l'ouverture du lobby, pour une scène de 3 min |
| O2 | Détecter les personnages et découper les répliques sans intervention manuelle lourde | L'hôte n'a que des corrections à faire, pas une saisie |
| O3 | Permettre à chaque joueur d'enregistrer ses répliques, en asynchrone, dans le navigateur | Aucun logiciel, aucun réglage, casque suffit |
| O4 | Produire un MP4 final mixé, téléchargeable, sans sous-titres incrustés | Le fichier se lit partout, se partage par lien |
| O5 | Ne rien conserver d'inutile | La source est purgée dès le rendu produit, seul le MP4 final survit |

### 2.2 Non-objectifs V1 (explicitement hors périmètre)

- ❌ Temps réel : aucun flux audio/vidéo partagé, aucun WebRTC, aucune écoute croisée pendant l'enregistrement.
- ❌ Time-stretch / correction automatique de la durée d'une prise.
- ❌ Doublage de bruits d'ambiance (rires, applaudissements) → **V2**, voir §16.
- ❌ Catalogue de scènes préparées, feed public, système de vote.
- ❌ Mobile natif. Le site doit être utilisable sur desktop ; le mobile est « best effort » pour rejoindre un salon.
- ❌ Traduction / doublage multilingue / TTS.
- ❌ Monétisation, quotas, plans.

---

## 3. Glossaire

| Terme | Définition |
|---|---|
| **Session** | Une scène + un groupe de joueurs + l'ensemble des prises. Unité de vie du produit. |
| **Source** | Le fichier vidéo d'origine, normalisé. Temporaire : supprimé une fois le rendu produit. |
| **Stem voix** | Piste audio contenant uniquement les voix extraites de la source. |
| **Stem fond** | Piste audio contenant tout le reste : musique, bruitages, ambiance. |
| **Locuteur** (speaker) | Entité détectée automatiquement par la diarisation (`speaker_0`, `speaker_1`…). |
| **Personnage** | Locuteur après validation/renommage par l'hôte. C'est ce qu'un joueur choisit. |
| **Réplique** (line) | Un segment de parole continu d'un personnage, avec texte et timestamps au mot. |
| **Clip** | Unité d'enregistrement présentée au joueur. Une ou plusieurs répliques fusionnées + marges. |
| **Prise** (take) | Un enregistrement audio réalisé par un joueur sur un clip. Plusieurs prises possibles, une seule retenue. |
| **Bande rythmo** | Piste horizontale sous la vidéo où le texte défile de droite à gauche sous une tête de lecture fixe. |
| **Marge** | 2 s ajoutées avant et après la fenêtre de parole d'un clip, pour laisser respirer la prise. |

---

## 4. Parcours utilisateur de bout en bout

```
HÔTE                                    JOUEURS
────                                    ───────
1. Se connecte (magic link)
2. Crée une session
   → upload MP4 ou colle un lien YT
3. [ATTENTE — pipeline d'ingestion]
   téléchargement → encodage →
   séparation → transcription →
   découpage
4. Écran de préparation
   - renomme les personnages
   - réassigne / fusionne / scinde
   - écoute les extraits
   - corrige le texte si illisible
5. Ouvre le lobby
   → récupère lien + code                6. Rejoignent via lien ou code
7. Choisit ses personnages               8. Choisissent leurs personnages
9. Se met prêt                           10. Se mettent prêts
11. Lance la partie
                    ─── STUDIO ───
12. Enregistrent leurs clips, chacun de son côté, à son rythme
    (lire la scène → enregistrer → réécouter → refaire → suivant)
13. Écran d'attente une fois terminé : « on attend X, Y, Z »
14. Peut exclure un joueur bloquant
    → son personnage repasse en VO
15. Lance le rendu quand tout est complet
                    ─── RENDU ───
16. Page de résultat : lecture + téléchargement du MP4
```

---

## 5. Architecture technique

### 5.1 Vue d'ensemble

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js    │────▶│    Supabase      │◀────│     Worker      │
│   (Vercel)   │     │  Postgres        │ poll│  (PC local de   │
│              │     │  Auth            │     │   l'hôte)       │
│  front +     │     │  Storage         │     │  ffmpeg.exe     │
│  API routes  │     │  Realtime        │     │  yt-dlp.exe     │
└──────────────┘     └──────────────────┘     │  node worker.js │
                                               └────────┬────────┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │   ElevenLabs      │
                                              │  Scribe (STT +    │
                                              │  diarisation)     │
                                              │  Audio Isolation  │
                                              └───────────────────┘
```

### 5.2 Stack

| Couche | Choix | Justification |
|---|---|---|
| Front | Next.js 15 (App Router), TypeScript strict, Tailwind, shadcn/ui | Déploiement Vercel trivial, RSC pour les pages statiques, client components pour le studio |
| État client | Zustand (état du studio), TanStack Query (données serveur) | Cohérent avec les conventions existantes |
| Base / Auth / Storage | Supabase | Déjà maîtrisé, RLS, Realtime pour le lobby |
| Temps réel (lobby uniquement) | Supabase Realtime (postgres_changes) | Statut « prêt », progression, exclusions |
| Worker | Node 22, script autonome lancé en local (Windows), **sans Docker** | ffmpeg et yt-dlp sont deux binaires posés dans un dossier ; un `.bat` suffit |
| File d'attente | Table `jobs` Postgres + `FOR UPDATE SKIP LOCKED` | Évite d'ajouter Redis pour 3 jobs/jour |
| STT + diarisation | ElevenLabs Scribe | Un seul appel : texte, locuteurs, timestamps au mot, excellent en français |
| Séparation de sources | Demucs par défaut, ElevenLabs en repli — voir §5.4 et §20.7 | Isolé derrière une interface unique (lot 0) |
| Encodage / mixage | ffmpeg sur le worker | Contrôle total sur le mixage, pas de coût à l'usage |

### 5.3 Le worker : ce qu'il fait, et pourquoi il tourne en local

**Le worker ne sert qu'à trois choses.** Tout le reste — front, auth, base, stockage, enregistrement des prises, lobby temps réel — vit sur Vercel et Supabase et ne demande aucun serveur.

1. **ffmpeg** — réencoder à l'ingestion, mixer l'audio, remuxer le rendu final.
2. **yt-dlp** — récupérer une vidéo YouTube.
3. **Demucs** — séparation de sources, uniquement si l'option B de §5.4 est retenue.

Ces trois briques sont des exécutables, manipulent des fichiers de plusieurs centaines de Mo et tournent pendant des minutes : impossible en serverless.

#### 5.3.1 Déploiement retenu : PC local de l'hôte

**Pas de Docker, pas d'hébergement payant.** Le worker est un script Node unique, accompagné de `ffmpeg.exe` et `yt-dlp.exe` dans le même dossier, lancé par un `.bat` :

```bat
@echo off
cd /d "%~dp0"
node worker.js
```

**Le worker est le seul à initier la connexion.** Il interroge Supabase en boucle (`JOB_POLL_INTERVAL_MS`) pour récupérer les jobs en attente. Aucun port à ouvrir, aucun tunnel, aucune IP fixe, rien à configurer sur la box. Il sort de chez l'hôte tout seul.

Boucle du worker :
```
toutes les N secondes :
  - réclamer un job (UPDATE ... FOR UPDATE SKIP LOCKED)
  - télécharger les fichiers nécessaires depuis Storage (URL signée)
  - traiter en local dans WORK_DIR
  - réuploader le résultat vers Storage
  - marquer le job 'done', nettoyer WORK_DIR
```

**Conséquences produit, toutes assumées :**

| Conséquence | Traitement |
|---|---|
| Les traitements lourds n'avancent que si le PC est allumé | Les jobs attendent en file, le front affiche « en attente du worker » (§12.1) |
| Les joueurs peuvent enregistrer à tout moment | Oui : l'enregistrement passe par le navigateur et Supabase Storage, jamais par le worker |
| Demucs devient viable | La machine de l'hôte est bien plus puissante qu'une instance à 5 €, GPU compris le cas échéant |
| La purge à 24 h ne tient plus | Remplacée par une purge déclenchée **après** le rendu (§13) |

**Portabilité** : le même script doit pouvoir tourner sur un petit VPS sans modification, si l'hôte en a marre d'allumer son PC. Aucun chemin Windows codé en dur, tout passe par `WORK_DIR` et `path.join`.

### 5.4 ⚠️ Décision ouverte : obtenir le stem « fond »

C'est le point à trancher **en premier** (lot 0), car tout le produit en dépend.

**Option A — ElevenLabs Audio Isolation + soustraction de phase**
L'API rend la voix isolée, pas le fond. On reconstruit le fond par soustraction :

```bash
ffmpeg -i original.wav -i voix.wav -filter_complex \
  "[1:a]volume=-1[inv];[0:a][inv]amix=inputs=2:normalize=0[fond]" \
  -map "[fond]" fond.wav
```

- ✅ Rapide, pas de GPU, pas de charge worker.
- ⚠️ Ne fonctionne proprement que si l'API ne modifie ni le gain ni l'EQ ni la phase. **À vérifier empiriquement avant toute autre chose.**

**Option B — Demucs (htdemucs) auto-hébergé sur le worker**
Produit directement les deux stems, proprement séparés.

- ✅ Résultat de référence, réglable, gratuit.
- ⚠️ CPU lourd : compter plusieurs minutes pour 3 min d'audio sur une petite instance. Peut nécessiter une instance plus grosse (~20 €/mois).

**Protocole de décision** : tester l'option A sur 3 scènes représentatives (dialogue sur musique forte, dialogue sec, scène d'action). Si le fond reconstruit est exploitable au casque, retenir A. Sinon B.

**Réglage produit** : quelle que soit l'option, on privilégie **un fond propre** quitte à laisser des résidus de voix audibles en dessous. Ces résidus seront masqués par les doublages posés par-dessus (masquage psychoacoustique). Pas de ducking automatique en V1.

> ⚠️ **Le stem voix ne doit jamais être jeté.** Il est nécessaire pour réinjecter la VO des personnages non doublés (§12.3).

---

## 6. Pipeline d'ingestion

### 6.1 Étapes

Le job d'ingestion est découpé en étapes atomiques, chacune avec un statut visible côté client. C'est un besoin produit, pas un détail : sans retour visuel détaillé, l'utilisateur croit que c'est planté.

| # | Étape | Clé | Détail | Durée indicative (scène 3 min) |
|---|---|---|---|---|
| 1 | Acquisition | `download` | Upload direct → Storage, ou `yt-dlp` | 5–60 s |
| 2 | Normalisation | `encode` | ffmpeg → 720p H.264 + AAC | 20–60 s |
| 3 | Extraction audio | `extract` | WAV 48 kHz stéréo 16 bits | < 5 s |
| 4 | Séparation | `separate` | Option A ou B (§5.4) | 30 s – 5 min |
| 5 | Transcription | `transcribe` | ElevenLabs Scribe sur le **stem voix** | 20–60 s |
| 6 | Découpage | `segment` | Regroupement en répliques puis en clips | < 5 s |

### 6.2 Normalisation (étape 2)

```bash
ffmpeg -i source.mp4 \
  -map 0:v:0 -map 0:a:0 -sn -dn \
  -vf "scale='min(1280,iw)':-2" \
  -c:v libx264 -preset veryfast -crf 23 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  work.mp4
```

> ⚠️ **`-map 0:v:0 -map 0:a:0 -sn -dn` n'est pas optionnel.** Un rip de film contient très souvent plusieurs pistes audio (VF, VO, commentaires) et des pistes de sous-titres. Sans mapping explicite, ffmpeg en prend une au hasard selon ses heuristiques, ou échoue au mux. On force : première piste vidéo, première piste audio, pas de sous-titres, pas de données.
>
> Corollaire : **il faut le dire à l'utilisateur**. Si sa source est multipiste, c'est la première piste audio qui sera doublée. Afficher la liste des pistes détectées par `ffprobe` et laisser choisir serait mieux — noté en V2, pas en V1.

Objectifs : ~20–40 Mo pour 3 min, lecture fluide partout, `faststart` pour le streaming, format unique pour tout le monde (le rendu final ne réencodera que l'audio, voir §12).

**Garde-fous** :
- Durée max en entrée : **10 min**. Au-delà, refus explicite.
- Taille max en upload : **2 Go**.
- Si pas de piste audio → échec propre avec message.

### 6.3 Acquisition YouTube (étape 1)

`yt-dlp` côté worker, format `bestvideo[height<=1080]+bestaudio/best`.

**À dire honnêtement dans l'UI** : cette voie est contraire aux CGU de YouTube et casse régulièrement (il faut mettre `yt-dlp` à jour souvent). L'upload est le chemin principal ; le lien YouTube est un confort qui peut tomber en panne. Prévoir un message d'erreur qui invite à uploader le fichier à la place, plutôt qu'une erreur technique.

### 6.4 Transcription et diarisation (étape 5)

Appel ElevenLabs Scribe sur le stem voix (meilleur taux de reconnaissance que sur l'audio complet) :

```
model_id: scribe_v1
language_code: fra          // paramétrable, auto par défaut
diarize: true
num_speakers: null          // laisser détecter, voir ci-dessous
timestamps_granularity: word
tag_audio_events: false     // V1
```

**Politique de sur-détection** : on préfère que la diarisation éclate un personnage en deux plutôt qu'elle fusionne deux personnages en un. Fusionner deux locuteurs dans l'UI de préparation est un clic ; scinder un locuteur mal fusionné est pénible. Ne pas contraindre `num_speakers` à la baisse.

> Constat terrain : sur un test réel, Scribe a fusionné deux personnages aux timbres proches. L'outillage de correction de §9 est donc **obligatoire**, pas optionnel.

### 6.5 Découpage en répliques puis en clips (étape 6)

**Répliques** : les mots consécutifs d'un même locuteur sont regroupés ; une coupure intervient si le silence entre deux mots dépasse **700 ms** ou si le locuteur change.

**Clips** (unité d'enregistrement) :

```
1. Trier les répliques d'un personnage par start_ms.
2. Fusionner deux répliques consécutives du même personnage si
   (start_suivante - end_précédente) < 3000 ms.
   → un joueur qui a deux répliques rapprochées prononcera de toute
     façon une seule phrase ; le forcer à couper est artificiel.
3. Fenêtre du clip = [première_start - 2000, dernière_end + 2000],
   bornée à [0, durée_vidéo].
4. Les fenêtres de clips peuvent se chevaucher, y compris entre
   personnages différents. C'est voulu : les marges sont du silence
   dans la quasi-totalité des cas, et les chevauchements naturels
   entre personnages doivent être préservés au mixage.
   → NE JAMAIS tronquer une prise pour cause de chevauchement.
```

---

## 7. Modèle de données

Postgres / Supabase. Toutes les tables ont `id uuid primary key default gen_random_uuid()` et `created_at timestamptz default now()`.

```sql
-- Accès restreint : liste blanche d'emails
create table allowed_emails (
  email text primary key,
  added_at timestamptz default now()
);

create type session_status as enum (
  'draft', 'ingest_queued', 'ingesting', 'ingest_failed', 'prepping',
  'lobby', 'recording', 'render_queued', 'rendering', 'render_failed',
  'done'
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                 -- 6 caractères, A-Z2-9 (sans I,O,0,1)
  host_id uuid not null references auth.users(id),
  title text,
  status session_status not null default 'draft',

  source_type text not null,                 -- 'upload' | 'youtube'
  source_ref text,                           -- URL YouTube d'origine
  video_path text,                           -- work.mp4 (Storage)
  stem_voice_path text,
  stem_music_path text,
  duration_ms int,

  render_path text,                          -- MP4 final
  render_size_bytes bigint,

  -- pas de date d'expiration : la purge est déclenchée par le rendu (§13.1)
  purged_at timestamptz,                     -- source supprimée après rendu
  closed_at timestamptz,
  created_at timestamptz default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  display_name text not null,
  is_host boolean not null default false,
  is_ready boolean not null default false,
  is_kicked boolean not null default false,
  mic_offset_ms int not null default 0,      -- calibrage latence, cf. §11.6
  unique (session_id, user_id)
);

create table characters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  speaker_key text not null,                 -- 'speaker_0' venant de Scribe
  name text not null,                        -- 'Personnage 1' puis renommé
  color text not null,                       -- token sémantique, pas un hex en dur
  assigned_to uuid references participants(id) on delete set null,
  is_released boolean not null default false,-- true = garder la VO au mixage
  sort_order int not null default 0
);

create table lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  start_ms int not null,
  end_ms int not null,
  text text not null,
  words jsonb not null                       -- [{w, start_ms, end_ms}, ...]
);

create table clips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  idx int not null,                          -- ordre de passage pour le joueur
  window_start_ms int not null,              -- = début parole - 2000
  window_end_ms int not null,                -- = fin parole + 2000
  speech_start_ms int not null,              -- bornes réelles de parole
  speech_end_ms int not null,
  line_ids uuid[] not null
);

create table takes (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  audio_path text not null,                  -- webm/opus dans Storage
  duration_ms int not null,
  offset_ms int not null default 0,          -- correction manuelle appliquée au rendu
  is_selected boolean not null default true,
  created_at timestamptz default now()
);

create type job_status as enum ('queued','running','done','failed');

create table jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  type text not null,                        -- 'ingest' | 'render'
  status job_status not null default 'queued',
  step text,                                 -- ingest : 'download'|'encode'|'extract'|'separate'|'transcribe'|'segment'
                                             -- render : 'fetch'|'mix'|'mux'|'upload'|'purge'
  claimed_by text references workers(id) on delete set null,
  progress int not null default 0,           -- 0-100
  error text,
  attempts int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- Présence du worker local : permet au front d'afficher
-- « en attente du worker » plutôt qu'une barre figée (§12.1)
create table workers (
  id text primary key,                       -- nom de machine
  last_seen_at timestamptz not null default now(),
  current_job_id uuid references jobs(id) on delete set null
);

create index on jobs (status, created_at);
create index on clips (session_id, character_id, idx);
create index on takes (clip_id, is_selected);

-- Une seule prise retenue par clip. Sans cet index, le rendu
-- mixerait deux prises superposées sur le même clip.
create unique index one_selected_take_per_clip
  on takes (clip_id) where is_selected;

-- Ordre de passage stable pour le joueur
create unique index unique_clip_idx
  on clips (session_id, character_id, idx);
```

### 7.2 Réclamation d'un job : fonction SQL obligatoire

> ⚠️ **Point que Claude Code va rater s'il n'est pas explicite.** `FOR UPDATE SKIP LOCKED` est du SQL brut : il est **impossible** de l'exprimer via le client `supabase-js`, qui passe par PostgREST. Il faut une fonction Postgres appelée en RPC.

```sql
create or replace function claim_job(p_worker_id text)
returns jobs
language plpgsql
security definer
as $$
declare
  v_job jobs;
begin
  -- heartbeat au passage
  insert into workers (id, last_seen_at)
    values (p_worker_id, now())
    on conflict (id) do update set last_seen_at = now();

  select * into v_job
  from jobs
  where status = 'queued' and attempts < 3
  order by created_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update jobs
     set status = 'running',
         claimed_by = p_worker_id,
         attempts = attempts + 1,
         started_at = now()
   where id = v_job.id
  returning * into v_job;

  update workers set current_job_id = v_job.id where id = p_worker_id;

  return v_job;
end;
$$;

revoke all on function claim_job(text) from public, anon, authenticated;
```

Côté worker : `await supabase.rpc('claim_job', { p_worker_id: WORKER_ID })`. Retourne `null` s'il n'y a rien à faire.

**Reprise après crash** : un job `running` dont le worker n'a plus donné signe depuis 10 min est remis en `queued`. À faire au démarrage du worker, pas dans un cron :

```sql
update jobs set status = 'queued', claimed_by = null
where status = 'running'
  and started_at < now() - interval '10 minutes';
```

### 7.1 Règles RLS (essentielles)

- `sessions` : lisible par les participants de la session uniquement. Insérable par un utilisateur dont l'email est dans `allowed_emails`.
- `characters`, `lines`, `clips` : lisibles par les participants ; modifiables par l'hôte seul.
- `takes` : un participant ne peut lire/écrire que ses propres prises **avant** le rendu ; tous peuvent lire après passage en `done`.
- `jobs` : lecture seule côté client (pour la barre de progression), écriture réservée à la clé service du worker.
- `workers` : lecture seule côté client (pour le message « en attente du worker »), écriture réservée à la clé service.
- Storage : buckets privés, accès par URL signée à durée courte (15 min).

---

## 8. Machine à états de la session

```
draft
  └─ upload/lien fourni ──▶ ingest_queued
ingest_queued  (job en file — attend un worker)
  └─ worker disponible ───▶ ingesting
                              ├─ échec ──▶ ingest_failed ──(retry)──▶ ingest_queued
                              └─ succès ─▶ prepping
prepping   (hôte prépare les personnages)
  └─ « Ouvrir le lobby » ──▶ lobby
lobby      (joueurs rejoignent, choisissent, se déclarent prêts)
  └─ hôte lance ──────────▶ recording
recording  (studio ouvert pour tous)
  └─ hôte lance le rendu ──▶ render_queued
render_queued  (job en file — le worker le prendra quand il tournera)
  └─ worker disponible ───▶ rendering
                              ├─ échec ──▶ render_failed ──(retry)──▶ render_queued
                              └─ succès ─▶ done
done
  └─ purge de la source, immédiatement après le rendu réussi
     (le statut reste `done`)
```

**Règle dure** : la source n'est **jamais** supprimée sur une base de temps. Elle l'est uniquement une fois le rendu produit avec succès. Tant qu'une session n'est pas en `done`, sa source est intouchable, même vieille de trois semaines. C'est la conséquence directe du worker local : si le PC reste éteint deux jours, le travail des joueurs doit survivre.

---

## 9. Écran de préparation (hôte)

C'est l'écran qui absorbe les erreurs de la diarisation. Il doit être rapide à utiliser, pas exhaustif.

### 9.1 Contenu

- **Colonne gauche** — liste des personnages détectés. Pour chacun : nom éditable, couleur, nombre de répliques, durée totale de parole, bouton ▶ qui joue **l'extrait le plus long** du personnage (le meilleur pour l'identifier).
- **Colonne droite** — timeline des répliques, dans l'ordre chronologique, colorées par personnage. Chaque réplique : timecode, texte, bouton ▶.

### 9.2 Opérations obligatoires

| Opération | Interaction | Effet |
|---|---|---|
| **Renommer** un personnage | Édition inline | `characters.name` |
| **Réassigner** une réplique | Menu sur la réplique, ou glisser-déposer vers un personnage | `lines.character_id` |
| **Fusionner** deux personnages | Sélection multiple → « Fusionner » | Toutes les `lines` migrent vers le personnage cible, l'autre est supprimé |
| **Scinder** un personnage | Sélection de répliques → « Déplacer vers un nouveau personnage » | Crée un personnage et y migre les répliques sélectionnées |
| **Corriger le texte** | Édition inline | `lines.text` — **confort uniquement** (§9.3) |
| **Supprimer** une réplique | Bouton | La réplique ne sera pas doublable ; la VO est conservée à cet endroit |

### 9.3 Statut du texte

Le texte transcrit **n'est qu'un guide de timing**. Un joueur peut dire tout autre chose — c'est même souvent l'intérêt du jeu. La correction du texte par l'hôte n'existe que pour les cas où la transcription est illisible au point de gêner la lecture de la bande rythmo. Ce n'est jamais bloquant.

### 9.4 Recalcul

Toute modification de personnage ou de réplique **invalide les clips** et déclenche un recalcul du découpage (§6.5). C'est instantané, aucun job nécessaire. Interdire toute modification de préparation une fois la session passée en `lobby`.

---

## 10. Lobby

### 10.1 Création et accès

- L'hôte obtient **un lien** (`/s/{code}`) et **un code à 6 caractères**.
- Un joueur arrive : magic link Supabase si non connecté, vérification de la liste blanche, puis création de son `participant`.
- Alphabet du code : `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sans caractères ambigus).

### 10.2 Contenu

- Lecteur de la scène en VO, librement consultable avant de choisir.
- Liste des personnages avec durée de parole, nombre de clips, et le joueur assigné.
- **Un joueur peut prendre plusieurs personnages.** Un personnage ne peut être pris que par un joueur.
- Bouton « Je suis prêt » par joueur, état diffusé en temps réel.
- Côté hôte : bouton « Lancer », actif seulement si **chaque personnage est soit assigné, soit libéré** (§10.3) et si **tous les joueurs présents sont prêts**.

### 10.3 Personnages non assignés

Si un personnage reste sans joueur au lancement, l'hôte peut le **libérer** (`is_released = true`) : sa VO sera conservée telle quelle dans le rendu. C'est le même mécanisme que pour un joueur exclu (§11.8).

---

## 11. Studio d'enregistrement

Le cœur du produit. Chaque joueur y est **seul** : il n'entend jamais les prises des autres, il ne sait même pas où ils en sont. Tout se découvre au rendu final.

### 11.1 Disposition

```
┌─────────────────────────────────────────────────────────┐
│  Personnage : « Tyrion »        Clip 3 / 7    ●●●○○○○    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [ VIDÉO 16:9 ]                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┬───────────────────────┐  │
│  │   texte qui défile ────▶  ┃  ◀──── texte à venir  │  │   BANDE RYTHMO
│  └───────────────────────────┴───────────────────────┘  │
│                          tête de lecture                │
├─────────────────────────────────────────────────────────┤
│  ▓▓▒▒░░████████████████░░▒▒▓▓     ← forme d'onde         │
│  |─2s─|──── zone de parole ────|─2s─|                    │
├─────────────────────────────────────────────────────────┤
│  [▶ Lire la scène (VO)]  [⏺ Enregistrer]  [▶ Ma prise]  │
│  [↺ Refaire]   [✓ Valider]   [◀ Préc.]   [Suiv. ▶]      │
│  Fond sonore : ▬▬▬▬○──  60%    Décalage micro : −40 ms   │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Les trois modes de lecture

| Mode | Vidéo | Audio entendu | Micro |
|---|---|---|---|
| **Lire la scène (VO)** | oui | mix original complet, voix incluses | off |
| **Enregistrer** | oui | **stem fond uniquement** (volume réglable, coupable) | **on** |
| **Ma prise** | oui | stem fond + la prise du joueur | off |

C'est la règle la plus importante du studio : **pendant l'enregistrement, le joueur n'entend jamais les voix originales.** Il a l'image et la bande rythmo comme repères de timing, et la musique de fond comme ancrage rythmique. Le casque est obligatoire, mais comme la sortie ne contient aucune voix, une éventuelle captation par le micro reste inoffensive.

### 11.3 Bande rythmo

- Piste horizontale sous la vidéo, le texte défile **de droite à gauche**, une tête de lecture verticale fixe est placée à ~35 % de la largeur.
- Un mot passe exactement sous la tête de lecture à son `start_ms` (données de `lines.words`).
- Le mot en cours est mis en valeur ; les mots passés sont atténués.
- Les répliques des **autres personnages** apparaissent aussi, dans leur couleur, atténuées — pour que le joueur sache quand on lui répond.
- Rendu en `<canvas>` piloté par `requestAnimationFrame`, synchronisé sur `video.currentTime` (pas sur un timer indépendant, sous peine de dérive).

### 11.4 Boucle d'enregistrement

```
1. Le joueur clique sur ⏺.
2. La vidéo saute à window_start_ms et démarre IMMÉDIATEMENT.
   → Pas de décompte. Les 2 s de marge tiennent ce rôle.
3. MediaRecorder démarre au même instant ; t0 est horodaté.
4. À window_end_ms : arrêt automatique de la lecture et de
   l'enregistrement.
   (Le joueur peut aussi arrêter manuellement.)
5. La prise est uploadée, une forme d'onde est calculée et affichée.
6. Il réécoute, refait, ou valide.
```

**Contraintes MediaRecorder** :

```js
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,   // casque obligatoire : l'AEC dégrade la voix
    noiseSuppression: true,
    autoGainControl: false,    // préserve la dynamique du jeu d'acteur
    channelCount: 1,
    sampleRate: 48000,
  }
})
```
Format : `audio/webm;codecs=opus`, ~96 kbps. Une prise de 10 s pèse ~120 Ko.

### 11.5 Durée : pas d'étirement

La fenêtre du clip est **fixe**. Aucun time-stretch, aucune correction automatique.

Si le joueur déborde de la zone de parole, il faut le lui montrer **avant** le rendu, sinon il ne comprendra pas pourquoi sa prise est coupée :
- La forme d'onde affiche la zone de parole autorisée en surbrillance et les marges en grisé.
- Si le signal dépasse la fenêtre du clip → avertissement explicite : « Ta prise dépasse la fenêtre, la fin sera coupée. Refais-la plus court. »
- Ce n'est **pas bloquant** : il peut valider quand même.

### 11.6 Latence micro

Le navigateur introduit un décalage de quelques dizaines de ms entre ce qui est entendu et ce qui est capté. En pratique c'est souvent imperceptible et uniforme, donc corrigeable globalement.

- Réglage `mic_offset_ms` par joueur, de **−300 à +300 ms**, persistant (stocké sur `participants` + miroir `localStorage`).
- Appliqué au moment du mixage, pas à l'enregistrement.
- Prévoir un **calibrage optionnel** : lecture d'un clic, captation, mesure automatique du décalage. Confort, non bloquant pour la V1.

### 11.7 Progression et écran d'attente

- Progression du joueur : `clips validés / clips assignés`.
- Une fois tous ses clips validés → écran « Tu as fini ! On attend encore : *Marie (2/5)*, *Julien (0/3)* ».
- Cet écran est en temps réel. Le joueur peut toujours revenir modifier une prise tant que le rendu n'est pas lancé.

### 11.8 Exclusion par l'hôte

Depuis l'écran d'attente ou le lobby, l'hôte peut exclure un joueur bloquant :

```
participant.is_kicked = true
→ pour chacun de ses personnages : is_released = true, assigned_to = null
→ au mixage, la VO de ces personnages est réinjectée (§12.3)
→ ses prises déjà enregistrées sont ignorées
```

Alternative proposée dans l'UI : **réassigner** le personnage à un joueur volontaire plutôt que le libérer.

---

## 12. Moteur de rendu

### 12.1 Déclenchement

Déclenché manuellement par l'hôte, **possible uniquement si** tout clip appartenant à un personnage non libéré possède une prise retenue.

Le clic ne lance pas le rendu : il **met un job en file**. La session passe en `render_queued` et se fige immédiatement — plus aucune prise modifiable, même si le worker ne tourne pas encore.

**Le front doit rendre cette attente lisible**, sinon l'utilisateur croit que c'est cassé :

| Situation | Affichage |
|---|---|
| Aucun worker n'a réclamé de job depuis > 60 s | « En attente du worker — lance le script sur ton PC » |
| Job réclamé, en cours | Barre de progression, étape en cours |
| Terminé | Redirection vers la page de résultat |

Concrètement : si le worker tourne déjà, le rendu démarre dans les secondes qui suivent et la file est invisible. S'il est éteint, le job patiente et démarre dès le lancement du `.bat`. **Aucune différence de code entre les deux cas** — c'est le même chemin, avec un délai variable.

Pour détecter la présence d'un worker, celui-ci met à jour `workers.last_seen_at` (§7) à chaque tour de boucle. Le front compare l'horodatage à `now()` — au-delà de 60 s, il considère qu'aucun worker ne tourne.

Le même mécanisme s'applique à l'ingestion : `ingest_queued` affiche le même message d'attente.

### 12.2 Assemblage audio

Entrées :
- `fond.wav` — stem fond, durée complète.
- `voix.wav` — stem voix, durée complète (pour les personnages libérés).
- N prises de joueurs, chacune à poser à `clip.window_start_ms + take.offset_ms + participant.mic_offset_ms`.

Chaque prise est décalée par `adelay`, puis tout est sommé sans normalisation automatique :

```bash
ffmpeg -i fond.wav -i take1.webm -i take2.webm \
 -filter_complex "
   [1:a]aresample=48000,aformat=channel_layouts=stereo,adelay=12480:all=1[t1];
   [2:a]aresample=48000,aformat=channel_layouts=stereo,adelay=31200:all=1[t2];
   [0:a][t1][t2]amix=inputs=3:normalize=0:duration=first[mixed];
   [mixed]loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97[out]
 " -map "[out]" -c:a pcm_s16le mix.wav
```

**Points d'attention — chacun de ces quatre points casse le rendu s'il est raté** :

1. **`normalize=0` est impératif.** Sans ça, `amix` divise le gain par le nombre d'entrées : avec 20 prises, tout devient inaudible.
2. **`adelay=X:all=1`**, pas `adelay=X|X`. Les prises sont mono (`channelCount: 1`, §11.4) ; la syntaxe à pipes suppose de connaître le nombre de canaux. `all=1` applique le même retard à tous les canaux quel qu'en soit le nombre. Le `aresample` + `aformat` en amont force la conversion mono → stéréo.
3. **`duration=first`.** Par défaut `amix` s'arrête au flux le plus long ; on veut que le mix fasse exactement la durée de `fond.wav` (première entrée), sinon une prise qui déborde allonge la piste audio par rapport à la vidéo.
4. **`loudnorm` AVANT `alimiter`.** L'inverse est un contresens : `loudnorm` réapplique un gain global et annulerait le travail du limiteur. Le limiteur doit être le dernier maillon.

Les prises peuvent se **chevaucher** librement, entre elles et entre personnages. C'est le comportement voulu.

**Taille du filtergraph** : avec ~20 clips et ~20 segments VO, on arrive à ~40 entrées. C'est supportable par `amix`, mais la ligne de commande devient très longue. Sous Windows, la limite de `cmd.exe` est de 8191 caractères — **écrire le filtergraph dans un fichier et utiliser `-filter_complex_script fichier.txt`**, et lancer ffmpeg via `spawn` sans shell (§20.2).

### 12.3 Réinjection de la VO (personnages libérés)

Pour chaque personnage `is_released`, on rejoue **uniquement ses répliques** depuis le stem voix, en ouvrant le volume sur ses intervalles et en le laissant à zéro partout ailleurs :

> ⚠️ **Piège** : `volume=0:enable='between(...)'` fait exactement l'inverse de ce qu'on veut. L'option `enable` active le *filtre* pendant l'intervalle — donc coupe le son pendant les répliques et le laisse passer partout ailleurs.

**Méthode retenue — découpe explicite, une entrée par réplique.** Plus verbeuse mais sans ambiguïté, et elle permet les fondus proprement :

```
[1:a]asplit=3[v0][v1][v2];
[v0]atrim=start=12.40:end=15.90,asetpts=PTS-STARTPTS,
    afade=t=in:st=0:d=0.05,afade=t=out:st=3.45:d=0.05,
    adelay=12400:all=1[vo0];
[v1]atrim=start=48.20:end=51.00,asetpts=PTS-STARTPTS,
    afade=t=in:st=0:d=0.05,afade=t=out:st=2.75:d=0.05,
    adelay=48200:all=1[vo1];
...
```

Règles de génération :
- `asplit=N` où **N = nombre total de répliques de tous les personnages libérés**. Une entrée ffmpeg ne peut être consommée qu'une fois, il faut la dupliquer explicitement.
- Le `st` du `afade=t=out` vaut `(end - start) - 0.05`, en secondes.
- `adelay` prend des **millisecondes**, `atrim` et `afade` des **secondes**. Ne pas mélanger — c'est l'erreur classique.
- Les `[voN]` rejoignent l'`amix` de §12.2 comme entrées supplémentaires.

**Alternative si le filtergraph devient ingérable** : générer une piste VO complète dans une passe ffmpeg séparée, puis la mixer comme entrée unique. Deux passes, mais un graphe deux fois plus simple à déboguer.

### 12.4 Mux final

La vidéo est **copiée sans réencodage** — c'est tout l'intérêt d'avoir normalisé à l'ingestion :

```bash
ffmpeg -i work.mp4 -i mix.wav \
  -map 0:v:0 -map 1:a:0 -shortest \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  final.mp4
```

`-shortest` en garde-fou : si le mix fait ne serait-ce que quelques ms de plus que la vidéo, certains lecteurs affichent un écran noir en fin de fichier.

### 12.5 Sous-titres

**Aucun sous-titre n'est incrusté dans le rendu final.** La bande rythmo et le texte sont des éléments d'interface du studio uniquement. Le MP4 final ne contient que l'image d'origine et l'audio remixé. Pas non plus de piste de sous-titres embarquée.

### 12.6 Page de résultat

- Lecteur du MP4 final.
- Bouton de téléchargement (URL signée).
- Rappel de la distribution : qui a doublé qui.
- Lien de partage **interne à la session** (accessible aux participants uniquement).

---

## 13. Stockage et rétention

| Objet | Emplacement | Conservation |
|---|---|---|
| Vidéo source normalisée (`work.mp4`) | `sources` (privé) | jusqu'au rendu réussi |
| `voix.wav`, `fond.wav` | `sources` (privé) | jusqu'au rendu réussi |
| Fichier brut d'upload / téléchargement YT | `WORK_DIR` du worker | supprimé en fin de job |
| Prises des joueurs (`.webm`) | `takes` (privé) | jusqu'au rendu réussi |
| **Rendu final (`final.mp4`)** | `renders` (privé) | **conservé jusqu'à suppression manuelle** |
| Métadonnées (personnages, répliques, distribution) | Postgres | conservées avec le rendu |

### 13.1 Purge automatique, déclenchée par le rendu

Pas de cron, pas d'horloge. Le worker purge lui-même, en dernière étape du job de rendu :

```
job 'render' :
  1. mixer, muxer
  2. uploader final.mp4 vers renders/{session_id}/
  3. vérifier que l'upload est bien arrivé (taille > 0, HEAD OK)
  4. seulement alors : supprimer sources/{session_id}/* et takes/{session_id}/*
  5. vider video_path, stem_voice_path, stem_music_path
  6. session.status = 'done'
```

L'étape 3 n'est pas cosmétique : purger avant d'avoir confirmé l'upload, c'est perdre la session. La colonne `source_expires_at` disparaît du schéma (§7), elle n'a plus de sens.

### 13.2 Suppression manuelle

L'hôte peut supprimer une session depuis la liste de ses sessions. Effet : suppression du rendu, des prises éventuelles, et des métadonnées en cascade. Confirmation explicite demandée, c'est irréversible.

### 13.3 Quotas Supabase

Le plan gratuit plafonne à **1 Go de stockage** et **2 Go de bande passante sortante par mois**. Un rendu de 3 min en 720p pèse ~30 Mo, soit une trentaine de sessions conservées.

Deux conséquences à implémenter :

- **Indicateur d'espace** visible par l'hôte, du type « 420 Mo / 1 Go », calculé en sommant `render_size_bytes`. Il doit voir la saturation arriver, pas la découvrir sur un upload en échec.
- **Alerte à 80 %** invitant à supprimer d'anciennes sessions.

Le dépassement de bande passante est le plus sournois : chaque relecture d'un rendu la consomme. Prévoir simplement de ne pas précharger les vidéos dans les listes (`preload="none"`, vignette statique).

---

## 14. Sécurité et accès

- Authentification Supabase par magic link.
- Table `allowed_emails` en liste blanche : un email absent ne peut ni créer ni rejoindre une session. Message clair, pas d'erreur cryptique.
- Aucune page publique, aucun index, `robots.txt` en `Disallow: /`.
- Buckets Storage privés, accès exclusivement par URL signée courte durée.
- La clé ElevenLabs et la clé service Supabase ne vivent que sur le worker. Jamais côté client, jamais dans une variable `NEXT_PUBLIC_*`.
- Taille d'upload et durée vidéo plafonnées (§6.2) pour éviter de saturer disque et budget.

**Sur les droits d'auteur** : le produit manipule des extraits d'œuvres protégées. L'usage est privé, entre amis, non diffusé, non monétisé. Cette contrainte est structurelle et doit rester tenue : pas de galerie publique, pas de partage hors session, pas d'indexation.

---

## 15. Lots de développement

Chaque lot est livrable et testable seul. L'ordre est conçu pour tuer le risque au plus tôt.

### Lot 0 — Validation de la séparation (½ journée, en parallèle)

Ce test se fera sur des scènes réelles, quand l'occasion se présentera. **Il ne bloque pas le développement**, à une condition non négociable : la séparation doit être isolée derrière une interface unique, de sorte que basculer d'une méthode à l'autre ne touche qu'un seul fichier.

```ts
// worker/separation/index.ts
export interface SeparationResult { voicePath: string; musicPath: string }

export async function separate(
  inputWav: string,
  outDir: string,
  onProgress: (pct: number) => void
): Promise<SeparationResult>
```

Deux implémentations derrière ce contrat : `separation/elevenlabs.ts` et `separation/demucs.ts`, sélectionnées par `SEPARATION_MODE`. **Aucun appel direct à l'une ou l'autre ailleurs dans le code.** Tout le reste du pipeline ne connaît que `voicePath` et `musicPath`.

Quand le test aura lieu :
1. Trois scènes : dialogue sur musique forte, dialogue sec, scène d'action.
2. Écouter au casque le fond reconstruit par l'option A (§5.4).
3. Comparer avec Demucs sur les mêmes extraits.
4. Basculer `SEPARATION_MODE` et ne rien toucher d'autre.

**Défaut conseillé en attendant** : `SEPARATION_MODE=demucs`. C'est le résultat de référence, il tourne en local sans coût, et la machine de l'hôte est largement dimensionnée pour ça. ElevenLabs reste l'option de repli si Demucs se révèle trop lent à l'usage.

### Lot 1 — Socle et ingestion (2–3 jours)
- Projet Next.js, Supabase, schéma complet, RLS, liste blanche, auth magic link.
- Worker local : `start.bat` + bootstrap auto-installant les dépendances (§20.1), boucle de jobs Postgres via `claim_job` (§7.2), heartbeat.
- **Critère de lot** : sur une machine Windows vierge où seul Node est installé, un double-clic sur `start.bat` amène le worker jusqu'à sa boucle de polling, sans aucune étape manuelle hors saisie des clés.
- Pipeline complet : upload → encode → extract → separate → transcribe → segment.
- Page de progression détaillée par étape.
- **Critère** : depuis un MP4, obtenir en base des personnages, des répliques et des clips corrects.

### Lot 2 — YouTube (½ journée)
- `yt-dlp` dans le worker, gestion d'erreur explicite et invitation à uploader en repli.

### Lot 3 — Préparation (2 jours)
- Écran hôte complet : renommer, réassigner, fusionner, scinder, écouter, supprimer.
- Recalcul des clips après modification.
- **Critère** : corriger une diarisation qui a fusionné deux personnages, en moins d'une minute.

### Lot 4 — Lobby (1–2 jours)
- Création de session, code, lien, arrivée des joueurs.
- Choix de personnages (multiples), statut prêt, Realtime, lancement.

### Lot 5 — Studio (4–5 jours) ⭐ le plus gros
- Trois modes de lecture (§11.2), verrouillage strict de l'audio pendant l'enregistrement.
- Bande rythmo canvas synchronisée sur `video.currentTime`.
- Boucle d'enregistrement, upload des prises, forme d'onde, avertissement de dépassement.
- Navigation entre clips, réenregistrement, validation.
- Réglages : volume du fond, décalage micro.
- **Critère** : doubler 5 clips d'affilée sans confusion ni décalage perceptible.

### Lot 6 — Attente et exclusion (1 jour)
- Écran d'attente temps réel, exclusion, libération et réassignation de personnages.

### Lot 7 — Rendu (2–3 jours)
- Job de rendu, mixage ffmpeg complet avec réinjection VO, mux final.
- Page de résultat, téléchargement.
- **Critère** : un MP4 où les voix des joueurs sont calées, la musique préservée, aucun sous-titre incrusté.

### Lot 8 — Rétention et finitions (1 jour)
- Purge de la source en fin de job de rendu, après vérification de l'upload.
- Suppression manuelle d'une session, indicateur d'espace utilisé, alerte à 80 %.
- Gestion d'erreur de bout en bout, reprise de job, états vides, messages en français.

**Total indicatif : 3 à 4 semaines** à rythme soutenu.

---

## 16. V2 — Pistes explicitement reportées

### 16.1 Le rôle du bruiteur ⭐ la meilleure idée en attente

Détecter les événements sonores non verbaux — rires, applaudissements, cris, grognements, pas, portes — et les proposer comme clips doublables, assignables à un joueur dédié : **le bruiteur**.

Techniquement : classification d'événements audio via **YAMNet** (Google) ou **PANNs**, tous deux open source et gratuits, mais exécutés en Python côté worker — donc du temps de traitement et une brique de plus à maintenir.

**Limite structurelle à connaître** : ces événements se trouvent majoritairement dans le **stem fond**, pas dans le stem voix. Les supprimer pour les remplacer supposerait une séparation fine du fond, ce qui est nettement plus casse-gueule. Le compromis retenu pour la V2 : on les détecte, on les propose à doubler, et le joueur les double **par-dessus** l'original sans le supprimer. ElevenLabs Scribe propose d'ailleurs `tag_audio_events` qui pourrait suffire à repérer les plus évidents, sans modèle supplémentaire.

### 16.2 Autres
- Calibrage automatique de la latence micro.
- Catalogue de scènes préparées et réutilisables.
- Ducking automatique du fond sous les doublages.
- Export des stems séparés.
- Mode « deux joueurs doublent la même scène, on compare ».

---

## 17. Critères d'acceptation de la V1

- [ ] Un MP4 de 3 min importé produit un projet doublable en moins de 5 minutes, avec progression détaillée visible.
- [ ] Un lien YouTube fonctionne, et en cas d'échec propose l'upload sans erreur technique.
- [ ] Les personnages détectés sont renommables ; une fusion erronée de la diarisation se corrige en moins d'une minute.
- [ ] Un joueur rejoint par code ou par lien, prend un ou plusieurs personnages, se déclare prêt.
- [ ] Pendant l'enregistrement, aucune voix originale n'est audible ; seul le fond sonore l'est, avec volume réglable.
- [ ] Un dépassement de fenêtre est signalé visuellement avant validation.
- [ ] Deux répliques du même personnage espacées de moins de 3 s sont proposées en un seul clip.
- [ ] Les prises qui se chevauchent ne sont jamais tronquées.
- [ ] Un joueur exclu voit son personnage rendu en VO dans le mixage final.
- [ ] Le MP4 final ne contient aucun sous-titre incrusté, conserve la musique d'origine, et se télécharge.
- [ ] La source est purgée automatiquement après le rendu, et jamais avant.
- [ ] Un rendu lancé PC éteint attend en file et démarre seul au lancement du worker, avec un message clair entre-temps.
- [ ] L'hôte peut supprimer une session et voit l'espace de stockage consommé.
- [ ] Un double-clic sur `start.bat` installe ce qui manque et démarre le worker ; relancé ensuite, il démarre en moins de trois secondes sans rien réinstaller.

---

## 18. Conventions d'implémentation

- **Zéro valeur codée en dur** : couleurs par tokens sémantiques, durées et seuils (marge 2 s, gap 3 s, silence 700 ms, plafonds) dans un module `config/constants.ts` unique.
- **TypeScript strict**, types générés depuis Supabase (`supabase gen types`).
- **Toutes les chaînes visibles en français**, centralisées, même sans i18n multilingue en V1 — pour ne pas avoir à tout reprendre plus tard.
- **Le worker ne fait jamais confiance au client** : toute écriture de statut de session ou de job passe par la clé service.
- **Jobs idempotents** : un job relancé après crash doit reprendre sans dupliquer de fichiers ni de lignes.
- **Logs structurés** côté worker, avec `session_id` et `step` systématiques : c'est le seul endroit où l'on pourra déboguer un pipeline de 5 minutes.

---

## 19. Variables d'environnement

```bash
# ── Front (Vercel) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=

# ── Worker ──────────────────────────────────────────────
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=
SEPARATION_MODE=demucs       # | elevenlabs
WORKER_ID=pc-alex            # identifiant de la machine, pour le heartbeat
WORK_DIR=./work              # jamais de chemin absolu Windows codé en dur

# Binaires — chemins relatifs, résolus via path.resolve()
FFMPEG_PATH=./bin/ffmpeg.exe
FFPROBE_PATH=./bin/ffprobe.exe
YTDLP_PATH=./bin/yt-dlp.exe

# Demucs
PYTHON_PATH=python
DEMUCS_MODEL=htdemucs
DEMUCS_DEVICE=cuda           # | cpu
DEMUCS_JOBS=2                # CPU uniquement, ignoré en cuda
DEMUCS_SEGMENT=7             # réduire si erreur mémoire

# Garde-fous
MAX_VIDEO_DURATION_MS=600000
MAX_UPLOAD_BYTES=2147483648
JOB_POLL_INTERVAL_MS=2000
JOB_MAX_ATTEMPTS=3
JOB_STALE_MINUTES=10
MAX_CONCURRENT_JOBS=1        # ffmpeg et Demucs saturent la machine, un à la fois
```

---

## 20. Annexe — intégration des outils externes

Cette section existe pour qu'aucune de ces briques ne soit devinée. Chemins d'installation, arguments exacts, forme des sorties, pièges connus.

### 20.1 Bootstrap automatique des dépendances

**Exigence produit** : l'hôte ne lance jamais qu'une seule chose, `start.bat`. Si une dépendance manque, elle s'installe toute seule ; si elle est là, on passe directement au worker. Aucune installation manuelle, aucune documentation à suivre.

#### 20.1.1 `start.bat`

```bat
@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est introuvable.
  echo Installe-le depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b 1
)

node scripts\bootstrap.mjs
if errorlevel 1 (
  echo.
  echo L'installation des dependances a echoue. Rien n'a ete lance.
  pause
  exit /b 1
)

node worker.js
pause
```

**Node est la seule exception** : on ne peut pas bootstrapper en Node si Node n'est pas là. Le `.bat` le détecte et renvoie vers nodejs.org. Tout le reste est pris en charge.

#### 20.1.2 `scripts/bootstrap.mjs` — principe

Un script Node autonome, **sans aucune dépendance npm** (uniquement `node:fs`, `node:https`, `node:child_process`, `node:zlib`). Il ne doit pas dépendre d'un `npm install` qui n'a peut-être pas encore tourné.

Pour chaque dépendance, toujours le même cycle :

```
1. VÉRIFIER  → la commande de contrôle répond-elle ?
2. SI OUI    → log « ✓ ffmpeg 7.1 » et on passe à la suivante
3. SI NON    → installer, puis re-vérifier
4. SI L'INSTALL ÉCHOUE → message actionnable + code de sortie 1
```

**Le script est idempotent.** Le relancer dix fois de suite ne doit rien réinstaller ni rien casser. Aucun état persisté, aucun fichier marqueur : la vérification elle-même est la source de vérité, elle prend une seconde et ne peut pas se désynchroniser de la réalité.

#### 20.1.3 Tableau des dépendances

| # | Dépendance | Vérification | Installation si absente |
|---|---|---|---|
| 1 | **npm install** | `node_modules/` existe | `npm ci` (ou `npm install` si pas de lockfile) |
| 2 | **ffmpeg + ffprobe** | `bin/ffmpeg.exe -version` → code 0 | Télécharger `ffmpeg-release-essentials.zip` depuis gyan.dev, dézipper, copier les deux `.exe` dans `bin/` |
| 3 | **yt-dlp** | `bin/yt-dlp.exe --version` → code 0 | Télécharger `yt-dlp.exe` depuis la dernière release GitHub du projet vers `bin/` |
| 4 | **Python 3.10+** | `python --version` → code 0 **et** version ≥ 3.10 | `winget install -e --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements` |
| 5 | **PyTorch** | `python -c "import torch"` → code 0 | Voir 20.1.5 (dépend du GPU) |
| 6 | **Demucs** | `python -m demucs --help` → code 0 | `python -m pip install -U demucs` |
| 7 | **Poids du modèle** | Voir 20.1.6 | Premier lancement à vide |
| 8 | **`.env`** | Le fichier existe et contient les clés requises | Copier `.env.example`, puis demander les valeurs manquantes en interactif |

L'ordre compte : Python avant PyTorch, PyTorch avant Demucs.

#### 20.1.4 Téléchargement et décompression

Pas de `curl`, pas de `wget`, pas de `tar` : leur présence n'est pas garantie sur toutes les versions de Windows.

```js
// Téléchargement : fetch natif de Node 22, en suivant les redirections
const res = await fetch(url, { redirect: 'follow' });
if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
await pipeline(Readable.fromWeb(res.body), createWriteStream(tmpPath));
```

Pour le zip de ffmpeg, passer par PowerShell, disponible partout :

```js
spawnSync('powershell', [
  '-NoProfile', '-NonInteractive', '-Command',
  `Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force`
], { stdio: 'inherit' });
```

> ⚠️ L'archive de ffmpeg contient un dossier racine dont **le nom change à chaque version** (`ffmpeg-7.1-essentials_build/`). Ne jamais coder ce chemin en dur : parcourir récursivement `extractDir` à la recherche de `ffmpeg.exe` et `ffprobe.exe`, et les copier dans `bin/`.

Afficher une progression pendant les téléchargements — le zip de ffmpeg pèse une centaine de Mo, une console figée donne l'impression d'un plantage. `content-length` suffit à calculer un pourcentage.

#### 20.1.5 PyTorch : détecter le GPU avant d'installer

Une erreur de wheel ici, et Demucs tourne dix fois plus lentement sans que rien ne le signale.

```js
const hasNvidia = spawnSync('nvidia-smi', [], { stdio: 'ignore' }).status === 0;

const args = hasNvidia
  ? ['-m','pip','install','torch','--index-url','https://download.pytorch.org/whl/cu121']
  : ['-m','pip','install','torch'];
```

Puis écrire `DEMUCS_DEVICE=cuda` ou `cpu` dans le `.env` en conséquence, et le confirmer à l'écran :

```
✓ GPU NVIDIA détecté → PyTorch CUDA, DEMUCS_DEVICE=cuda
```

Vérification finale, qui est la seule qui compte vraiment :

```
python -c "import torch; print(torch.cuda.is_available())"
```

Si elle renvoie `False` alors qu'un GPU a été détecté, le dire explicitement plutôt que de continuer en silence : c'est le signe d'un wheel CPU déjà installé qu'il faut désinstaller d'abord.

#### 20.1.6 Préchargement des poids du modèle

Au tout premier appel, Demucs télécharge les poids de `htdemucs` (plusieurs centaines de Mo) dans son cache. Si ça arrive pendant un vrai job, l'utilisateur voit une étape bloquée plusieurs minutes sans explication.

Le bootstrap force donc ce téléchargement à froid : générer deux secondes de silence avec ffmpeg, les passer dans Demucs, jeter le résultat.

```
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 2 -y warmup.wav
python -m demucs --two-stems=vocals -n htdemucs -o .warmup warmup.wav
```

À ne faire que si le cache est vide. Chemin du cache sous Windows : `%USERPROFILE%\.cache\torch\hub\checkpoints`. En cas de doute, tester la présence d'un fichier `.th` plutôt que de deviner le nom exact.

#### 20.1.7 Configuration interactive du `.env`

Si `.env` est absent, le créer depuis `.env.example`. Puis, pour chaque variable requise et vide, la demander sur l'entrée standard (`node:readline/promises`) :

```
SUPABASE_URL manquante. Colle-la ici : _
```

Les variables à demander : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`. Toutes les autres ont des valeurs par défaut. `WORKER_ID` est rempli automatiquement avec `os.hostname()`.

C'est la seule interaction du script. Une fois faite, elle ne se reproduit plus.

#### 20.1.8 Sortie attendue

Au deuxième lancement, la totalité doit tenir en quelques lignes et moins de trois secondes :

```
Dub’Up worker — vérification de l'environnement

  ✓ dépendances npm
  ✓ ffmpeg 7.1
  ✓ ffprobe 7.1
  ✓ yt-dlp 2025.01.15
  ✓ Python 3.11.9
  ✓ PyTorch 2.5.1 (CUDA disponible)
  ✓ Demucs 4.0.1
  ✓ poids htdemucs en cache
  ✓ .env complet

Tout est prêt. Démarrage du worker…
```

Au premier, chaque ligne absente devient une étape d'installation avec sa progression. **Aucune question posée en dehors du `.env`.**

#### 20.1.9 Options et modes de secours

| Option | Effet |
|---|---|
| `node scripts/bootstrap.mjs --check` | Vérifie seulement, n'installe rien, code de sortie non nul s'il manque quelque chose |
| `node scripts/bootstrap.mjs --force` | Réinstalle tout, même ce qui est présent. Pour réparer une install corrompue |
| `node scripts/bootstrap.mjs --skip-demucs` | Ignore Python, PyTorch et Demucs. Utile si `SEPARATION_MODE=elevenlabs` |

Si `SEPARATION_MODE=elevenlabs` dans un `.env` déjà présent, les étapes 4 à 7 sont **sautées automatiquement** : inutile d'installer un gigaoctet de PyTorch pour quelqu'un qui ne s'en servira pas.

**Chaque échec doit être actionnable.** Jamais une stacktrace seule :

```
✗ Python introuvable et winget indisponible sur cette machine.
  Installe Python 3.11 depuis https://www.python.org/downloads/
  en cochant « Add python.exe to PATH », puis relance start.bat.
```

Le worker appelle lui-même `bootstrap --check` au démarrage, en filet de sécurité pour le cas où il serait lancé sans passer par le `.bat`.

#### 20.1.10 Portabilité

Le script détecte `process.platform`. Sous Linux et macOS, les binaires viennent du gestionnaire de paquets (`apt`, `brew`) et les chemins perdent leur `.exe`. **Le reste du worker ne doit jamais supposer Windows** : tous les chemins de binaires passent par les variables d'environnement de §19, et `.exe` n'apparaît nulle part ailleurs que dans le bootstrap et le `.env`.

**Les binaires ne sont pas versionnés dans le dépôt.** `bin/`, `.env` et `node_modules/` dans le `.gitignore`.

### 20.2 Appeler un binaire depuis Node

Un seul wrapper, utilisé partout. Pas de `exec`, pas de `shell: true` : les chemins Windows contiennent des espaces et les filtergraphs ffmpeg contiennent des caractères que le shell interprète.

```ts
// worker/lib/run.ts
import { spawn } from 'node:child_process';

export function run(
  bin: string,
  args: string[],
  opts: {
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
    timeoutMs?: number;
    cwd?: string;
  } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: opts.cwd, windowsHide: true });
    let stdout = '', stderr = '';
    const timer = opts.timeoutMs
      ? setTimeout(() => { child.kill('SIGKILL'); reject(new Error('timeout')); }, opts.timeoutMs)
      : null;

    child.stdout.on('data', d => { const t = d.toString(); stdout += t; opts.onStdout?.(t); });
    child.stderr.on('data', d => { const t = d.toString(); stderr += t; opts.onStderr?.(t); });
    child.on('error', err => { if (timer) clearTimeout(timer); reject(err); });
    child.on('close', code => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      // stderr tronqué : ffmpeg est très bavard, seule la fin porte l'erreur
      else reject(new Error(`${bin} exited ${code}\n${stderr.slice(-2000)}`));
    });
  });
}
```

Règles :
- **Chaque argument est un élément du tableau.** `['-i', inputPath]`, jamais `['-i ' + inputPath]`.
- ffmpeg écrit tout sur **stderr**, y compris quand tout va bien. Un exit code 0 avec du stderr n'est pas une erreur.
- Timeout systématique : 30 min pour Demucs, 15 min pour un encodage, 5 min pour yt-dlp.

### 20.3 ffprobe — inspecter la source avant de la traiter

Appelé en tout premier, avant l'encodage, pour appliquer les garde-fous de §6.2 :

```ts
const { stdout } = await run(FFPROBE_PATH, [
  '-v', 'error',
  '-print_format', 'json',
  '-show_format',
  '-show_streams',
  inputPath,
]);
const probe = JSON.parse(stdout);
```

Ce qu'on en tire :

```ts
const duration_ms = Math.round(parseFloat(probe.format.duration) * 1000);
const audioStreams = probe.streams.filter(s => s.codec_type === 'audio');
const videoStream  = probe.streams.find(s => s.codec_type === 'video');

if (!videoStream)        throw new UserError('Ce fichier ne contient pas de vidéo.');
if (audioStreams.length === 0) throw new UserError('Ce fichier ne contient pas de piste audio.');
if (duration_ms > MAX_VIDEO_DURATION_MS)
  throw new UserError(`Scène trop longue (${Math.round(duration_ms/60000)} min, maximum 10 min).`);
```

Distinguer `UserError` (message affiché tel quel à l'utilisateur, pas de retry) de `SystemError` (message technique loggé, retry autorisé). Cette distinction traverse tout le worker — c'est elle qui évite d'afficher une stacktrace ffmpeg dans l'interface.

### 20.4 ffmpeg — progression

Sans ça, la barre de progression de §6.1 ne peut pas exister. On ajoute `-progress pipe:1 -nostats` : ffmpeg écrit alors des paires `clé=valeur` sur **stdout**, une par ligne, par blocs terminés par `progress=continue` (ou `progress=end`).

```ts
await run(FFMPEG_PATH, [
  '-hide_banner', '-nostats',
  '-progress', 'pipe:1',
  '-i', inputPath,
  ...encodeArgs,
  '-y', outputPath,
], {
  onStdout: (chunk) => {
    for (const line of chunk.split('\n')) {
      const [k, v] = line.split('=');
      if (k === 'out_time_us') {
        const pct = Math.min(99, Math.round((Number(v) / 1000 / duration_ms) * 100));
        onProgress(pct);
      }
    }
  },
  timeoutMs: 15 * 60_000,
});
```

Détails qui font perdre une heure :
- `out_time_us` est en **microsecondes**. Il existe aussi `out_time_ms` mais il est historiquement en microsecondes lui aussi — utiliser `out_time_us`, sans ambiguïté.
- `-y` pour écraser, sinon ffmpeg attend une confirmation au clavier et le job reste bloqué jusqu'au timeout.
- Écrire la sortie dans un fichier temporaire puis `rename` à la fin : un ffmpeg tué à mi-parcours laisse un MP4 corrompu qui semble valide.

### 20.5 ffmpeg — filtergraph en fichier

Pour le mixage (§12.2) et la réinjection VO (§12.3), le filtergraph dépasse vite les limites de ligne de commande de Windows.

```ts
const graphPath = path.join(workDir, 'graph.txt');
await fs.writeFile(graphPath, filterGraph, 'utf8');

await run(FFMPEG_PATH, [
  '-hide_banner', '-nostats', '-progress', 'pipe:1',
  ...inputs.flatMap(f => ['-i', f]),
  '-filter_complex_script', graphPath,
  '-map', '[out]', '-c:a', 'pcm_s16le',
  '-y', mixPath,
]);
```

Le fichier accepte les retours à la ligne, ce qui rend le graphe lisible. **Le conserver dans `WORK_DIR` en cas d'échec** : c'est la seule pièce à conviction exploitable quand un mixage part de travers.

### 20.6 yt-dlp

Deux appels : métadonnées d'abord, téléchargement ensuite.

```ts
// 1. Vérifier la durée AVANT de télécharger
const { stdout } = await run(YTDLP_PATH, [
  '--dump-json', '--no-playlist', '--no-warnings', url,
]);
const info = JSON.parse(stdout);
if (info.duration * 1000 > MAX_VIDEO_DURATION_MS)
  throw new UserError('Cette vidéo dépasse 10 minutes.');

// 2. Télécharger
await run(YTDLP_PATH, [
  '--no-playlist',
  '-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  '--merge-output-format', 'mp4',
  '--ffmpeg-location', path.dirname(FFMPEG_PATH),
  '-o', path.join(workDir, 'dl.%(ext)s'),
  url,
], { timeoutMs: 5 * 60_000 });
```

Pièges :
- **`--ffmpeg-location` est obligatoire** dès qu'il y a fusion vidéo+audio. Sans ça, yt-dlp cherche ffmpeg dans le PATH global et échoue.
- `-o` contient `%(ext)s` : **le nom du fichier final n'est pas connu à l'avance**. Lister le dossier après coup plutôt que de supposer `dl.mp4`.
- `--no-playlist`, sinon un lien avec `&list=` télécharge cinquante vidéos.
- Les échecs de type « Sign in to confirm you're not a bot », « Video unavailable », « Private video » sont des `UserError` : message clair invitant à uploader le fichier, **sans retry** (§6.3).
- Prévoir un `yt-dlp -U` manuel documenté dans le README. Ne pas l'automatiser au démarrage du worker : une mise à jour ratée bloquerait tout.

### 20.7 Demucs

```ts
await run(PYTHON_PATH, [
  '-m', 'demucs',
  '--two-stems=vocals',
  '-n', DEMUCS_MODEL,          // htdemucs
  '--device', DEMUCS_DEVICE,   // cuda | cpu
  '-j', DEMUCS_JOBS,           // ignoré si cuda
  '--segment', DEMUCS_SEGMENT,
  '--filename', '{stem}.{ext}',
  '-o', outDir,
  inputWav,
], { timeoutMs: 30 * 60_000, onStderr: parseDemucsProgress });
```

**Sorties** — c'est le point le plus casse-gueule, l'arborescence n'est pas celle qu'on attend :

```
{outDir}/{DEMUCS_MODEL}/vocals.wav      → stem voix
{outDir}/{DEMUCS_MODEL}/no_vocals.wav   → stem fond
```

Le sous-dossier au nom du modèle est toujours créé, même avec `--filename`. Sans `--filename '{stem}.{ext}'`, le gabarit par défaut ajoute encore un niveau au nom du fichier source. **Ne jamais deviner ces chemins : les construire depuis `DEMUCS_MODEL`, et vérifier l'existence des deux fichiers avant de continuer.**

Autres points :
- `--two-stems=vocals` est ce qui nous intéresse : il ne sépare qu'en deux (voix / reste) au lieu de quatre, et c'est plus rapide.
- Demucs écrit sa progression sur **stderr**, sous forme de barre avec des `\r`. Parser au mieux, et se rabattre sur une progression indéterminée si le format change.
- **Erreur mémoire** (`CUDA out of memory` ou tuerie par l'OS) : réduire `--segment` (7 → 5 → 3). Le prévoir en retry automatique, c'est le mode d'échec le plus fréquent.
- L'entrée doit être un WAV. Demucs accepte d'autres formats mais délègue à ffmpeg de façon moins prévisible.
- La sortie est en 44,1 kHz par défaut si l'entrée l'est : **resampler en 48 kHz** avant de mixer, sinon décalage progressif sur toute la scène.

### 20.8 ElevenLabs — Scribe (transcription + diarisation)

```
POST https://api.elevenlabs.io/v1/speech-to-text
Header : xi-api-key: {ELEVENLABS_API_KEY}
Body   : multipart/form-data
  file                    = voix.wav
  model_id                = scribe_v1
  diarize                 = true
  timestamps_granularity  = word
  language_code           = fra        (omettre pour la détection auto)
  tag_audio_events        = false
```

Forme de la réponse, telle qu'attendue :

```json
{
  "language_code": "fra",
  "text": "Bonjour. Tu fais quoi ?",
  "words": [
    { "text": "Bonjour", "start": 1.24, "end": 1.81, "type": "word", "speaker_id": "speaker_0" },
    { "text": " ",       "start": 1.81, "end": 1.95, "type": "spacing", "speaker_id": "speaker_0" }
  ]
}
```

> ⚠️ **Ne pas consommer cette structure directement.** Les noms de champs ci-dessus sont donnés de mémoire et l'API peut avoir évolué. Écrire un adaptateur `parseScribeResponse()` isolé, **logger la réponse brute du tout premier appel** dans `WORK_DIR`, et ajuster une fois pour toutes. Le reste du pipeline ne manipule que ce format interne :

```ts
type Word = { text: string; startMs: number; endMs: number; speaker: string };
```

Traitement :
- **Filtrer `type !== 'word'`** — les entrées `spacing` n'ont pas à devenir des mots dans la bande rythmo.
- Les temps sont en **secondes flottantes** → convertir en ms par `Math.round(x * 1000)`.
- `speaker_id` alimente `characters.speaker_key`. Les personnages sont créés dans l'ordre d'apparition, nommés `Personnage 1`, `Personnage 2`…
- Fichier volumineux : envoyer le stem voix en WAV mono 16 kHz suffit largement pour la STT et divise le poids de l'upload par six. Ce downmix ne sert qu'à l'API, **le stem voix 48 kHz reste la référence pour le mixage**.

### 20.9 ElevenLabs — Audio Isolation (option A)

```
POST https://api.elevenlabs.io/v1/audio-isolation
Header : xi-api-key: {ELEVENLABS_API_KEY}
Body   : multipart/form-data, champ `audio`
Réponse: flux audio binaire
```

> ⚠️ **Le point qui décidera probablement du test de §5.4** : cette API renvoie par défaut un flux **MP3**, donc un encodage avec perte. Une soustraction de phase entre un WAV d'origine et un MP3 décodé ne s'annule jamais proprement — il reste systématiquement un résidu. Si le paramètre de format de sortie permet d'obtenir du PCM, l'utiliser impérativement. Sinon, l'option A est probablement condamnée d'avance et Demucs s'impose.

C'est aussi pour ça que `SEPARATION_MODE=demucs` est le défaut conseillé.

### 20.10 Supabase depuis le worker

```ts
import { createClient } from '@supabase/supabase-js';

export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
```

- La clé service **contourne RLS**. Elle ne quitte jamais le worker.
- Téléchargement : `db.storage.from('sources').download(path)` renvoie un `Blob` — le convertir en buffer et l'écrire sur disque, jamais le garder en mémoire pour un fichier de plusieurs centaines de Mo.
- Upload d'un gros fichier : passer un `ReadStream`, avec `contentType` explicite (`video/mp4`, `audio/wav`) et `upsert: true` pour qu'un retry ne parte pas en erreur de doublon.
- Après upload du rendu, **vérifier avec `list()` que la taille est non nulle** avant la purge (§13.1).

### 20.11 Ordre de traitement et nettoyage

```
WORK_DIR/{session_id}/
  dl.mp4            ← yt-dlp ou upload rapatrié
  work.mp4          ← normalisé, réuploadé vers Storage
  audio.wav         ← 48 kHz stéréo
  audio_16k.wav     ← downmix pour Scribe uniquement
  sep/htdemucs/vocals.wav
  sep/htdemucs/no_vocals.wav
  takes/*.webm      ← rapatriées au moment du rendu
  graph.txt         ← filtergraph, conservé en cas d'échec
  mix.wav
  final.mp4
```

`WORK_DIR/{session_id}/` est supprimé en fin de job **réussi** uniquement. En cas d'échec, on le garde : c'est ce qui permet de comprendre. Prévoir un nettoyage des dossiers de plus de 7 jours au démarrage du worker.

---

## 21. Arborescence attendue

```
/app                      Next.js (App Router)
  /(auth)/login
  /sessions               liste + espace utilisé (§13.3)
  /sessions/new           upload ou lien YouTube
  /s/[code]/prepare       écran hôte (§9)
  /s/[code]/lobby         (§10)
  /s/[code]/studio        (§11)
  /s/[code]/result        (§12.6)
  /api/sessions/...       routes serveur (création de job, signature d'URL)
/components
/lib
  supabase/               client, serveur, types générés
  audio/                  waveform, MediaRecorder, calibrage micro
/config
  constants.ts            TOUS les seuils : marges, gaps, plafonds (§18)
  strings.ts              toutes les chaînes françaises
/supabase
  migrations/             schéma §7 + fonction claim_job §7.2
/worker
  worker.js               boucle de jobs + heartbeat
  jobs/ingest.ts
  jobs/render.ts
  separation/index.ts     interface §Lot 0
  separation/demucs.ts
  separation/elevenlabs.ts
  lib/run.ts              §20.2
  lib/ffmpeg.ts           §20.4, §20.5
  lib/ytdlp.ts            §20.6
  lib/scribe.ts           §20.8
  lib/storage.ts          §20.10
  scripts/bootstrap.mjs   §20.1 — installe tout ce qui manque, zéro dépendance npm
  bin/                    ffmpeg.exe, ffprobe.exe, yt-dlp.exe (gitignored)
  .env.example            gabarit, versionné
  .env                    valeurs réelles, gitignored
  start.bat               le seul point d'entrée pour l'hôte
```
