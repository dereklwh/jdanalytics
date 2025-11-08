from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List, Dict
from .cache import CACHE, refresher_loop, refresh_once

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
def players(q: str = Query(default="")) -> List[Dict]:
    print(CACHE)
    if not q:
        return CACHE
    ql = q.lower()
    return [p for p in CACHE if ql in p["firstName"].lower() or ql in p["lastName"].lower()]
