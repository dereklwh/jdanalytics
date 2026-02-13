-- Upgrade old schema to the schema expected by data/pipeline.py.
-- Safe to run multiple times (idempotent operations only).

BEGIN;

-- players: add NHL id + new dimension fields used by transform_players_dimension.
ALTER TABLE IF EXISTS public.players
    ADD COLUMN IF NOT EXISTS player_id BIGINT,
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS birth_city TEXT,
    ADD COLUMN IF NOT EXISTS birth_country TEXT,
    ADD COLUMN IF NOT EXISTS height_cm INTEGER,
    ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
    ADD COLUMN IF NOT EXISTS shoots_catches TEXT,
    ADD COLUMN IF NOT EXISTS headshot TEXT,
    ADD COLUMN IF NOT EXISTS hero_image TEXT,
    ADD COLUMN IF NOT EXISTS player_slug TEXT,
    ADD COLUMN IF NOT EXISTS draft_year INTEGER,
    ADD COLUMN IF NOT EXISTS draft_team_abbrev TEXT,
    ADD COLUMN IF NOT EXISTS draft_round INTEGER,
    ADD COLUMN IF NOT EXISTS draft_overall_pick INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS players_player_id_uniq
    ON public.players (player_id);

-- team_stats in pipeline uses NHL team_id + NHL season_id, not local FK ids.
ALTER TABLE IF EXISTS public.team_stats
    DROP CONSTRAINT IF EXISTS team_stats_team_id_fkey,
    DROP CONSTRAINT IF EXISTS team_stats_season_id_fkey;

CREATE UNIQUE INDEX IF NOT EXISTS team_stats_team_id_season_id_uniq
    ON public.team_stats (team_id, season_id);

-- Ensure upsert conflict targets exist.
CREATE UNIQUE INDEX IF NOT EXISTS player_season_stats_player_id_season_id_uniq
    ON public.player_season_stats (player_id, season_id);

CREATE UNIQUE INDEX IF NOT EXISTS goalie_season_stats_player_id_season_id_uniq
    ON public.goalie_season_stats (player_id, season_id);

CREATE UNIQUE INDEX IF NOT EXISTS player_game_stats_player_id_game_id_uniq
    ON public.player_game_stats (player_id, game_id);

CREATE UNIQUE INDEX IF NOT EXISTS goalie_game_stats_player_id_game_id_uniq
    ON public.goalie_game_stats (player_id, game_id);

COMMIT;
