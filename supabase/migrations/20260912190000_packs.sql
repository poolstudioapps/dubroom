-- Dub’Up — scenes preparees, reutilisables (PRD §16.2).
--
-- Jusqu'ici une scene mourait avec son rendu : la source etait purgee et
-- le travail de preparation — separation des voix, transcription,
-- decoupage, correction des personnages — disparaissait avec elle. Or
-- c'est justement la partie longue. Un « pack » conserve ce travail pour
-- qu'un autre groupe reprenne la meme scene en dix secondes.
--
-- Deux choix a expliquer :
--
-- 1. Les fichiers d'un pack vivent sous `packs/{id}/` et non sous
--    `{session_id}/`. La purge de fin de rendu ne balaie que le dossier
--    de la session : les packs y echappent par construction, sans qu'il
--    faille ajouter une exception quelque part.
--
-- 2. Les stems sont conserves compresses, pas en WAV. Mesure faite : une
--    scene de deux minutes pese 59 Mo en WAV contre 13 Mo compressee,
--    soit 17 packs contre 75 dans le gigaoctet gratuit. Le mixage final
--    reencode de toute facon en AAC.
--
-- Ce qui n'est JAMAIS conserve : les prises de voix des joueurs. Un pack
-- contient la scene et sa preparation, jamais ce que quelqu'un a
-- enregistre.

alter table sessions
  add column keep_as_pack boolean not null default false,
  add column from_pack_id uuid;

-- Une scene peut desormais naitre d'un pack.
alter table sessions drop constraint sessions_source_type_check;
alter table sessions add constraint sessions_source_type_check
  check (source_type in ('upload', 'youtube', 'pack'));

create table packs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  duration_ms int not null,

  video_path text not null,
  stem_voice_path text not null,
  stem_music_path text not null,
  voice_peaks text,
  voice_peaks_hz int,

  character_count int not null default 0,
  line_count int not null default 0,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table sessions
  add constraint sessions_from_pack_fkey
  foreign key (from_pack_id) references packs (id) on delete set null;

create table pack_characters (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references packs (id) on delete cascade,
  speaker_key text not null,
  name text not null,
  color text not null,
  sort_order int not null default 0
);

create table pack_lines (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references packs (id) on delete cascade,
  pack_character_id uuid not null references pack_characters (id) on delete cascade,
  start_ms int not null,
  end_ms int not null,
  text text not null,
  words jsonb not null default '[]'::jsonb,
  is_deleted boolean not null default false
);

create index pack_characters_idx on pack_characters (pack_id, sort_order);
create index pack_lines_idx on pack_lines (pack_id, start_ms);

alter table packs enable row level security;
alter table pack_characters enable row level security;
alter table pack_lines enable row level security;

-- Visible des invites, et d'eux seuls : c'est un salon prive, pas un
-- catalogue public (PRD §1.4, §14).
create policy packs_select on packs
  for select to authenticated using (app_is_allowed());
create policy pack_characters_select on pack_characters
  for select to authenticated using (app_is_allowed());
create policy pack_lines_select on pack_lines
  for select to authenticated using (app_is_allowed());

-- Les fichiers d'un pack, sous leur propre prefixe.
create policy packs_object_select on storage.objects
  for select to authenticated
  using (bucket_id = 'sources' and name like 'packs/%' and app_is_allowed());

create policy packs_object_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sources'
    and name like 'packs/%'
    and exists (
      select 1 from packs p
      where p.id::text = split_part(name, '/', 2)
        and p.created_by = auth.uid()
    )
  );
