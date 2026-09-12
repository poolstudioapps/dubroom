/**
 * Types de la base.
 *
 * Ce fichier est ecrit a la main pour que le projet compile avant le
 * premier `supabase gen types`. Une fois le projet lie, il est regenere
 * par `npm run db:types` et ce contenu est ecrase — garde donc la meme
 * forme que la sortie du CLI.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus =
  | 'draft'
  | 'ingest_queued'
  | 'ingesting'
  | 'ingest_failed'
  | 'prepping'
  | 'lobby'
  | 'recording'
  | 'render_queued'
  | 'rendering'
  | 'render_failed'
  | 'done';

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface SessionRow {
  id: string;
  code: string;
  host_id: string;
  title: string | null;
  status: SessionStatus;
  source_type: 'upload' | 'youtube';
  source_ref: string | null;
  upload_path: string | null;
  video_path: string | null;
  stem_voice_path: string | null;
  stem_music_path: string | null;
  stem_music_preview_path: string | null;
  /** Enveloppe du stem voix, un octet par intervalle, en base64. */
  voice_peaks: string | null;
  voice_peaks_hz: number | null;
  duration_ms: number | null;
  render_path: string | null;
  render_size_bytes: number | null;
  keep_as_pack: boolean;
  from_pack_id: string | null;
  purged_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface ParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  is_host: boolean;
  is_ready: boolean;
  is_kicked: boolean;
  mic_offset_ms: number;
  created_at: string;
}

export interface CharacterRow {
  id: string;
  session_id: string;
  speaker_key: string;
  name: string;
  color: string;
  assigned_to: string | null;
  is_released: boolean;
  sort_order: number;
  created_at: string;
}

/** Un mot horodate, tel que stocke dans `lines.words`. */
export interface WordTiming {
  w: string;
  start_ms: number;
  end_ms: number;
}

export interface LineRow {
  id: string;
  session_id: string;
  character_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  words: WordTiming[];
  /** Marquee supprimee par l'hote : exclue des clips, VO reinjectee. */
  is_deleted: boolean;
  created_at: string;
}

export interface ClipRow {
  id: string;
  session_id: string;
  character_id: string;
  idx: number;
  window_start_ms: number;
  window_end_ms: number;
  speech_start_ms: number;
  speech_end_ms: number;
  line_ids: string[];
  created_at: string;
}

export interface TakeRow {
  id: string;
  clip_id: string;
  participant_id: string;
  audio_path: string;
  duration_ms: number;
  offset_ms: number;
  is_selected: boolean;
  created_at: string;
}

export interface JobRow {
  id: string;
  session_id: string;
  type: 'ingest' | 'render';
  status: JobStatus;
  step: string | null;
  claimed_by: string | null;
  progress: number;
  error: string | null;
  attempts: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface WorkerRow {
  id: string;
  last_seen_at: string;
  current_job_id: string | null;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      allowed_emails: Table<{ email: string; added_at: string }>;
      sessions: Table<SessionRow>;
      participants: Table<ParticipantRow>;
      characters: Table<CharacterRow>;
      lines: Table<LineRow>;
      clips: Table<ClipRow>;
      takes: Table<TakeRow>;
      jobs: Table<JobRow>;
      workers: Table<WorkerRow>;
    };
    Views: Record<never, never>;
    Functions: {
      app_is_allowed: { Args: Record<string, never>; Returns: boolean };
      storage_usage: { Args: Record<string, never>; Returns: number };
      create_session: {
        Args: {
          p_code: string;
          p_title: string | null;
          p_source_type: string;
          p_source_ref: string | null;
          p_display_name: string;
        };
        Returns: SessionRow;
      };
      join_session: {
        Args: { p_code: string; p_display_name: string };
        Returns: SessionRow;
      };
      enqueue_ingest: {
        Args: { p_session_id: string; p_upload_path: string | null };
        Returns: JobRow;
      };
      enqueue_render: { Args: { p_session_id: string }; Returns: JobRow };
      open_lobby: {
        Args: { p_session_id: string; p_gap_ms: number; p_margin_ms: number };
        Returns: SessionRow;
      };
      start_recording: { Args: { p_session_id: string }; Returns: SessionRow };
      assign_character: { Args: { p_character_id: string }; Returns: CharacterRow };
      unassign_character: { Args: { p_character_id: string }; Returns: CharacterRow };
      set_character_released: {
        Args: { p_character_id: string; p_released: boolean };
        Returns: CharacterRow;
      };
      reassign_character: {
        Args: { p_character_id: string; p_participant_id: string };
        Returns: CharacterRow;
      };
      set_ready: {
        Args: { p_session_id: string; p_ready: boolean };
        Returns: ParticipantRow;
      };
      set_mic_offset: {
        Args: { p_session_id: string; p_offset_ms: number };
        Returns: ParticipantRow;
      };
      kick_participant: {
        Args: { p_participant_id: string };
        Returns: ParticipantRow;
      };
      save_take: {
        Args: { p_clip_id: string; p_audio_path: string; p_duration_ms: number };
        Returns: TakeRow;
      };
      set_take_offset: {
        Args: { p_take_id: string; p_offset_ms: number };
        Returns: TakeRow;
      };
      recompute_clips: {
        Args: { p_session_id: string; p_gap_ms: number; p_margin_ms: number };
        Returns: number;
      };
      claim_job: {
        Args: { p_worker_id: string; p_max_attempts?: number };
        Returns: JobRow | null;
      };
      requeue_stale_jobs: { Args: { p_stale_minutes: number }; Returns: number };
      prep_rename_character: {
        Args: { p_character_id: string; p_name: string };
        Returns: CharacterRow;
      };
      prep_update_line_text: {
        Args: { p_line_id: string; p_text: string };
        Returns: LineRow;
      };
      prep_reassign_lines: {
        Args: {
          p_line_ids: string[];
          p_character_id: string;
          p_gap_ms: number;
          p_margin_ms: number;
        };
        Returns: number;
      };
      prep_merge_characters: {
        Args: {
          p_source_ids: string[];
          p_target_id: string;
          p_gap_ms: number;
          p_margin_ms: number;
        };
        Returns: CharacterRow;
      };
      prep_split_lines: {
        Args: {
          p_line_ids: string[];
          p_name: string;
          p_color: string;
          p_gap_ms: number;
          p_margin_ms: number;
        };
        Returns: CharacterRow;
      };
      prep_delete_lines: {
        Args: { p_line_ids: string[]; p_gap_ms: number; p_margin_ms: number };
        Returns: number;
      };
      prep_restore_lines: {
        Args: { p_line_ids: string[]; p_gap_ms: number; p_margin_ms: number };
        Returns: number;
      };
      session_missing_takes: { Args: { p_session_id: string }; Returns: number };
      prep_delete_character: {
        Args: { p_character_id: string; p_gap_ms: number; p_margin_ms: number };
        Returns: undefined;
      };
    };
    Enums: {
      session_status: SessionStatus;
      job_status: JobStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}
