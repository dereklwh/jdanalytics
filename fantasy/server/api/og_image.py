"""Generate OG trading-card images for player share previews."""

import io
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
from PIL import Image, ImageDraw, ImageFont

# Standard OG image dimensions
WIDTH, HEIGHT = 1200, 630

# Team colors (mirrors client teamColors.js)
TEAM_COLORS: Dict[str, Tuple[str, str]] = {
    "ANA": ("#F47A38", "#B9975B"), "BOS": ("#FFB81C", "#000000"),
    "BUF": ("#002654", "#FCB514"), "CAR": ("#CC0000", "#000000"),
    "CBJ": ("#002654", "#CE1126"), "CGY": ("#D2001C", "#FAAF19"),
    "CHI": ("#CF0A2C", "#000000"), "COL": ("#6F263D", "#236192"),
    "DAL": ("#006847", "#8F8F8C"), "DET": ("#CE1126", "#FFFFFF"),
    "EDM": ("#041E42", "#FF4C00"), "FLA": ("#041E42", "#C8102E"),
    "LAK": ("#111111", "#A2AAAD"), "MIN": ("#154734", "#A6192E"),
    "MTL": ("#AF1E2D", "#192168"), "NJD": ("#CE1126", "#000000"),
    "NSH": ("#FFB81C", "#041E42"), "NYI": ("#00539B", "#F47D30"),
    "NYR": ("#0038A8", "#CE1126"), "OTT": ("#C52032", "#000000"),
    "PHI": ("#F74902", "#000000"), "PIT": ("#FCB514", "#000000"),
    "SEA": ("#001628", "#99D9D9"), "SJS": ("#006D75", "#000000"),
    "STL": ("#002F87", "#FCB514"), "TBL": ("#002868", "#FFFFFF"),
    "TOR": ("#00205B", "#FFFFFF"), "UTA": ("#71AFE5", "#000000"),
    "VAN": ("#00205B", "#00843D"), "VGK": ("#B4975A", "#333F42"),
    "WPG": ("#041E42", "#004C97"), "WSH": ("#C8102E", "#041E42"),
}

DEFAULT_COLORS = ("#334155", "#475569")

# Simple in-memory cache with TTL
_cache: Dict[int, Tuple[bytes, float]] = {}
_CACHE_TTL = 600  # 10 minutes


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _is_light(hex_color: str) -> bool:
    r, g, b = _hex_to_rgb(hex_color)
    return (r * 299 + g * 587 + b * 114) / 1000 > 160


def _get_font(size: int) -> ImageFont.FreeTypeFont:
    """Try to load a system font, fall back to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/System/Library/Fonts/SFCompact.ttf",
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def _compute_percentiles(
    player_id: int, league_players: List[Dict[str, Any]], is_goalie: bool
) -> Dict[str, int]:
    """Compute percentile ranks for a player against the league."""
    if is_goalie:
        metrics = ["wins", "save_pct", "goals_against_average", "shutouts", "games_started", "shots_against"]
        lower_is_better = {"goals_against_average"}
    else:
        metrics = ["goals", "assists", "shooting_pct", "toi_per_game", "pp_points", "plus_minus"]
        lower_is_better = set()

    target = next((p for p in league_players if p.get("player_id") == player_id), None)
    if not target or len(league_players) < 2:
        return {}

    percentiles = {}
    n = len(league_players)
    for metric in metrics:
        val = target.get(metric)
        if val is None:
            percentiles[metric] = 50
            continue
        below = sum(1 for p in league_players if (p.get(metric) or 0) < val)
        pct = round(below / (n - 1) * 100) if n > 1 else 50
        if metric in lower_is_better:
            pct = 100 - pct
        percentiles[metric] = max(0, min(100, pct))

    return percentiles


def _fetch_headshot(url: str) -> Optional[Image.Image]:
    """Download a player headshot, return as PIL Image or None."""
    try:
        resp = httpx.get(url, timeout=5.0, follow_redirects=True)
        if resp.status_code == 200:
            return Image.open(io.BytesIO(resp.content)).convert("RGBA")
    except Exception:
        pass
    return None


# Friendly label mapping for percentile bars
_SKATER_LABELS = {
    "goals": "Goals",
    "assists": "Assists",
    "shooting_pct": "SH%",
    "toi_per_game": "TOI",
    "pp_points": "PPP",
    "plus_minus": "+/-",
}

_GOALIE_LABELS = {
    "wins": "Wins",
    "save_pct": "SV%",
    "goals_against_average": "GAA",
    "shutouts": "SO",
    "games_started": "GS",
    "shots_against": "SA",
}


def generate_player_card(
    player: Dict[str, Any],
    season: Dict[str, Any],
    season_type: str,
    league_players: List[Dict[str, Any]],
) -> bytes:
    """Render a 1200x630 trading-card PNG and return bytes."""
    player_id = player.get("id", 0)

    # Check cache
    cached = _cache.get(player_id)
    if cached and (time.time() - cached[1]) < _CACHE_TTL:
        return cached[0]

    team_abbr = player.get("teamAbbr") or ""
    primary_hex, secondary_hex = TEAM_COLORS.get(team_abbr, DEFAULT_COLORS)
    primary = _hex_to_rgb(primary_hex)
    secondary = _hex_to_rgb(secondary_hex)
    text_color = (17, 24, 39) if _is_light(primary_hex) else (255, 255, 255)
    muted_color = (
        (100, 100, 100) if _is_light(primary_hex) else (200, 200, 200)
    )

    img = Image.new("RGB", (WIDTH, HEIGHT), primary)
    draw = ImageDraw.Draw(img)

    # Subtle secondary accent strip at bottom
    draw.rectangle([0, HEIGHT - 60, WIDTH, HEIGHT], fill=secondary)

    # Fonts
    font_name = _get_font(42)
    font_sub = _get_font(24)
    font_stat_label = _get_font(18)
    font_stat_val = _get_font(22)
    font_bar_label = _get_font(17)
    font_small = _get_font(15)

    # Headshot
    headshot_x, headshot_y = 60, 60
    headshot_size = 200
    headshot_url = player.get("headshot")
    if headshot_url:
        headshot_img = _fetch_headshot(headshot_url)
        if headshot_img:
            headshot_img = headshot_img.resize(
                (headshot_size, headshot_size), Image.LANCZOS
            )
            # White background behind headshot
            draw.rounded_rectangle(
                [headshot_x - 4, headshot_y - 4, headshot_x + headshot_size + 4, headshot_y + headshot_size + 4],
                radius=12,
                fill=(255, 255, 255),
            )
            img.paste(headshot_img, (headshot_x, headshot_y), headshot_img)

    # Player name
    name_x = headshot_x + headshot_size + 40
    name = f"{player.get('firstName', '')} {player.get('lastName', '')}".upper()
    draw.text((name_x, 70), name, fill=text_color, font=font_name)

    # Position + team
    pos_team = f"{player.get('position', '')}  ·  {team_abbr}"
    draw.text((name_x, 120), pos_team, fill=muted_color, font=font_sub)

    # Season stat line
    is_goalie = season_type == "goalie"
    stat_y = 170
    if is_goalie:
        stat_items = [
            ("GP", season.get("games_played", 0)),
            ("W", season.get("wins", 0)),
            ("SV%", f"{float(season.get('save_pct', 0)):.3f}"),
            ("GAA", f"{float(season.get('goals_against_average', 0)):.2f}"),
        ]
    else:
        stat_items = [
            ("GP", season.get("games_played", 0)),
            ("PTS", season.get("points", 0)),
            ("G", season.get("goals", 0)),
            ("A", season.get("assists", 0)),
        ]

    x_offset = name_x
    for label, value in stat_items:
        draw.text((x_offset, stat_y), str(label), fill=muted_color, font=font_stat_label)
        draw.text((x_offset, stat_y + 22), str(value), fill=text_color, font=font_stat_val)
        x_offset += 120

    # Percentile bars
    percentiles = _compute_percentiles(player_id, league_players, is_goalie)
    labels_map = _GOALIE_LABELS if is_goalie else _SKATER_LABELS

    bar_x = 60
    bar_y_start = 310
    bar_height = 20
    bar_max_width = 340
    bar_spacing = 40

    if percentiles:
        # Section title
        draw.text((bar_x, bar_y_start - 35), "League Percentiles", fill=text_color, font=font_sub)

        for i, (key, label) in enumerate(labels_map.items()):
            pct = percentiles.get(key, 50)
            y = bar_y_start + i * bar_spacing

            # Label
            draw.text((bar_x, y), label, fill=muted_color, font=font_bar_label)

            # Bar background
            bx = bar_x + 60
            draw.rounded_rectangle(
                [bx, y + 2, bx + bar_max_width, y + bar_height],
                radius=4,
                fill=(*text_color, 40) if len(text_color) == 3 else text_color,
            )
            # Muted bar background (use a slightly transparent version of text color)
            bg_bar_color = tuple(
                min(255, c + (180 if _is_light(primary_hex) else -80)) for c in primary
            )
            draw.rounded_rectangle(
                [bx, y + 2, bx + bar_max_width, y + bar_height],
                radius=4,
                fill=bg_bar_color,
            )

            # Filled bar
            fill_width = max(6, int(bar_max_width * pct / 100))
            draw.rounded_rectangle(
                [bx, y + 2, bx + fill_width, y + bar_height],
                radius=4,
                fill=secondary,
            )

            # Percentage text
            draw.text(
                (bx + bar_max_width + 10, y),
                f"{pct}%",
                fill=text_color,
                font=font_bar_label,
            )

    # Right side: larger stat highlight
    right_x = 700
    right_y = 310
    if not is_goalie:
        highlight_stats = [
            ("POINTS", season.get("points", 0)),
            ("GOALS", season.get("goals", 0)),
            ("ASSISTS", season.get("assists", 0)),
        ]
    else:
        highlight_stats = [
            ("WINS", season.get("wins", 0)),
            ("SHUTOUTS", season.get("shutouts", 0)),
            ("SAVE %", f"{float(season.get('save_pct', 0)):.3f}"),
        ]

    big_font = _get_font(52)
    for i, (label, val) in enumerate(highlight_stats):
        y = right_y + i * 85
        draw.text((right_x, y), str(val), fill=text_color, font=big_font)
        draw.text((right_x + 160, y + 20), label, fill=muted_color, font=font_sub)

    # Footer
    footer_text_color = (
        (17, 24, 39) if _is_light(secondary_hex) else (255, 255, 255)
    )
    draw.text((30, HEIGHT - 42), "jdanalytics.vercel.app", fill=footer_text_color, font=font_small)

    season_id = season.get("season_id")
    if season_id:
        s = str(season_id)
        season_label = f"{s[:4]}-{s[4:]}" if len(s) == 8 else str(season_id)
        # Right-align
        bbox = draw.textbbox((0, 0), season_label, font=font_small)
        tw = bbox[2] - bbox[0]
        draw.text((WIDTH - 30 - tw, HEIGHT - 42), season_label, fill=footer_text_color, font=font_small)

    # Export
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    png_bytes = buf.getvalue()

    _cache[player_id] = (png_bytes, time.time())
    return png_bytes
