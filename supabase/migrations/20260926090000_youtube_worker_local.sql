-- ════════════════════════════════════════════════════════════════════
-- Les scenes venues d'un lien YouTube restent sur le PC de l'hote.
--
-- Le PC telechargeait la video, puis passait la main a Google pour la
-- separation, la transcription et le rendu. Deux machines pour une scene,
-- c'etait deux fois plus d'occasions d'echouer, et Google n'apportait
-- rien que le PC ne sache faire : il a deja tout, video comprise.
--
-- Toute tache d'une scene YouTube — preparation comme rendu — est donc
-- reservee au worker local. Google ne la prend jamais et n'est plus
-- reveille pour elle ; les imports de fichiers, eux, continuent de
-- partir chez Google.
-- ════════════════════════════════════════════════════════════════════

create or replace function app_job_needs_local(p_type text, p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from sessions s
    where s.id = p_session_id
      and s.source_type = 'youtube'
  );
$$;
