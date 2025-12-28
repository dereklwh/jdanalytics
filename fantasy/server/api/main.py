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
            limit: int = Query(default=20, ge=1)
            ) -> Dict[str, Any]:
    print(CACHE)
    if q:
        ql = q.lower()
        filtered = [p for p in CACHE if ql in p["firstName"].lower() or ql in p["lastName"].lower()]
    else:
        filtered = CACHE
    
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

