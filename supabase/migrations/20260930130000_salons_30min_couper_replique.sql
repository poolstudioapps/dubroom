-- Trente minutes avant fermeture, et couper une replique en deux.

-- ── Les salons et studios oublies : trente minutes ───────────────────────
--
-- Vingt minutes, c'etait trop court pour un groupe qui se retrouve, attend
-- un retardataire ou fait une pause entre deux prises. La regle reste la
-- meme pour le salon et le studio : une seule duree a expliquer.

create or replace function public.app_fermer_salons()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_salons integer;
  v_studios integer;
begin
  -- Le salon : trente minutes depuis l'ouverture ou la derniere arrivee.
  update sessions s
  set closed_at = now()
  where s.status = 'lobby'
    and s.closed_at is null
    and greatest(
      s.lobby_opened_at,
      coalesce((select max(p.created_at) from participants p where p.session_id = s.id), '-infinity'::timestamptz)
    ) < now() - interval '30 minutes';
  get diagnostics v_salons = row_count;

  -- Le studio : trente minutes sans nouvelle prise.
  update sessions s
  set closed_at = now()
  where s.status = 'recording'
    and s.closed_at is null
    and greatest(
      coalesce(s.recording_started_at, s.lobby_opened_at, s.created_at),
      coalesce(
        (select max(t.created_at) from takes t join clips c on c.id = t.clip_id where c.session_id = s.id),
        '-infinity'::timestamptz
      )
    ) < now() - interval '30 minutes';
  get diagnostics v_studios = row_count;

  return v_salons + v_studios;
end;
$function$;

-- ── Couper une replique ──────────────────────────────────────────────────
--
-- La transcription colle parfois deux repliques de deux personnages en une
-- seule. On la coupe entre deux mots : la premiere partie garde la ligne,
-- la seconde devient une ligne neuve, eventuellement donnee a un autre
-- personnage.
--
-- `p_token_index` : le nombre de mots du texte qui restent dans la premiere
-- partie. Quand chaque mot du texte a son horodatage, on coupe exactement
-- entre les deux mots ; sinon — texte corrige a la main, mots absents — au
-- prorata de la longueur du texte, et les mots horodates vont du cote de
-- leur milieu. Une replique a plusieurs voix se coupe pour toutes ses voix.

create or replace function public.prep_cut_line(p_line_id uuid, p_token_index integer, p_character_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_line lines;
  v_copie lines;
  v_tokens text[];
  v_n int;
  v_words jsonb;
  v_nw int;
  v_first_text text;
  v_second_text text;
  v_first_words jsonb;
  v_second_words jsonb;
  v_cut_end int;
  v_cut_start int;
  v_count int := 0;
begin
  select * into v_line from lines where id = p_line_id;
  if not found then
    raise exception 'LINE_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_line.session_id);

  if p_character_id is not null and not exists (
    select 1 from characters where id = p_character_id and session_id = v_line.session_id
  ) then
    raise exception 'CROSS_SESSION' using errcode = 'P0001';
  end if;

  v_tokens := regexp_split_to_array(btrim(v_line.text), '\s+');
  v_n := coalesce(array_length(v_tokens, 1), 0);
  if p_token_index is null or p_token_index < 1 or p_token_index >= v_n then
    raise exception 'CUT_INVALID' using errcode = 'P0001';
  end if;

  v_first_text := array_to_string(v_tokens[1:p_token_index], ' ');
  v_second_text := array_to_string(v_tokens[p_token_index + 1:v_n], ' ');

  v_words := coalesce(v_line.words, '[]'::jsonb);
  v_nw := jsonb_array_length(v_words);

  if v_nw = v_n then
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_first_words
    from jsonb_array_elements(v_words) with ordinality as x(e, i) where i <= p_token_index;
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_second_words
    from jsonb_array_elements(v_words) with ordinality as x(e, i) where i > p_token_index;
    v_cut_end := (v_words -> (p_token_index - 1) ->> 'end_ms')::int;
    v_cut_start := (v_words -> p_token_index ->> 'start_ms')::int;
  else
    v_cut_end := v_line.start_ms + round(
      (v_line.end_ms - v_line.start_ms) * length(v_first_text)::numeric
      / greatest(1, length(v_first_text) + length(v_second_text))
    )::int;
    v_cut_start := v_cut_end;
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_first_words
    from jsonb_array_elements(v_words) with ordinality as x(e, i)
    where ((e ->> 'start_ms')::int + (e ->> 'end_ms')::int) / 2 < v_cut_end;
    select coalesce(jsonb_agg(e order by i), '[]'::jsonb) into v_second_words
    from jsonb_array_elements(v_words) with ordinality as x(e, i)
    where ((e ->> 'start_ms')::int + (e ->> 'end_ms')::int) / 2 >= v_cut_end;
  end if;

  -- Deux parties non vides, bornes dans l'ordre.
  v_cut_end := greatest(v_line.start_ms + 1, least(coalesce(v_cut_end, v_line.end_ms - 1), v_line.end_ms - 1));
  v_cut_start := greatest(v_cut_end, least(coalesce(v_cut_start, v_cut_end), v_line.end_ms - 1));

  for v_copie in
    select * from lines
    where session_id = v_line.session_id
      and start_ms = v_line.start_ms
      and end_ms = v_line.end_ms
  loop
    insert into lines (session_id, character_id, start_ms, end_ms, text, words, is_deleted)
    values (
      v_copie.session_id, coalesce(p_character_id, v_copie.character_id),
      v_cut_start, v_copie.end_ms, v_second_text, v_second_words, v_copie.is_deleted
    );
    update lines
    set end_ms = v_cut_end, text = v_first_text, words = v_first_words
    where id = v_copie.id;
    v_count := v_count + 1;
  end loop;

  perform recompute_clips(v_line.session_id, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

grant execute on function public.prep_cut_line(uuid, integer, uuid, integer, integer, integer) to anon, authenticated, service_role;

-- ── Le decalage d'une prise : jusqu'a six secondes ───────────────────────
--
-- Une prise mal posee par le calage peut tomber loin de sa replique, hors
-- des marges du clip. Le joueur la fait maintenant glisser au-dela : la
-- base accepte un decalage de six secondes dans chaque sens, et non plus
-- trois cents millisecondes.

create or replace function public.set_take_mix(p_session_id uuid, p_take_id uuid, p_mic_offset_ms integer default null::integer, p_gain_db numeric default null::numeric, p_everywhere boolean default false)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_me uuid;
  v_offset integer := case
    when p_mic_offset_ms is null then null
    else greatest(-6000, least(6000, p_mic_offset_ms))
  end;
  v_gain numeric := case
    when p_gain_db is null then null
    else round(greatest(-12, least(12, p_gain_db)), 1)
  end;
  v_count integer;
begin
  perform app_assert_status(p_session_id, array['recording']::session_status[]);
  v_me := app_my_participant(p_session_id);
  if v_me is null then
    raise exception 'NOT_A_PARTICIPANT' using errcode = 'P0001';
  end if;

  if p_everywhere then
    update participants
    set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
        gain_db = coalesce(v_gain, gain_db)
    where id = v_me;

    update takes
    set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
        gain_db = coalesce(v_gain, gain_db)
    where participant_id = v_me;
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  if p_take_id is null then
    raise exception 'TAKE_NOT_FOUND' using errcode = 'P0002';
  end if;

  update takes
  set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
      gain_db = coalesce(v_gain, gain_db)
  where id = p_take_id and participant_id = v_me;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  return v_count;
end;
$function$;
