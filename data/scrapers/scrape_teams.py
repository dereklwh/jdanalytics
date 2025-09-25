
import json
import requests
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

# Scrape NHL teams data and save to a JSON file
def scrape_teams():
    url = "https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=20242025"
    
    response = requests.get(url)
    data = response.json()
    teams = data.get('data', [])


    with open(RAW_DIR / "teams.json", "w") as f:
        json.dump(teams, f, indent=4)
    print("Teams data saved to teams.json")

    return data

if __name__ == "__main__":
    scrape_teams()