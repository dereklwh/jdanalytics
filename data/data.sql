CREATE TABLE teams(
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(50) NOT NULL,
    team_full_name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(10) NOT NULL,
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_stats (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    team_full_name VARCHAR(100) NOT NULL,
    games_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    ot_losses INTEGER,
    points INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goals_for_per_game FLOAT,
    goals_against_per_game FLOAT,
    shots_for_per_game FLOAT,
    shots_against_per_game FLOAT,
    power_play_pct FLOAT,
    penalty_kill_pct FLOAT,
    faceoff_win_pct FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (season_id) REFERENCES seasons(id),
    UNIQUE (team_id, season_id)
);

CREATE TABLE players(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(10),
    team_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE player_game_stats(
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    team_id INTEGER,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    plus_minus INTEGER,
    penalty_minutes INTEGER,
    power_play_goals INTEGER,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE (player_id, game_id)
);

CREATE TABLE goalie_game_stats(
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    team_id INTEGER,
    goals_against INTEGER,
    saves INTEGER,
    save_percentage FLOAT,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (season_id) REFERENCES seasons(id),
    UNIQUE (player_id, game_id)
);

CREATE TABLE player_season_stats(
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    team_id INTEGER,
    games_played INTEGER,
    goals INTEGER,
    assists INTEGER,
    points INTEGER,
    plus_minus INTEGER,
    penalty_minutes INTEGER,
    power_play_goals INTEGER,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (season_id) REFERENCES seasons(id),
    UNIQUE (player_id, season_id)
);


CREATE TABLE goalie_season_stats(
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    season_id INTEGER NOT NULL,
    team_id INTEGER,
    games_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    ot_losses INTEGER,
    goals_against INTEGER,
    shots_against INTEGER,
    saves INTEGER,
    save_percentage FLOAT,
    goals_against_average FLOAT,
    shutouts INTEGER,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (season_id) REFERENCES seasons(id),
    UNIQUE (player_id, season_id)
);

CREATE TABLE games(
    id SERIAL PRIMARY KEY,
    game_date DATE NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_team_score INTEGER,
    away_team_score INTEGER,
    season_id INTEGER NOT NULL,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
    FOREIGN KEY (season_id) REFERENCES seasons(id)
    UNIQUE (game_date, home_team_id, away_team_id)
);

CREATE TABLE seasons(
    id SERIAL PRIMARY KEY,
    year VARCHAR(9) NOT NULL UNIQUE
);