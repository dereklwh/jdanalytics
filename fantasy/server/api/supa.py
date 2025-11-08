from dotenv import load_dotenv
from supabase import create_client, Client
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_KEY")

def supa() -> Client:
    return create_client(SUPABASE_URL, SERVICE_KEY)
