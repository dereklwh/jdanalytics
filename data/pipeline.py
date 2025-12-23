# pipeline.py
import os
import json
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
from scrapers.scrape_teams import scrape_teams

data = scrape_teams()
print("Data scraped ", data['data'][:1])

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
def upload(cleaned):
    if not cleaned:
        print("no data to upload")
        return
    res = supabase.table("team_stats").upsert(
        cleaned,
        on_conflict="team_id, season_id"
    ).execute()
    print("Data uploaded to Supabase:", res)

if __name__ == "__main__":
    transformed_data = transform(data)
    upload(transformed_data)


    

