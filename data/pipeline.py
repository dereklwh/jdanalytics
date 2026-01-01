# pipeline.py
import os
import json
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
from scrapers.scrape_teams import scrape_teams
from scrapers.scrape_players import scrape_players

data = scrape_teams()
print("Data scraped ", data['data'][:1])

player_data = scrape_players()
print("Player data scraped ", player_data[:1])

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase client created")

class TeamStats(BaseModel):
    team_id: int
    season_id: int
    games_played: int
    wins: int
    losses: int
    ot_losses: int
    points: int
    goals_for: int
    goals_against: int
    goals_for_per_game: float
    goals_against_per_game: float
    shots_for_per_game: float
    shots_against_per_game: float
    power_play_pct: float
    penalty_kill_pct: float
    faceoff_win_pct: float
    team_full_name: str

""" 
Transform scraped data into validated list of dicts.
Input: list of dicts from scrape_teams
Output: list of dicts ready for upload
"""
def transform(raw_data):
    transformed = []
    for item in raw_data['data']:
        team_stats = TeamStats(
            team_id=item['teamId'],
            season_id=item['seasonId'],
            games_played=item['gamesPlayed'],
            wins=item['wins'],
            losses=item['losses'],
            ot_losses=item['otLosses'],
            points=item['points'],
            goals_for=item['goalsFor'],
            goals_against=item['goalsAgainst'],
            goals_for_per_game=item['goalsForPerGame'],
            goals_against_per_game=item['goalsAgainstPerGame'],
            shots_for_per_game=item['shotsForPerGame'],
            shots_against_per_game=item['shotsAgainstPerGame'],
            power_play_pct=item['powerPlayPct'],
            penalty_kill_pct=item['penaltyKillPct'],
            faceoff_win_pct=item['faceoffWinPct'],
            team_full_name=item['teamFullName']
        )
        transformed.append(team_stats.dict())
    return transformed

"""
Upload transformed data to Supabase
Input: list of dicts from transform
Output: None"""
def upload_teams(cleaned):
    if not cleaned:
        print("no data to upload")
        return
    res = supabase.table("team_stats").upsert(
        cleaned,
        on_conflict="team_id, season_id"
    ).execute()
    print("Data uploaded to Supabase:", res)

def transform_players_dimension(raw):
    rows = []

    for p in raw:
        rows.append({
            "player_id": p["playerId"],
            "first_name": p["firstName"]["default"],
            "last_name": p["lastName"]["default"],
            "birth_date": p.get("birthDate"),
            "birth_city": p.get("birthCity", {}).get("default"),
            "birth_country": p.get("birthCountry"),
            "height_cm": p.get("heightInCentimeters"),
            "weight_kg": p.get("weightInKilograms"),
            "shoots_catches": p.get("shootsCatches"),
            "position": p.get("position"),
            "headshot": p.get("headshot"),
            "hero_image": p.get("heroImage"),
            "player_slug": p.get("playerSlug"),
            "draft_year": p.get("draftDetails", {}).get("year"),
            "draft_team_abbrev": p.get("draftDetails", {}).get("teamAbbrev"),
            "draft_round": p.get("draftDetails", {}).get("round"),
            "draft_overall_pick": p.get("draftDetails", {}).get("overallPick"),
        })

    return rows

def upload_players(cleaned):
    if not cleaned:
        print("no player data to upload")
        return
    res = supabase.table("players").upsert(
        cleaned,
        on_conflict="player_id"
    ).execute()
    print("Player data uploaded to Supabase:", res)



if __name__ == "__main__":
    # Team stats data
    transformed_team_data = transform(data)
    upload_teams(transformed_team_data)

    # Base player data (without stats)
    transformed_player_data = transform_players_dimension(player_data)
    upload_players(transformed_player_data)

    # TODO: Add updated player stats. Maybe don't need to constantly update player base data since it doesn't change often.
    # player_stats = transform_player_stats(player_data)
    # upload_player_stats(player_stats)



    

