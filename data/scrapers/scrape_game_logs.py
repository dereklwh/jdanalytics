import json
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from scrapers.season_config import DEFAULT_SEASON_ID
except ImportError:
    from season_config import DEFAULT_SEASON_ID

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

# Number of concurrent requests against the NHL API. Kept modest to stay polite
# and avoid 429s while still cutting wall time by ~10x vs. the old serial loop.
MAX_WORKERS = 12

# Thread-local sessions so each worker reuses a pooled keep-alive connection
# instead of opening a fresh TCP/TLS handshake on every request.
_thread_local = threading.local()


def _session() -> requests.Session:
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
        )
        adapter = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=4)
        session.mount("https://", adapter)
        _thread_local.session = session
    return session


def scrape_player_game_log(player_id, season_id=DEFAULT_SEASON_ID, game_type="2"):
    url = f"https://api-web.nhle.com/v1/player/{player_id}/game-log/{season_id}/{game_type}"

    response = _session().get(url, timeout=30)
    response.raise_for_status()
    data = response.json()

    return data.get("gameLog", [])


def scrape_all_game_logs(player_ids, season_id=DEFAULT_SEASON_ID, game_type="2"):
    all_logs = {}
    total = len(player_ids)
    completed = 0

    def fetch(player_id):
        return player_id, scrape_player_game_log(player_id, season_id, game_type)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch, pid): pid for pid in player_ids}
        for future in as_completed(futures):
            player_id = futures[future]
            completed += 1
            try:
                _, logs = future.result()
                if logs:
                    all_logs[player_id] = logs
            except requests.exceptions.HTTPError as e:
                status = e.response.status_code if e.response is not None else "?"
                if status == 404:
                    print(f"  No game log for player {player_id} (404)")
                else:
                    print(f"  Error scraping player {player_id}: {e}")
            except requests.exceptions.RequestException as e:
                print(f"  Error scraping player {player_id}: {e}")
            if completed % 100 == 0:
                print(f"  Game logs: {completed}/{total} players scraped")

    with open(RAW_DIR / "game_logs.json", "w") as f:
        json.dump(all_logs, f, indent=4)
    print(f"Game logs scraped for {len(all_logs)} players")

    return all_logs


if __name__ == "__main__":
    # Test with a single player (Connor McDavid)
    logs = scrape_player_game_log(8478402)
    print(f"McDavid game logs: {len(logs)} games")
    if logs:
        print(f"Sample: {json.dumps(logs[0], indent=2)}")
