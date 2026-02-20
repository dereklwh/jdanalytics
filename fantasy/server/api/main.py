from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List, Dict, Any
from .cache import CACHE, refresher_loop, refresh_once
from .supa import supa

client = supa()

async def app_lifespan(app: FastAPI):
    await refresh_once()
    task = asyncio.create_task(refresher_loop())
    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Fantasy Hockey Player API", lifespan=app_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "players_cached": len(CACHE)}


def _build_career_players() -> List[Dict[str, Any]]:
    cache_by_id = {p.get("id"): p for p in CACHE}

    players_resp = (
        client
        .table("players")
        .select("player_id, first_name, last_name, headshot, position")
        .execute()
    )
    players_rows = players_resp.data or []
    players_by_id = {r.get("player_id"): r for r in players_rows}

    skater_resp = (
        client
        .table("player_season_stats")
        .select("player_id, season_id, team_abbrev, games_played, goals, assists, points")
        .execute()
    )
    skater_rows = skater_resp.data or []

    goalie_resp = (
        client
        .table("goalie_season_stats")
        .select("player_id, season_id, team_abbrev, games_played, goals, assists, points")
        .execute()
    )
    goalie_rows = goalie_resp.data or []

    career: Dict[int, Dict[str, Any]] = {}

    def ensure_player(player_id: int) -> Dict[str, Any]:
        if player_id in career:
            return career[player_id]

        db_row = players_by_id.get(player_id) or {}
        cache_row = cache_by_id.get(player_id) or {}
        record = {
            "id": player_id,
            "Player ID": player_id,
            "firstName": db_row.get("first_name") or cache_row.get("firstName") or "",
            "lastName": db_row.get("last_name") or cache_row.get("lastName") or "",
            "headshot": db_row.get("headshot") or cache_row.get("headshot"),
            "position": db_row.get("position") or cache_row.get("position"),
            "teamAbbr": cache_row.get("teamAbbr"),
            "gamesPlayed": 0,
            "goals": 0,
            "assists": 0,
            "points": 0,
            "_latestSeason": -1,
        }
        career[player_id] = record
        return record

    def apply_row(row: Dict[str, Any]):
        player_id = row.get("player_id")
        if player_id is None:
            return
        player = ensure_player(player_id)
        player["gamesPlayed"] += int(_num(row.get("games_played")))
        player["goals"] += int(_num(row.get("goals")))
        player["assists"] += int(_num(row.get("assists")))
        player["points"] += int(_num(row.get("points")))

        season_id = int(_num(row.get("season_id")))
        if season_id >= player["_latestSeason"]:
            player["_latestSeason"] = season_id
            if row.get("team_abbrev"):
                player["teamAbbr"] = row.get("team_abbrev")

    for row in skater_rows:
        apply_row(row)
    for row in goalie_rows:
        apply_row(row)

    rows = []
    for value in career.values():
        value.pop("_latestSeason", None)
        rows.append(value)
    return rows


def _build_season_players() -> List[Dict[str, Any]]:
    cache_by_id = {p.get("id"): p for p in CACHE}

    players_resp = (
        client
        .table("players")
        .select("player_id, first_name, last_name, headshot, position")
        .execute()
    )
    players_rows = players_resp.data or []
    players_by_id = {r.get("player_id"): r for r in players_rows}

    skater_resp = (
        client
        .table("player_season_stats")
        .select("player_id, season_id, team_abbrev, games_played, goals, assists, points, position_code")
        .execute()
    )
    skater_rows = skater_resp.data or []

    goalie_resp = (
        client
        .table("goalie_season_stats")
        .select("player_id, season_id, team_abbrev, games_played, goals, assists, points")
        .execute()
    )
    goalie_rows = goalie_resp.data or []

    # Track which player_ids are goalies so we can assign position="G"
    goalie_ids: set = {row.get("player_id") for row in goalie_rows if row.get("player_id") is not None}

    latest_by_player: Dict[int, Dict[str, Any]] = {}
    for row in skater_rows + goalie_rows:
        player_id = row.get("player_id")
        if player_id is None:
            continue
        season_id = int(_num(row.get("season_id")))
        prev = latest_by_player.get(player_id)
        prev_season = int(_num(prev.get("season_id"))) if prev else -1
        if season_id >= prev_season:
            latest_by_player[player_id] = row

    if not latest_by_player:
        return CACHE

    rows = []
    for player_id, row in latest_by_player.items():
        db_row = players_by_id.get(player_id) or {}
        cache_row = cache_by_id.get(player_id) or {}
        # For skaters, prefer position_code from the season stats row (comes directly from NHL API).
        # For goalies (no position_code in goalie_season_stats), use "G".
        if player_id in goalie_ids:
            position = db_row.get("position") or cache_row.get("position") or "G"
        else:
            position = row.get("position_code") or db_row.get("position") or cache_row.get("position")
        rows.append({
            "id": player_id,
            "Player ID": player_id,
            "firstName": db_row.get("first_name") or cache_row.get("firstName") or "",
            "lastName": db_row.get("last_name") or cache_row.get("lastName") or "",
            "headshot": db_row.get("headshot") or cache_row.get("headshot"),
            "position": position,
            "teamAbbr": row.get("team_abbrev") or cache_row.get("teamAbbr"),
            "gamesPlayed": int(_num(row.get("games_played"))),
            "goals": int(_num(row.get("goals"))),
            "assists": int(_num(row.get("assists"))),
            "points": int(_num(row.get("points"))),
        })
    return rows


@app.get("/players")
def players(q: str = Query(default=""),
            page: int = Query(default=1, ge=1),
            limit: int = Query(default=20, ge=1),
            position: str = Query(default=""),
            team: str = Query(default=""),
            sort_by: str = Query(default="points"),
            sort_order: str = Query(default="desc"),
            stats_scope: str = Query(default="season", pattern="^(season|career)$")
            ) -> Dict[str, Any]:
    # Keep career behavior consistent with legacy app data in CACHE (test_database).
    # Season scope is sourced from the new season-stat tables.
    if stats_scope == "career":
        filtered = CACHE if CACHE else _build_career_players()
    else:
        filtered = _build_season_players()

    # search by name
    if q:
        ql = q.lower()
        filtered = [p for p in filtered if ql in (p.get("firstName") or "").lower() or ql in (p.get("lastName") or "").lower()]

    # filter by position
    if position:
        filtered = [p for p in filtered if p.get("position", "").upper() == position.upper()]

    # filter by team
    if team:
        filtered = [p for p in filtered if p.get("teamAbbr", "").upper() == team.upper()]

    # sorting
    valid_sort_fields = ["points", "goals", "assists", "gamesPlayed", "firstName", "lastName"]
    if sort_by in valid_sort_fields:
        reverse = sort_order.lower() == "desc"
        if sort_by in {"firstName", "lastName"}:
            filtered = sorted(filtered, key=lambda p: (p.get(sort_by) or "").lower(), reverse=reverse)
        else:
            filtered = sorted(filtered, key=lambda p: p.get(sort_by) or 0, reverse=reverse)

    total = len(filtered)

    # pagination
    start = (page - 1) * limit
    end = start + limit
    page_data = filtered[start:end]

    return {
        "data": page_data,
        "page": page,
        "limit": limit,
        "total": total
    }


@app.get("/players/{player_id}")
def get_player(player_id: int) -> Dict[str, Any]:
    """Return a single player by ID."""
    for player in CACHE:
        if player.get("id") == player_id:
            return {"player": player}
    raise HTTPException(status_code=404, detail="Player not found")


def _num(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _latest_season_id(table: str) -> int:
    response = (
        client
        .table(table)
        .select("season_id")
        .order("season_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return 0
    return int(_num(rows[0].get("season_id")))


def _build_radar_context(season_type: str) -> Dict[str, Any]:
    if season_type == "goalie":
        table = "goalie_season_stats"
        fields = "player_id, season_id, games_played, wins, save_pct, goals_against_average, shutouts, games_started, shots_against"
    else:
        table = "player_season_stats"
        fields = "player_id, season_id, games_played, goals, assists, shooting_pct, toi_per_game, pp_points, plus_minus"

    season_id = _latest_season_id(table)
    if season_id == 0:
        return {"season_type": season_type, "season_id": None, "count": 0, "players": []}

    min_gp = 10 if season_type == "goalie" else 10
    response = (
        client
        .table(table)
        .select(fields)
        .eq("season_id", season_id)
        .gte("games_played", min_gp)
        .execute()
    )
    rows = response.data or []
    players = []

    for row in rows:
        if season_type == "goalie":
            players.append({
                "player_id": row.get("player_id"),
                "games_played": _num(row.get("games_played")),
                "wins": _num(row.get("wins")),
                "save_pct": _num(row.get("save_pct")),
                "goals_against_average": _num(row.get("goals_against_average")),
                "shutouts": _num(row.get("shutouts")),
                "games_started": _num(row.get("games_started")),
                "shots_against": _num(row.get("shots_against")),
            })
        else:
            players.append({
                "player_id": row.get("player_id"),
                "games_played": _num(row.get("games_played")),
                "goals": _num(row.get("goals")),
                "assists": _num(row.get("assists")),
                "shooting_pct": _num(row.get("shooting_pct")),
                "toi_per_game": _num(row.get("toi_per_game")),
                "pp_points": _num(row.get("pp_points")),
                "plus_minus": _num(row.get("plus_minus")),
            })

    return {
        "season_type": season_type,
        "season_id": season_id,
        "count": len(players),
        "players": players,
    }


@app.get("/player-radar-context")
def player_radar_context(
    season_type: str = Query(default="skater", pattern="^(skater|goalie)$")
) -> Dict[str, Any]:
    return _build_radar_context(season_type)


def _latest_season_row(player_id: int, table: str) -> Dict[str, Any]:
    response = (
        client
        .table(table)
        .select("*")
        .eq("player_id", player_id)
        .order("season_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else {}


def _load_recent_games(player_id: int, table: str, limit: int = 10) -> List[Dict[str, Any]]:
    response = (
        client
        .table(table)
        .select("*")
        .eq("player_id", player_id)
        .order("game_date", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


def _build_skater_form(games: List[Dict[str, Any]]) -> Dict[str, Any]:
    last5 = games[:5]
    gp = len(last5)
    if gp == 0:
        return {"games": 0, "goals": 0, "assists": 0, "points": 0, "shots": 0, "points_per_game": 0.0}
    goals = sum(int(_num(g.get("goals"))) for g in last5)
    assists = sum(int(_num(g.get("assists"))) for g in last5)
    points = sum(int(_num(g.get("points"))) for g in last5)
    shots = sum(int(_num(g.get("shots"))) for g in last5)
    return {
        "games": gp,
        "goals": goals,
        "assists": assists,
        "points": points,
        "shots": shots,
        "points_per_game": round(points / gp, 2),
    }


def _build_goalie_form(games: List[Dict[str, Any]]) -> Dict[str, Any]:
    last5 = games[:5]
    gp = len(last5)
    if gp == 0:
        return {"games": 0, "wins": 0, "losses": 0, "ot_losses": 0, "save_pct": 0.0, "gaa": 0.0}
    wins = sum(1 for g in last5 if g.get("decision") == "W")
    losses = sum(1 for g in last5 if g.get("decision") == "L")
    ot_losses = sum(1 for g in last5 if g.get("decision") == "OTL")
    goals_against = sum(_num(g.get("goals_against")) for g in last5)
    shots_against = sum(_num(g.get("shots_against")) for g in last5)
    save_pct = (shots_against - goals_against) / shots_against if shots_against > 0 else 0.0
    gaa = goals_against / gp
    return {
        "games": gp,
        "wins": wins,
        "losses": losses,
        "ot_losses": ot_losses,
        "save_pct": round(save_pct, 3),
        "gaa": round(gaa, 2),
    }


def _build_home_away_splits(games: List[Dict[str, Any]], is_goalie: bool) -> Dict[str, Any]:
    home_games = [g for g in games if g.get("home_road") == "H"]
    away_games = [g for g in games if g.get("home_road") == "R"]

    def skater_block(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        gp = len(rows)
        points = sum(int(_num(g.get("points"))) for g in rows)
        goals = sum(int(_num(g.get("goals"))) for g in rows)
        assists = sum(int(_num(g.get("assists"))) for g in rows)
        return {
            "games": gp,
            "goals": goals,
            "assists": assists,
            "points": points,
            "points_per_game": round(points / gp, 2) if gp else 0.0,
        }

    def goalie_block(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        gp = len(rows)
        goals_against = sum(_num(g.get("goals_against")) for g in rows)
        shots_against = sum(_num(g.get("shots_against")) for g in rows)
        save_pct = (shots_against - goals_against) / shots_against if shots_against > 0 else 0.0
        return {
            "games": gp,
            "save_pct": round(save_pct, 3),
            "gaa": round(goals_against / gp, 2) if gp else 0.0,
        }

    block = goalie_block if is_goalie else skater_block
    return {"home": block(home_games), "away": block(away_games)}


@app.get("/players/{player_id}/detail")
def player_detail(player_id: int) -> Dict[str, Any]:
    player_resp = (
        client
        .table("players")
        .select("*")
        .eq("player_id", player_id)
        .limit(1)
        .execute()
    )
    rows = player_resp.data or []
    player_row = rows[0] if rows else None

    cache_row = next((p for p in CACHE if p.get("id") == player_id), None)
    if not player_row and not cache_row:
        raise HTTPException(status_code=404, detail="Player not found")

    position = (player_row or {}).get("position") or (cache_row or {}).get("position")
    is_goalie = str(position or "").upper() == "G"

    season_table = "goalie_season_stats" if is_goalie else "player_season_stats"
    games_table = "goalie_game_stats" if is_goalie else "player_game_stats"

    season = _latest_season_row(player_id, season_table)
    # TODO(#8): Add `games_limit` query param so Player Detail can fetch full-season logs for heatmap/timeline.
    recent_games = _load_recent_games(player_id, games_table, limit=10)
    form = _build_goalie_form(recent_games) if is_goalie else _build_skater_form(recent_games)
    splits = _build_home_away_splits(recent_games, is_goalie=is_goalie)

    player_payload = {
        "id": player_id,
        "firstName": (player_row or {}).get("first_name") or (cache_row or {}).get("firstName"),
        "lastName": (player_row or {}).get("last_name") or (cache_row or {}).get("lastName"),
        "position": position,
        "teamAbbr": (season or {}).get("team_abbrev") or (cache_row or {}).get("teamAbbr"),
        "headshot": (player_row or {}).get("headshot") or (cache_row or {}).get("headshot"),
        "birthDate": (player_row or {}).get("birth_date"),
        "birthCity": (player_row or {}).get("birth_city"),
        "birthCountry": (player_row or {}).get("birth_country"),
        "heightCm": (player_row or {}).get("height_cm"),
        "weightKg": (player_row or {}).get("weight_kg"),
        "shootsCatches": (player_row or {}).get("shoots_catches"),
        "draftYear": (player_row or {}).get("draft_year"),
        "draftRound": (player_row or {}).get("draft_round"),
        "draftOverallPick": (player_row or {}).get("draft_overall_pick"),
    }

    return {
        "player": player_payload,
        "season_type": "goalie" if is_goalie else "skater",
        "season": season,
        "form_last_5": form,
        "home_away_splits": splits,
        "recent_games": recent_games,
    }


@app.get("/teams")
def teams() -> Dict[str, Any]:
    """Return unique team abbreviations from both career and season stats data."""
    team_set = set()
    # Include teams from CACHE (career/legacy data)
    for p in CACHE:
        abbr = p.get("teamAbbr")
        if abbr:
            team_set.add(abbr)
    # Also include teams from current season stats so season-scope team filter works.
    # Filter to current season only — no need to fetch all historical rows.
    for table in ("player_season_stats", "goalie_season_stats"):
        resp = client.table(table).select("team_abbrev").eq("season_id", 20252026).execute()
        for row in (resp.data or []):
            abbr = row.get("team_abbrev")
            if abbr:
                team_set.add(abbr)
    return {"teams": sorted(team_set)}

@app.get("/standings")
def standings() -> Dict[str, Any]:
    response = (
        client
        .table("team_stats")
        .select("*")
        .eq("season_id", 20252026)
        .order("points", desc=True)
        .order("goals_for", desc=True)
        .execute()
    )
    return {
        "standings": response.data
    }
