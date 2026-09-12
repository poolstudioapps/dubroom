-- Dub’Up — schema initial (PRD §7)
-- Toutes les tables ont id uuid primary key default gen_random_uuid()
-- et created_at timestamptz default now().

create extension if not exists "pgcrypto";

-- ── Acces restreint : liste blanche d'emails (PRD §14) ────────────────
create table allowed_emails (
  email text primary key,
  added_at timestamptz not null default now()
);

comment on table allowed_emails is
  'Liste blanche. Un email absent ne peut ni creer ni rejoindre une session.';

-- ── Etats de session (PRD §8) ─────────────────────────────────────────
create type session_status as enum (
  'draft',
  'ingest_queued',
  'ingesting',
  'ingest_failed',
  'prepping',
  'lobby',
  'recording',
  'render_queued',
  'rendering',
  'render_failed',
  'done'
);

create type job_status as enum ('queued', 'running', 'done', 'failed');

-- ── Sessions ──────────────────────────────────────────────────────────
create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                  -- 6 caracteres, A-Z2-9 sans I,O,0,1
  host_id uuid not null references auth.users (id) on delete cascade,
  title text,
  status session_status not null default 'draft',

  source_type text not null check (source_type in ('upload', 'youtube')),
  source_ref text,                            -- URL YouTube d'origine
  upload_path text,                           -- fichier brut depose par l'hote
  video_path text,                            -- work.mp4 normalise (Storage)
  stem_voice_path text,
  stem_music_path text,
  -- Version compressee du stem de fond, servie au studio uniquement.
  -- Le WAV 48 kHz reste la reference du mixage ; le streamer a chaque
  -- prise de chaque joueur epuiserait le quota de bande passante (§13.3).
  stem_music_preview_path text,
  duration_ms int,

  render_path text,                           -- MP4 final
  render_size_bytes bigint,

  -- Pas de date d'expiration : la purge est declenchee par le rendu (PRD §13.1)
  purged_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column sessions.purged_at is
  'Horodatage de la purge de la source, faite apres un rendu reussi uniquement.';

-- ── Participants ──────────────────────────────────────────────────────
create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  is_host boolean not null default false,
  is_ready boolean not null default false,
  is_kicked boolean not null default false,
  mic_offset_ms int not null default 0,       -- calibrage latence (PRD §11.6)
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

-- ── Personnages ───────────────────────────────────────────────────────
create table characters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  speaker_key text not null,                  -- 'speaker_0' venant de Scribe
  name text not null,
  color text not null,                        -- token semantique, pas un hex
  assigned_to uuid references participants (id) on delete set null,
  is_released boolean not null default false, -- true = garder la VO au mixage
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Un personnage ne peut etre pris que par un joueur (PRD §10.2).
-- L'inverse est autorise : un joueur peut prendre plusieurs personnages.
create index characters_session_idx on characters (session_id, sort_order);
create index characters_assigned_idx on characters (assigned_to);

-- ── Repliques ─────────────────────────────────────────────────────────
create table lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  character_id uuid not null references characters (id) on delete cascade,
  start_ms int not null,
  end_ms int not null,
  text text not null,
  words jsonb not null default '[]'::jsonb,   -- [{w, start_ms, end_ms}, ...]
  -- Une replique supprimee par l'hote n'est pas effacee : sa VO doit
  -- etre reinjectee au mixage « a cet endroit » (PRD §9.2, §12.3).
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index lines_session_idx on lines (session_id, start_ms)
  where is_deleted = false;
create index lines_deleted_idx on lines (session_id)
  where is_deleted;
create index lines_character_idx on lines (character_id, start_ms);

-- ── Clips (unite d'enregistrement) ────────────────────────────────────
create table clips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  character_id uuid not null references characters (id) on delete cascade,
  idx int not null,                           -- ordre de passage pour le joueur
  window_start_ms int not null,               -- debut parole - marge
  window_end_ms int not null,                 -- fin parole + marge
  speech_start_ms int not null,
  speech_end_ms int not null,
  line_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create index clips_lookup_idx on clips (session_id, character_id, idx);

-- Ordre de passage stable pour le joueur (PRD §7).
create unique index unique_clip_idx on clips (session_id, character_id, idx);

-- ── Prises ────────────────────────────────────────────────────────────
create table takes (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips (id) on delete cascade,
  participant_id uuid not null references participants (id) on delete cascade,
  audio_path text not null,                   -- webm/opus dans Storage
  duration_ms int not null,
  offset_ms int not null default 0,           -- correction manuelle au rendu
  is_selected boolean not null default true,
  created_at timestamptz not null default now()
);

create index takes_clip_idx on takes (clip_id, is_selected);

-- Une seule prise retenue par clip. Sans cet index, le rendu mixerait
-- deux prises superposees sur le meme clip (PRD §7).
create unique index one_selected_take_per_clip
  on takes (clip_id) where is_selected;

-- ── Workers et file d'attente ─────────────────────────────────────────
-- Les deux tables se referencent mutuellement : les contraintes sont
-- ajoutees apres coup.
create table workers (
  id text primary key,                        -- nom de machine
  last_seen_at timestamptz not null default now(),
  current_job_id uuid,
  created_at timestamptz not null default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  type text not null check (type in ('ingest', 'render')),
  status job_status not null default 'queued',
  step text,
  claimed_by text,
  progress int not null default 0 check (progress between 0 and 100),
  error text,
  attempts int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

alter table jobs
  add constraint jobs_claimed_by_fkey
  foreign key (claimed_by) references workers (id) on delete set null;

alter table workers
  add constraint workers_current_job_fkey
  foreign key (current_job_id) references jobs (id) on delete set null;

create index jobs_queue_idx on jobs (status, created_at);
create index jobs_session_idx on jobs (session_id, created_at desc);

-- Un seul job actif par session : evite qu'un double-clic mette deux
-- rendus en file sur la meme scene.
create unique index one_active_job_per_session
  on jobs (session_id) where status in ('queued', 'running');

-- ── Realtime : le lobby et les ecrans d'attente en dependent ──────────
-- La publication existe sur Supabase mais pas sur un Postgres nu : on la
-- cree au besoin plutot que de faire echouer toute la migration.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;

  alter publication supabase_realtime add table sessions;
  alter publication supabase_realtime add table participants;
  alter publication supabase_realtime add table characters;
  alter publication supabase_realtime add table jobs;
  alter publication supabase_realtime add table takes;
end;
$$;
