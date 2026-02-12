import json
import requests
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

def scrape_skater_stats(season_id="20252026"):
    url = f"https://api.nhle.com/stats/rest/en/skater/summary?cayenneExp=seasonId={season_id}&limit=-1"

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    with open(RAW_DIR / "skater_stats.json", "w") as f:
        json.dump(data, f, indent=4)
    print(f"Skater stats scraped: {len(data.get('data', []))} records")

    return data

if __name__ == "__main__":
    scrape_skater_stats()
