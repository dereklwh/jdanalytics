from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List, Dict, Any
from .supa import supa

client = supa()


def _latest_team_stats_season_id() -> int:
    response = (
        client
        .table("team_stats")
        .select("season_id")
        .order("season_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return 0
    return int(rows[0]["season_id"])

def get_standings() -> Dict[str, Any]:
    season_id = _latest_team_stats_season_id()
    if not season_id:
        return {"data": []}
    response = (
        client
        .table("team_stats")
        .select("*")
        .eq("season_id", season_id)
        .order("points", desc=True)
        .order("goals_for", desc=True)
        .execute()
    )
    data = response.data or []
    return {"data": data}

if __name__ == "__main__":
    standings = get_standings()
    print(standings)
