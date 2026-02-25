import asyncio
import time
from typing import List, Dict, Any
from .supa import supa

CACHE: List[Dict] = []
REFRESH_SECONDS = 600  # 10m
REFRESH_STATE: Dict[str, Any] = {
    "last_attempt_at": None,
    "last_success_at": None,
    "last_error_at": None,
    "last_error": None,
    "consecutive_failures": 0,
}

# ---------------------------------------------------------------------------
# Generic TTL cache — stores {key: (data, timestamp)}
# ---------------------------------------------------------------------------
_timed_cache: Dict[str, tuple] = {}
TTL_SECONDS = 600  # 10 min, same as player cache


def timed_get(key: str) -> Any | None:
    """Return cached value if present and fresh, else None."""
    entry = _timed_cache.get(key)
    if entry is None:
        return None
    data, ts = entry
    if time.monotonic() - ts > TTL_SECONDS:
        del _timed_cache[key]
        return None
    return data


def timed_set(key: str, data: Any) -> None:
    _timed_cache[key] = (data, time.monotonic())


def get_refresh_state() -> Dict[str, Any]:
    return dict(REFRESH_STATE)

SELECT = '''
"Player ID", first_name, "Last Name", Headshot, "Games Played", Goals, Assists, Points, Position, "Team Abbreviation"
'''

def normalize(r: dict) -> dict:
    return {
        "id": r["Player ID"],
        "Player ID": r["Player ID"],
        "firstName": r["first_name"],
        "lastName": r["Last Name"],
        "headshot": r.get("Headshot"),
        "gamesPlayed": r.get("Games Played"),
        "goals": r.get("Goals"),
        "assists": r.get("Assists"),
        "points": r.get("Points"),
        "position": r.get("Position"),
        "teamAbbr": r.get("Team Abbreviation"),
    }

def set_cache( data: List[Dict] ):
    CACHE.clear()
    CACHE.extend(data)

async def refresh_once():
    REFRESH_STATE["last_attempt_at"] = time.time()
    client = supa()
    try:
        resp = client.table("test_database").select(SELECT).execute()
        data = resp.data or []
        print(f"Fetched {len(data)} players from database")
        set_cache([normalize(r) for r in data])
        print(len(CACHE), "players cached")
    except Exception as e:
        REFRESH_STATE["last_error_at"] = time.time()
        REFRESH_STATE["last_error"] = str(e)
        REFRESH_STATE["consecutive_failures"] += 1
        raise

    REFRESH_STATE["last_success_at"] = time.time()
    REFRESH_STATE["last_error"] = None
    REFRESH_STATE["consecutive_failures"] = 0

async def refresher_loop():
    while True:
        try:
            await refresh_once()
        except Exception as e:
            print("refresh error:", e)
        await asyncio.sleep(REFRESH_SECONDS)
