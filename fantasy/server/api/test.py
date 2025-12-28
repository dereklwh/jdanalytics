from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List, Dict, Any
from .supa import supa

client = supa()

def get_standings() -> Dict[str, Any]:
    response = (
        client
        .table("team_stats")
        .select("*")
        .eq("season_id", 20252026)
        .order("points", desc=True)
        .order("goals_for", desc=True)
        .execute()
    )
    data = response.data or []
    return {"data": data}

if __name__ == "__main__":
    standings = get_standings()
    print(standings)