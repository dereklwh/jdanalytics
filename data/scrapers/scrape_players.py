import json
import requests
from pathlib import Path
import pandas as pd

RAW_DIR = Path(__file__).parent.parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

# Scrape NHL teams data and save to a JSON file
def scrapePlayer(playerId, key=None):

    """
    Scrapes player data from the NHL website for a given player ID.

    Parameters :
      - playerId (int) : The ID of the player you want to scrape the data for.
      - key (str) : The key to use to extract the data from the response.

    Returns :
      - response (dict) : A dictionary containing the scraped player data.

      Data in dict :
        - playerId
        - isActive
        - currentTeamId
        - currentTeamAbbrev
        - fullTeamName
        - teamCommonName
        - teamPlaceNameWithPreposition
        - firstName
        - lastName
        - teamLogo
        - sweaterNumber
        - position
        - headshot
        - heroImage
        - heightInInches
        - heightInCentimeters
        - weightInPounds
        - weightInKilograms
        - birthDate
        - birthCity
        - birthStateProvince
        - birthCountry
        - shootsCatches
        - draftDetails
        - playerSlug
        - inTop100AllTime
        - inHHOF
        - featuredStats
        - careerTotals
        - shopLink
        - twitterLink
        - watchLink
        - last5Games
        - seasonTotals
        - currentTeamRoster
    """

    url = f"https://api-web.nhle.com/v1/player/{playerId}/landing"

    response = requests.get(url).json()

    if key in response.keys():
        response = response[key]
    else:
        response = response

    return response

def scrapeTeamIds():
    # URL to fetch data from current teams
    current_teams_url = 'https://api.nhle.com/stats/rest/en/team/summary?cayenneExp=seasonId=20242025'

    # Send GET request to NHL API
    response = requests.get(current_teams_url)
    current_team_data = response.json()

    # Retrieve team IDs and abbreviations
    team_ids = [team['teamId'] for team in current_team_data['data']]
    #print("Team IDs:", team_ids)

    teams_url = 'https://api.nhle.com/stats/rest/en/team'
    team_data = requests.get(teams_url).json()
    #print(team_data)
    team_dict = {}


    for data in team_data['data']:
        for id in team_ids:
            if data['id'] == id:
                team_dict[id] = data['triCode']

    team_dict = dict(sorted(team_dict.items()))
    return team_dict

def scrapeAllPlayerIds(team_dict):
    player_ids = []
    base_url = 'https://api-web.nhle.com/v1/'
    team_count = 0
    print(team_dict)
    for item in team_dict:
        team_count += 1
        print(team_count)
        team_abbrv = team_dict[item]
        roster_url_endpoint = f'roster/{team_abbrv}/20252026'
        final_url = base_url + roster_url_endpoint

        print(final_url)
        response = requests.get(final_url)
        roster_data = response.json()
        
        for forward in roster_data['forwards']:
            player_ids.append(forward['id'])

        for defense in roster_data['defensemen']:
            player_ids.append(defense['id'])

        for goalie in roster_data['goalies']:
            player_ids.append(goalie['id'])

    return player_ids



if __name__ == "__main__":
    ids = scrapeAllPlayerIds(team_dict=scrapeTeamIds())

    print(f"Total Player IDs scraped: {len(ids)}")

    all_players_data = []
    for player_id in ids:
        print(f"Scraping data for Player ID: {player_id}")
        player_data = scrapePlayer(playerId=player_id, key=None)
        all_players_data.append(player_data)
    
    pd.json_normalize(all_players_data).to_csv(r'../raw/all_players_data.csv', index=False)