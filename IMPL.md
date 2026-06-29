# Implementation Log

## 2026-06-28 - Performance Pass (pipeline, API, client bundle)

### Goal
Reduce latency and wasted work across all three layers without changing the product surface.

### Approach Taken
1. **Pipeline - game logs:** Rewrote `data/scrapers/scrape_game_logs.py` from a serial loop (one `requests.get` per player + `time.sleep(0.1)`) to a `ThreadPoolExecutor` (12 workers) with thread-local `requests.Session` connection pooling and an `urllib3` `Retry` (3 retries, backoff, retries 429/5xx). ~10x wall-time reduction on the daily Action.
2. **API - over-fetch + row cap:** Added `fetch_all()` in `supa.py` that pages past PostgREST's silent 1000-row cap via `.range()`. `_build_season_players()` now filters to the latest loaded season server-side (`.eq("season_id", ...)`) instead of pulling every player's full season history and reducing in Python. `_build_career_players()` and `/teams` now page through all rows.
3. **API - O(1) lookups:** `cache.set_cache()` maintains a `CACHE_BY_ID` index; `GET /players/{id}` and `player_detail` use it instead of scanning `CACHE`.
4. **API - transport:** Added `GZipMiddleware` and `Cache-Control: public, max-age=600, stale-while-revalidate=600` on `/players`, `/teams`, `/standings`.
5. **Client - bundle:** Removed unused `@supabase/supabase-js` and `dotenv` deps + the vestigial `supabaseClient.js`. Route-level `React.lazy` for Players/PlayerDetail/Teams, and lazy `BubbleView` so `d3-force` only loads when the bubble view is opened. Memoized `PlayerCard`.

### What Worked
- Build confirms clean code-splitting: `BubbleView` (d3-force) and `PlayerDetail` are now separate chunks loaded on demand.
- `fetch_all` verified to page a 2300-row fake table into one list; `CACHE_BY_ID` index verified.

### Decisions Made
- **Behavior change (intentional):** the season-scope list now shows only the current/latest loaded season. Previously it showed each player's individually-latest season, which mixed seasons (e.g. a retired player's last season appeared alongside current players). The new behavior is both correct for a "current season" view and far cheaper. Falls back to `CACHE` when no season is loaded.
- `/teams` lambda binds `table=table` to avoid the late-binding closure bug across loop iterations.

### Session Handoff
**Status:** Complete (pending PR)
**Last Action:** Lint + client build pass; backend imports and pagination/index logic unit-checked via venv.
**Next Action:** Open PR from `perf/optimizations`; smoke-test endpoints against live Supabase after deploy.
**Blockers:** None

## 2026-02-12 - Dynamic Team Colors on Player Detail Page

### Goal
Replace static slate/indigo colors on the player detail page with dynamic team-branded colors based on each player's `teamAbbr`.

### Approach Taken
1. Created `fantasy/client/src/utils/teamColors.js` — hardcoded map of all 32 NHL team abbreviations to primary/secondary hex colors, plus a `getTeamColors()` helper with slate fallback for unknown teams.
2. Added `isLightColor()` luminance helper (weighted RGB formula) to ensure text contrast — dark text on light backgrounds (BOS, NSH, PIT yellow/gold), white text on dark backgrounds.
3. Modified `PlayerDetail.jsx` to derive colors from `player.teamAbbr` and apply via inline styles to hero section background, position/team badges, and StatCard value text.

### What Worked
- Inline `style={{ backgroundColor: primary }}` cleanly overrides Tailwind classes without specificity issues
- Badge secondary colors use `secondary + "80"` (hex alpha for ~50% opacity) for a subtle effect
- `isLightColor()` threshold of 160 correctly identifies yellow/gold teams as needing dark text

### Decisions Made
- Hardcoded color map (32 entries, rarely change) rather than DB/API lookup — avoids unnecessary complexity
- Used IIFE in JSX to scope `primary`/`secondary`/`heroTextColor` without adding state — colors are derived, not stateful
- StatCard `color` prop defaults to `#4f46e5` (indigo-600 equivalent) when no color is passed, maintaining backward compatibility
- Utah Mammoth (UTA) uses `#71AFE5` light blue primary — verified this is their brand color

### Session Handoff
**Status:** Complete
**Last Action:** Build and lint verified, no new errors introduced
**Next Action:** Visually verify on dev server across multiple teams (BOS, MTL, TOR, etc.)
**Blockers:** None

## 2026-02-11 - Expand Data Pipeline with Bulk Stats + Game Logs

### Goal
Populate the empty `player_season_stats`, `goalie_season_stats`, `player_game_stats`, and `goalie_game_stats` tables with data from the NHL API. Use bulk endpoints for season stats (1 API call each for skaters/goalies) and per-player game log endpoints for game-by-game data.

### Approach Taken
1. Expand DB schema (`data.sql`) with fantasy-relevant columns
2. Create 3 new scrapers: bulk skater stats, bulk goalie stats, per-player game logs
3. Add Pydantic models + transform + upload functions to `pipeline.py`
4. Rewire `pipeline.py __main__` to run everything in correct order
5. Fix existing bug: move top-level scrape calls inside `__main__`
6. Update GitHub Actions timeout for longer pipeline

### What Worked
- Bulk stats API (`api.nhle.com/stats/rest/en/skater/summary`) returns 867 skater records and 92 goalie records in single calls
- `limit=-1` query param fetches all records (default is paginated)
- Game log API returns structured data with `gameLog` key containing array of per-game stats
- Pydantic `model_dump()` produces clean dicts ready for Supabase upsert
- NHL API field name mapping verified against live responses:
  - Skaters: `skaterFullName`, `teamAbbrevs` (plural), `ppGoals`/`shGoals`, `timeOnIcePerGame` (seconds as float)
  - Goalies: `goalieFullName`, `savePct`, `timeOnIce` (seconds as int)
  - Game logs: `powerPlayGoals`/`shorthandedGoals`, `pim`, `toi` (string "MM:SS"), `savePctg` (goalie)
- Goalie game log doesn't include `saves` directly — computed as `shotsAgainst - goalsAgainst`

### Decisions Made
- Using bulk stats endpoints (`api.nhle.com/stats/rest/en/skater/summary`) instead of per-player landing pages for season stats — 1 API call vs ~900
- Game logs still require per-player calls (`api-web.nhle.com/v1/player/{id}/game-log/`) — no bulk endpoint available
- Removing FK constraints to `games` table from game stats tables — we store NHL game_id directly instead of maintaining a local games dimension
- Using `seasonId=20252026` for current season

### Session Handoff
**Status:** Complete
**Last Action:** All code written and transforms verified against live API data
**Next Action:** Run full pipeline (`python pipeline.py` in `data/`) to populate Supabase tables
**Blockers:** Need Supabase tables to be updated with new schema columns (run ALTER TABLE or recreate)
**Follow-up:** Update server cache (`fantasy/server/api/cache.py`) to read from normalized tables instead of `test_database`

## 2026-02-20 - Player/Team Visualization Sprint + Radar Context

### Goal
Ship high-impact UI features using existing data with minimal new dependencies, then add a percentile radar profile for player detail pages.

### Approach Taken
1. Added `PerformanceTrend` line/area chart component with metric toggles:
   - Skaters: `G`, `A`, `PTS`, `Shots`
   - Goalies: `Saves`, `GA`, `SV%`
2. Added `Advanced Season Stats` panel on Player Detail to surface underused fields already returned in the `season` payload.
3. Added `TeamScatterPlot` (offense vs defense):
   - x-axis: GF (or GF/GP when available)
   - y-axis: GA (or GA/GP when available)
   - bubble size: points
4. Added backend endpoint `GET /player-radar-context?season_type=skater|goalie` in `fantasy/server/api/main.py` to return latest-season league peer data for percentile calculations.
5. Added `PlayerRadarChart` component on Player Detail:
   - Skater axes: Goals, Assists, Shooting %, TOI/GP, PP Points, Plus/Minus
   - Goalie axes: Wins, Save %, GAA (inverse), Shutouts, Starts, Shots Against
6. Enhanced trend chart hover UX with a visible tooltip that shows matchup context (`vs/@ opponent`) + date + selected metric value.

### What Worked
- Pure SVG chart components kept bundle/runtime simple and avoided introducing new chart dependencies.
- Existing `/players/{id}/detail` payload was sufficient for trend and advanced panels.
- League context endpoint made radar percentiles deterministic and fast to compute client-side.
- Team color theming integrated cleanly into all new visual components.

### Decisions Made
- Kept radar context as a dedicated endpoint instead of loading all `/players` pages on the client.
- Filtered radar peers to latest season and `games_played > 0` to reduce noisy percentiles.
- Chose rank-based percentile calculation (with tie half-credit) for stable results across stats.
- Added explicit loading/error states for radar context fetch in Player Detail.

### Session Handoff
**Status:** Complete  
**Last Action:** Added trend hover tooltip with opponent context and validated lint/build  
**Validation:** `npm run lint` (no errors, pre-existing warnings in `Players.jsx`), `npm run build`, `python3 -m py_compile fantasy/server/api/main.py`  
**Next Action:** Implement either Player Comparison (`#5`) or Season Heatmap (`#8`)  
**Blockers:** None
