-- Dub’Up — RLS et Storage (PRD §7.1, §13, §14).
--
-- Principe : les policies ne gouvernent que la LECTURE et quelques
-- ecritures triviales. Toutes les transitions passent par les fonctions
-- `security definer` du fichier precedent, qui s'executent avec les
-- droits du proprietaire et court-circuitent donc ces policies.
-- Le worker, lui, utilise la cle service et ignore RLS (PRD §20.10).

alter table allowed_emails enable row level security;
alter table sessions enable row level security;
alter table participants enable row level security;
alter table characters enable row level security;
alter table lines enable row level security;
alter table clips enable row level security;
alter table takes enable row level security;
alter table jobs enable row level security;
alter table workers enable row level security;

-- ── allowed_emails ────────────────────────────────────────────────────
-- Aucune policy : la liste blanche n'est lisible que par la cle service.
-- Les clients passent par app_is_allowed(), qui est security definer.

-- ── sessions ──────────────────────────────────────────────────────────

create policy sessions_select on sessions
  for select to authenticated
  using (app_is_participant(id) or host_id = auth.uid());

-- Le titre est la seule colonne que l'hote modifie directement.
create policy sessions_update_title on sessions
  for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy sessions_delete on sessions
  for delete to authenticated
  using (host_id = auth.uid());

-- ── participants ──────────────────────────────────────────────────────

create policy participants_select on participants
  for select to authenticated
  using (app_is_participant(session_id));

-- ── characters / lines / clips ────────────────────────────────────────
-- Lisibles par les participants ; modifiables uniquement via les RPC
-- de preparation et de lobby.

create policy characters_select on characters
  for select to authenticated
  using (app_is_participant(session_id));

create policy lines_select on lines
  for select to authenticated
  using (app_is_participant(session_id));

create policy clips_select on clips
  for select to authenticated
  using (app_is_participant(session_id));

-- ── takes (PRD §7.1) ──────────────────────────────────────────────────
-- Un participant ne voit que ses propres prises AVANT le rendu ;
-- tout le monde peut les lire une fois la session en `done`.

create policy takes_select on takes
  for select to authenticated
  using (
    exists (
      select 1
      from clips c
      join sessions s on s.id = c.session_id
      where c.id = takes.clip_id
        and app_is_participant(s.id)
        and (
          s.status = 'done'
          or takes.participant_id = app_my_participant(s.id)
        )
    )
  );

-- Refaire une prise supprime la precedente : autorise tant que la
-- session n'est pas figee.
create policy takes_delete_own on takes
  for delete to authenticated
  using (
    exists (
      select 1
      from clips c
      join sessions s on s.id = c.session_id
      where c.id = takes.clip_id
        and s.status = 'recording'
        and takes.participant_id = app_my_participant(s.id)
    )
  );

-- ── jobs / workers ────────────────────────────────────────────────────
-- Lecture seule cote client : barre de progression et message
-- « en attente du worker » (PRD §12.1).

create policy jobs_select on jobs
  for select to authenticated
  using (app_is_participant(session_id));

create policy workers_select on workers
  for select to authenticated
  using (true);

-- ══ Storage ═══════════════════════════════════════════════════════════
-- Trois buckets prives. Aucun acces public : tout passe par des URL
-- signees a duree courte (PRD §14).

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('sources', 'sources', false, 2147483648),
  ('takes', 'takes', false, 52428800),
  ('renders', 'renders', false, 2147483648)
on conflict (id) do nothing;

-- ── bucket `sources` : work.mp4, voice.wav, music.wav ─────────────────
-- Chemin : {session_id}/...

create policy sources_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sources'
    and app_is_participant(app_path_session(name))
  );

create policy sources_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sources'
    and app_is_host(app_path_session(name))
  );

create policy sources_update on storage.objects
  for update to authenticated
  using (bucket_id = 'sources' and app_is_host(app_path_session(name)))
  with check (bucket_id = 'sources' and app_is_host(app_path_session(name)));

create policy sources_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'sources' and app_is_host(app_path_session(name)));

-- ── bucket `takes` ────────────────────────────────────────────────────
-- Chemin : {session_id}/{participant_id}/{take_id}.webm
-- Le deuxieme segment porte l'identite : un joueur n'ecrit que chez lui.

create policy takes_object_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'takes'
    and app_is_participant(app_path_session(name))
  );

create policy takes_object_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'takes'
    and split_part(name, '/', 2) =
        app_my_participant(app_path_session(name))::text
  );

create policy takes_object_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'takes'
    and (
      split_part(name, '/', 2) = app_my_participant(app_path_session(name))::text
      or app_is_host(app_path_session(name))
    )
  );

-- ── bucket `renders` : le seul contenu durable ────────────────────────

create policy renders_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'renders'
    and app_is_participant(app_path_session(name))
  );

create policy renders_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'renders' and app_is_host(app_path_session(name)));
