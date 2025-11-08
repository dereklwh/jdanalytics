import asyncio
from typing import List, Dict
from .supa import supa

CACHE: List[Dict] = []
REFRESH_SECONDS = 600  # 10m

SELECT = '''
"Player ID", first_name, "Last Name", Headshot, "Games Played", Goals, Assists, Points, Position, "Team Abbreviation"
'''

def normalize(r: dict) -> dict:
    return {
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
    client = supa()
    resp = client.table("test_database").select(SELECT).execute()
    data = resp.data or []
    print(f"Fetched {len(data)} players from database")
    set_cache([normalize(r) for r in data])
    print(len(CACHE), "players cached")

async def refresher_loop():
    while True:
        try:
            await refresh_once()
        except Exception as e:
            print("refresh error:", e)
        await asyncio.sleep(REFRESH_SECONDS)
