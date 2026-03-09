-- Canonical schema for NHL analytics data.
-- External NHL identifiers are treated as the stable business keys.

CREATE TABLE seasons (
    season_id BIGINT PRIMARY KEY,
    season_label VARCHAR(9) NOT NULL UNIQUE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    team_id BIGINT PRIMARY KEY,
    team_name VARCHAR(50) NOT NULL,
    team_full_name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE players (
    player_id BIGINT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(10),
    current_team_id BIGINT,
    birth_date DATE,
    birth_city VARCHAR(100),
    birth_country VARCHAR(100),
    height_cm INTEGER,
    weight_kg INTEGER,
    shoots_catches VARCHAR(5),
    headshot TEXT,
    hero_image TEXT,
    player_slug TEXT,
    draft_year INTEGER,
    draft_team_abbrev VARCHAR(10),
    draft_round INTEGER,
    draft_overall_pick INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (current_team_id) REFERENCES teams(team_id)
);

CREATE TABLE team_stats (
    team_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_full_name VARCHAR(100) NOT NULL,
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
    faceoff_win_pct DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, season_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id)
);

CREATE TABLE player_season_stats (
    player_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_abbrev VARCHAR(10),
    full_name VARCHAR(100),
    position_code VARCHAR(5),
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
    shoots_catches VARCHAR(5),
    PRIMARY KEY (player_id, season_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id)
);

CREATE TABLE goalie_season_stats (
    player_id BIGINT NOT NULL,
    season_id BIGINT NOT NULL,
    team_abbrev VARCHAR(10),
    full_name VARCHAR(100),
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
    shoots_catches VARCHAR(5),
    PRIMARY KEY (player_id, season_id),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id)
);

CREATE TABLE games (
    game_id BIGINT PRIMARY KEY,
    game_date DATE NOT NULL,
    home_team_id BIGINT NOT NULL,
    away_team_id BIGINT NOT NULL,
    home_team_score INTEGER,
    away_team_score INTEGER,
    season_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (season_id) REFERENCES seasons(season_id),
    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
);

CREATE TABLE player_game_stats (
    player_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    team_abbrev VARCHAR(10),
    home_road VARCHAR(5),
    game_date DATE,
    opponent_abbrev VARCHAR(10),
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
    toi VARCHAR(10),
    PRIMARY KEY (player_id, game_id)
);

CREATE TABLE goalie_game_stats (
    player_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    team_abbrev VARCHAR(10),
    home_road VARCHAR(5),
    game_date DATE,
    opponent_abbrev VARCHAR(10),
    goals_against INTEGER,
    saves INTEGER,
    save_pct DOUBLE PRECISION,
    shots_against INTEGER,
    decision VARCHAR(5),
    shutouts INTEGER,
    games_started INTEGER,
    penalty_minutes INTEGER,
    toi VARCHAR(10),
    PRIMARY KEY (player_id, game_id)
);

CREATE INDEX idx_player_game_stats_player_date
    ON player_game_stats (player_id, game_date DESC);

CREATE INDEX idx_goalie_game_stats_player_date
    ON goalie_game_stats (player_id, game_date DESC);

CREATE INDEX idx_player_season_stats_season
    ON player_season_stats (season_id DESC);

CREATE INDEX idx_goalie_season_stats_season
    ON goalie_season_stats (season_id DESC);

CREATE INDEX idx_team_stats_season_points
    ON team_stats (season_id, points DESC, goals_for DESC);
