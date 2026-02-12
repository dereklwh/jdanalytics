import os
from typing import Optional, List
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
from scrapers.scrape_teams import scrape_teams
from scrapers.scrape_players import scrape_players
from scrapers.scrape_skater_stats import scrape_skater_stats
from scrapers.scrape_goalie_stats import scrape_goalie_stats
from scrapers.scrape_game_logs import scrape_all_game_logs

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------
# Pydantic Models
# ---------------------

class TeamStats(BaseModel):
    team_id: int
    season_id: int
    games_played: int
    wins: int
    losses: int
    ot_losses: int
    points: int
    goals_for: int
    goals_against: int
    goals_for_per_game: float
    goals_against_per_game: float
    shots_for_per_game: float
    shots_against_per_game: float
    power_play_pct: float
    penalty_kill_pct: float
    faceoff_win_pct: float
    team_full_name: str

class SkaterSeasonStats(BaseModel):
    player_id: int
    season_id: int
    team_abbrev: Optional[str] = None
    full_name: Optional[str] = None
    position_code: Optional[str] = None
    games_played: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    points: Optional[int] = None
    plus_minus: Optional[int] = None
    penalty_minutes: Optional[int] = None
    power_play_goals: Optional[int] = None
    pp_points: Optional[int] = None
    sh_goals: Optional[int] = None
    sh_points: Optional[int] = None
    ev_goals: Optional[int] = None
    ev_points: Optional[int] = None
    game_winning_goals: Optional[int] = None
    ot_goals: Optional[int] = None
    shots: Optional[int] = None
    shooting_pct: Optional[float] = None
    toi_per_game: Optional[float] = None
    faceoff_win_pct: Optional[float] = None
    points_per_game: Optional[float] = None
    shoots_catches: Optional[str] = None

class GoalieSeasonStats(BaseModel):
    player_id: int
    season_id: int
    team_abbrev: Optional[str] = None
    full_name: Optional[str] = None
    games_played: Optional[int] = None
    games_started: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    ot_losses: Optional[int] = None
    goals_against: Optional[int] = None
    goals_against_average: Optional[float] = None
    shots_against: Optional[int] = None
    saves: Optional[int] = None
    save_pct: Optional[float] = None
    shutouts: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    points: Optional[int] = None
    penalty_minutes: Optional[int] = None
    toi: Optional[int] = None
    shoots_catches: Optional[str] = None

class SkaterGameStats(BaseModel):
    player_id: int
    game_id: int
    team_abbrev: Optional[str] = None
    home_road: Optional[str] = None
    game_date: Optional[str] = None
    opponent_abbrev: Optional[str] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    points: Optional[int] = None
    plus_minus: Optional[int] = None
    penalty_minutes: Optional[int] = None
    power_play_goals: Optional[int] = None
    pp_points: Optional[int] = None
    sh_goals: Optional[int] = None
    sh_points: Optional[int] = None
    game_winning_goals: Optional[int] = None
    ot_goals: Optional[int] = None
    shots: Optional[int] = None
    shifts: Optional[int] = None
    toi: Optional[str] = None

class GoalieGameStats(BaseModel):
    player_id: int
    game_id: int
    team_abbrev: Optional[str] = None
    home_road: Optional[str] = None
    game_date: Optional[str] = None
    opponent_abbrev: Optional[str] = None
    goals_against: Optional[int] = None
    saves: Optional[int] = None
    save_pct: Optional[float] = None
    shots_against: Optional[int] = None
    decision: Optional[str] = None
    shutouts: Optional[int] = None
    games_started: Optional[int] = None
    penalty_minutes: Optional[int] = None
    toi: Optional[str] = None

# ---------------------
# Transform Functions
# ---------------------

def transform_team_stats(raw_data):
    transformed = []
    for item in raw_data['data']:
        team_stats = TeamStats(
            team_id=item['teamId'],
            season_id=item['seasonId'],
            games_played=item['gamesPlayed'],
            wins=item['wins'],
            losses=item['losses'],
            ot_losses=item['otLosses'],
            points=item['points'],
            goals_for=item['goalsFor'],
            goals_against=item['goalsAgainst'],
            goals_for_per_game=item['goalsForPerGame'],
            goals_against_per_game=item['goalsAgainstPerGame'],
            shots_for_per_game=item['shotsForPerGame'],
            shots_against_per_game=item['shotsAgainstPerGame'],
            power_play_pct=item['powerPlayPct'],
            penalty_kill_pct=item['penaltyKillPct'],
            faceoff_win_pct=item['faceoffWinPct'],
            team_full_name=item['teamFullName']
        )
        transformed.append(team_stats.model_dump())
    return transformed

def transform_players_dimension(raw):
    rows = []
    for p in raw:
        rows.append({
            "player_id": p["playerId"],
            "first_name": p["firstName"]["default"],
            "last_name": p["lastName"]["default"],
            "birth_date": p.get("birthDate"),
            "birth_city": p.get("birthCity", {}).get("default"),
            "birth_country": p.get("birthCountry"),
            "height_cm": p.get("heightInCentimeters"),
            "weight_kg": p.get("weightInKilograms"),
            "shoots_catches": p.get("shootsCatches"),
            "position": p.get("position"),
            "headshot": p.get("headshot"),
            "hero_image": p.get("heroImage"),
            "player_slug": p.get("playerSlug"),
            "draft_year": p.get("draftDetails", {}).get("year"),
            "draft_team_abbrev": p.get("draftDetails", {}).get("teamAbbrev"),
            "draft_round": p.get("draftDetails", {}).get("round"),
            "draft_overall_pick": p.get("draftDetails", {}).get("overallPick"),
        })
    return rows

def transform_skater_season_stats(raw_data):
    transformed = []
    for item in raw_data['data']:
        stats = SkaterSeasonStats(
            player_id=item['playerId'],
            season_id=item['seasonId'],
            team_abbrev=item.get('teamAbbrevs'),
            full_name=item.get('skaterFullName'),
            position_code=item.get('positionCode'),
            games_played=item.get('gamesPlayed'),
            goals=item.get('goals'),
            assists=item.get('assists'),
            points=item.get('points'),
            plus_minus=item.get('plusMinus'),
            penalty_minutes=item.get('penaltyMinutes'),
            power_play_goals=item.get('ppGoals'),
            pp_points=item.get('ppPoints'),
            sh_goals=item.get('shGoals'),
            sh_points=item.get('shPoints'),
            ev_goals=item.get('evGoals'),
            ev_points=item.get('evPoints'),
            game_winning_goals=item.get('gameWinningGoals'),
            ot_goals=item.get('otGoals'),
            shots=item.get('shots'),
            shooting_pct=item.get('shootingPct'),
            toi_per_game=item.get('timeOnIcePerGame'),
            faceoff_win_pct=item.get('faceoffWinPct'),
            points_per_game=item.get('pointsPerGame'),
            shoots_catches=item.get('shootsCatches'),
        )
        transformed.append(stats.model_dump())
    return transformed

def transform_goalie_season_stats(raw_data):
    transformed = []
    for item in raw_data['data']:
        stats = GoalieSeasonStats(
            player_id=item['playerId'],
            season_id=item['seasonId'],
            team_abbrev=item.get('teamAbbrevs'),
            full_name=item.get('goalieFullName'),
            games_played=item.get('gamesPlayed'),
            games_started=item.get('gamesStarted'),
            wins=item.get('wins'),
            losses=item.get('losses'),
            ot_losses=item.get('otLosses'),
            goals_against=item.get('goalsAgainst'),
            goals_against_average=item.get('goalsAgainstAverage'),
            shots_against=item.get('shotsAgainst'),
            saves=item.get('saves'),
            save_pct=item.get('savePct'),
            shutouts=item.get('shutouts'),
            goals=item.get('goals'),
            assists=item.get('assists'),
            points=item.get('points'),
            penalty_minutes=item.get('penaltyMinutes'),
            toi=item.get('timeOnIce'),
            shoots_catches=item.get('shootsCatches'),
        )
        transformed.append(stats.model_dump())
    return transformed

def _extract_default(value):
    """Extract string from NHL API's {"default": "value"} wrapper."""
    if isinstance(value, dict):
        return value.get("default")
    return value

def transform_skater_game_logs(player_id, game_log):
    transformed = []
    for game in game_log:
        stats = SkaterGameStats(
            player_id=player_id,
            game_id=game['gameId'],
            team_abbrev=_extract_default(game.get('teamAbbrev')),
            home_road=game.get('homeRoadFlag'),
            game_date=game.get('gameDate'),
            opponent_abbrev=_extract_default(game.get('opponentAbbrev')),
            goals=game.get('goals'),
            assists=game.get('assists'),
            points=game.get('points'),
            plus_minus=game.get('plusMinus'),
            penalty_minutes=game.get('pim'),
            power_play_goals=game.get('powerPlayGoals'),
            pp_points=game.get('powerPlayPoints'),
            sh_goals=game.get('shorthandedGoals'),
            sh_points=game.get('shorthandedPoints'),
            game_winning_goals=game.get('gameWinningGoals'),
            ot_goals=game.get('otGoals'),
            shots=game.get('shots'),
            shifts=game.get('shifts'),
            toi=game.get('toi'),
        )
        transformed.append(stats.model_dump())
    return transformed

def transform_goalie_game_logs(player_id, game_log):
    transformed = []
    for game in game_log:
        stats = GoalieGameStats(
            player_id=player_id,
            game_id=game['gameId'],
            team_abbrev=_extract_default(game.get('teamAbbrev')),
            home_road=game.get('homeRoadFlag'),
            game_date=game.get('gameDate'),
            opponent_abbrev=_extract_default(game.get('opponentAbbrev')),
            goals_against=game.get('goalsAgainst'),
            saves=None,  # Not in game log API; computed from shotsAgainst - goalsAgainst
            save_pct=game.get('savePctg'),
            shots_against=game.get('shotsAgainst'),
            decision=game.get('decision'),
            shutouts=game.get('shutouts'),
            games_started=game.get('gamesStarted'),
            penalty_minutes=game.get('pim'),
            toi=game.get('toi'),
        )
        # Compute saves if we have the data
        if game.get('shotsAgainst') is not None and game.get('goalsAgainst') is not None:
            stats.saves = game['shotsAgainst'] - game['goalsAgainst']
        transformed.append(stats.model_dump())
    return transformed

# ---------------------
# Upload Functions
# ---------------------

def upload_teams(cleaned):
    if not cleaned:
        print("No team data to upload")
        return
    res = supabase.table("team_stats").upsert(
        cleaned,
        on_conflict="team_id, season_id"
    ).execute()
    print(f"Team stats uploaded: {len(cleaned)} rows")

def upload_players(cleaned):
    if not cleaned:
        print("No player data to upload")
        return
    res = supabase.table("players").upsert(
        cleaned,
        on_conflict="player_id"
    ).execute()
    print(f"Player data uploaded: {len(cleaned)} rows")

def upload_skater_season_stats(cleaned):
    if not cleaned:
        print("No skater season stats to upload")
        return
    res = supabase.table("player_season_stats").upsert(
        cleaned,
        on_conflict="player_id, season_id"
    ).execute()
    print(f"Skater season stats uploaded: {len(cleaned)} rows")

def upload_goalie_season_stats(cleaned):
    if not cleaned:
        print("No goalie season stats to upload")
        return
    res = supabase.table("goalie_season_stats").upsert(
        cleaned,
        on_conflict="player_id, season_id"
    ).execute()
    print(f"Goalie season stats uploaded: {len(cleaned)} rows")

def _upload_in_batches(table, cleaned, conflict_cols, batch_size=500):
    if not cleaned:
        print(f"No data to upload to {table}")
        return
    total = 0
    for i in range(0, len(cleaned), batch_size):
        batch = cleaned[i:i + batch_size]
        supabase.table(table).upsert(
            batch,
            on_conflict=conflict_cols
        ).execute()
        total += len(batch)
    print(f"{table} uploaded: {total} rows")

def upload_skater_game_stats(cleaned):
    _upload_in_batches("player_game_stats", cleaned, "player_id, game_id")

def upload_goalie_game_stats(cleaned):
    _upload_in_batches("goalie_game_stats", cleaned, "player_id, game_id")

# ---------------------
# Main Pipeline
# ---------------------

if __name__ == "__main__":
    # 1. Team stats
    print("=== Scraping team stats ===")
    raw_teams = scrape_teams()
    transformed_teams = transform_team_stats(raw_teams)
    upload_teams(transformed_teams)

    # 2. Skater season stats (bulk — 1 API call)
    print("\n=== Scraping skater season stats ===")
    raw_skaters = scrape_skater_stats()
    transformed_skaters = transform_skater_season_stats(raw_skaters)
    upload_skater_season_stats(transformed_skaters)

    # 3. Goalie season stats (bulk — 1 API call)
    print("\n=== Scraping goalie season stats ===")
    raw_goalies = scrape_goalie_stats()
    transformed_goalies = transform_goalie_season_stats(raw_goalies)
    upload_goalie_season_stats(transformed_goalies)

    # 4. Player dimension data
    print("\n=== Scraping player dimension data ===")
    raw_players = scrape_players()
    transformed_players = transform_players_dimension(raw_players)
    upload_players(transformed_players)

    # 5. Collect all player IDs from bulk stats, then scrape game logs
    skater_ids = [s['player_id'] for s in transformed_skaters]
    goalie_ids = [g['player_id'] for g in transformed_goalies]
    goalie_id_set = set(goalie_ids)

    all_player_ids = skater_ids + goalie_ids
    print(f"\n=== Scraping game logs for {len(all_player_ids)} players ===")
    all_game_logs = scrape_all_game_logs(all_player_ids)

    # 6. Transform and upload skater game stats
    print("\n=== Processing skater game stats ===")
    all_skater_games = []
    for pid in skater_ids:
        logs = all_game_logs.get(pid, [])
        if logs:
            all_skater_games.extend(transform_skater_game_logs(pid, logs))
    upload_skater_game_stats(all_skater_games)

    # 7. Transform and upload goalie game stats
    print("\n=== Processing goalie game stats ===")
    all_goalie_games = []
    for pid in goalie_ids:
        logs = all_game_logs.get(pid, [])
        if logs:
            all_goalie_games.extend(transform_goalie_game_logs(pid, logs))
    upload_goalie_game_stats(all_goalie_games)

    print("\n=== Pipeline complete ===")
