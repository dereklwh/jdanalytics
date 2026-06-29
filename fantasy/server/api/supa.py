from dotenv import load_dotenv
from supabase import create_client, Client
import os
from typing import Callable, Dict, List

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_KEY")

# PostgREST caps a single response at 1000 rows by default, silently truncating
# larger result sets. Page through with .range() so we always get every row.
PAGE_SIZE = 1000


def supa() -> Client:
    return create_client(SUPABASE_URL, SERVICE_KEY)


def fetch_all(query_factory: Callable[[], object], page_size: int = PAGE_SIZE) -> List[Dict]:
    """Fetch every row for a query, paging past PostgREST's 1000-row cap.

    `query_factory` must return a fresh, un-executed select builder each call
    (e.g. ``lambda: client.table("players").select("*")``) so a new .range()
    can be applied per page.
    """
    rows: List[Dict] = []
    start = 0
    while True:
        resp = query_factory().range(start, start + page_size - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        start += page_size
    return rows
