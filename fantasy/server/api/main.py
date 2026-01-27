from fastapi import FastAPI, Query
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

@app.get("/players")
def players(q: str = Query(default=""),
            page: int = Query(default=1, ge=1),
            limit: int = Query(default=20, ge=1),
            position: str = Query(default=""),
            team: str = Query(default=""),
            sort_by: str = Query(default="points"),
            sort_order: str = Query(default="desc")
            ) -> Dict[str, Any]:
    filtered = CACHE

    # search by name
    if q:
        ql = q.lower()
        filtered = [p for p in filtered if ql in p["firstName"].lower() or ql in p["lastName"].lower()]

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


@app.get("/teams")
def teams() -> Dict[str, Any]:
    """Return unique team abbreviations from cached players."""
    team_set = set()
    for p in CACHE:
        abbr = p.get("teamAbbr")
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

