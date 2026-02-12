import json
import time
import requests
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

def scrape_player_game_log(player_id, season_id="20252026", game_type="2"):
    url = f"https://api-web.nhle.com/v1/player/{player_id}/game-log/{season_id}/{game_type}"

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    return data.get("gameLog", [])

def scrape_all_game_logs(player_ids, season_id="20252026", game_type="2"):
    all_logs = {}
    total = len(player_ids)

    for i, player_id in enumerate(player_ids, 1):
        try:
            logs = scrape_player_game_log(player_id, season_id, game_type)
            if logs:
                all_logs[player_id] = logs
            if i % 100 == 0:
                print(f"  Game logs: {i}/{total} players scraped")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"  No game log for player {player_id} (404)")
            else:
                print(f"  Error scraping player {player_id}: {e}")
        time.sleep(0.1)

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
