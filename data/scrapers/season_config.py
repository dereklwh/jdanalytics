import os


DEFAULT_SEASON_ID = os.getenv("NHL_SEASON_ID", "20252026")


def season_label(season_id: int | str) -> str:
    text = str(season_id)
    if len(text) != 8 or not text.isdigit():
        return text
    return f"{text[:4]}-{text[4:]}"
