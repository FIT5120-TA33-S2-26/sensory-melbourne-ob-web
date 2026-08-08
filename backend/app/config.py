import os
from pathlib import Path

from dotenv import load_dotenv


# `python run.py` creates the app before Flask's development server gets a
# chance to load dotenv files. Load the backend-local file before evaluating
# the configuration class so local ORS and database settings are available.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _data_model_path() -> str:
    configured = os.environ.get("DATA_MODEL_PATH")
    if configured:
        path = Path(configured).expanduser()
        if not path.is_absolute():
            path = Path(__file__).resolve().parents[1] / path
        return str(path.resolve())
    return str(
        (
            Path(__file__).resolve().parents[3]
            / "sensory-melbourne-ob-data"
            / "model"
        ).resolve()
    )


class Config:
    """Runtime configuration; secrets stay in environment variables."""

    ORS_API_KEY = os.environ.get("ORS_API_KEY", "")
    ORS_DIRECTIONS_URL = os.environ.get(
        "ORS_DIRECTIONS_URL",
        "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
    )
    ORS_GEOCODE_AUTOCOMPLETE_URL = os.environ.get(
        "ORS_GEOCODE_AUTOCOMPLETE_URL",
        "https://api.openrouteservice.org/geocode/autocomplete",
    )
    ORS_GEOCODE_REVERSE_URL = os.environ.get(
        "ORS_GEOCODE_REVERSE_URL",
        "https://api.openrouteservice.org/geocode/reverse",
    )
    ORS_TIMEOUT_SECONDS = float(os.environ.get("ORS_TIMEOUT_SECONDS", "15"))
    GEOCODE_RESULT_LIMIT = int(os.environ.get("GEOCODE_RESULT_LIMIT", "6"))
    MELBOURNE_CBD_BBOX = (144.93, -37.83, 144.99, -37.79)
    DATABASE_URL = os.environ.get("DATABASE_URL", "")
    DATA_MODEL_PATH = _data_model_path()
