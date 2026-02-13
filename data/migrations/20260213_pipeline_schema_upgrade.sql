-- Upgrade old schema to the schema expected by data/pipeline.py.
-- Safe to run multiple times (idempotent operations only).

BEGIN;

-- Create missing tables required by pipeline upserts.
CREATE TABLE IF NOT EXISTS public.team_stats (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_full_name TEXT,
    games_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    ot_losses INTEGER,
    points INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goals_for_per_game DOUBLE PRECISION,
    goals_against_per_game DOUBLE PRECISION,
    shots_for_per_game DOUBLE PRECISION,
    shots_against_per_game DOUBLE PRECISION,
    power_play_pct DOUBLE PRECISION,
    penalty_kill_pct DOUBLE PRECISION,
    faceoff_win_pct DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS public.players (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    position TEXT
);

CREATE TABLE IF NOT EXISTS public.player_season_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_abbrev TEXT,
    full_name TEXT,
    position_code TEXT,
    games_played INTEGER,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    plus_minus INTEGER,
    penalty_minutes INTEGER,
    power_play_goals INTEGER,
    pp_points INTEGER,
    sh_goals INTEGER,
    sh_points INTEGER,
    ev_goals INTEGER,
    ev_points INTEGER,
    game_winning_goals INTEGER,
    ot_goals INTEGER,
    shots INTEGER,
    shooting_pct DOUBLE PRECISION,
    toi_per_game DOUBLE PRECISION,
    faceoff_win_pct DOUBLE PRECISION,
    points_per_game DOUBLE PRECISION,
    shoots_catches TEXT
);

CREATE TABLE IF NOT EXISTS public.goalie_season_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_abbrev TEXT,
    full_name TEXT,
    games_played INTEGER,
    games_started INTEGER,
    wins INTEGER,
    losses INTEGER,
    ot_losses INTEGER,
    goals_against INTEGER,
    goals_against_average DOUBLE PRECISION,
    shots_against INTEGER,
    saves INTEGER,
    save_pct DOUBLE PRECISION,
    shutouts INTEGER,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    penalty_minutes INTEGER,
    toi INTEGER,
    shoots_catches TEXT
);

CREATE TABLE IF NOT EXISTS public.player_game_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    team_abbrev TEXT,
    home_road TEXT,
    game_date DATE,
    opponent_abbrev TEXT,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    plus_minus INTEGER,
    penalty_minutes INTEGER,
    power_play_goals INTEGER,
    pp_points INTEGER,
    sh_goals INTEGER,
    sh_points INTEGER,
    game_winning_goals INTEGER,
    ot_goals INTEGER,
    shots INTEGER,
    shifts INTEGER,
    toi TEXT
);

CREATE TABLE IF NOT EXISTS public.goalie_game_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    team_abbrev TEXT,
    home_road TEXT,
    game_date DATE,
    opponent_abbrev TEXT,
    goals_against INTEGER,
    saves INTEGER,
    save_pct DOUBLE PRECISION,
    shots_against INTEGER,
    decision TEXT,
    shutouts INTEGER,
    games_started INTEGER,
    penalty_minutes INTEGER,
    toi TEXT
);

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
