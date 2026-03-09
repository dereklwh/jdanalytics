import json
import requests
from pathlib import Path

try:
    from scrapers.season_config import DEFAULT_SEASON_ID
except ImportError:
    from season_config import DEFAULT_SEASON_ID

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

# Scrape NHL teams data and save to a JSON file
def scrape_teams(season_id=DEFAULT_SEASON_ID):
    url = f"https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId={season_id}"
    
    response = requests.get(url)
    data = response.json()
    teams = data.get('data', [])


    with open(RAW_DIR / "teams.json", "w") as f:
        json.dump(teams, f, indent=4)
    print("Teams data saved to teams.json")

    return data

if __name__ == "__main__":
    scrape_teams()
