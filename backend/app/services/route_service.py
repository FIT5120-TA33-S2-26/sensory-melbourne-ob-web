from __future__ import annotations

import importlib
import sys
from pathlib import Path

import psycopg
import requests


class RouteServiceError(RuntimeError):
    """Base class for failures safe to translate at the HTTP boundary."""


class RouteConfigurationError(RouteServiceError):
    pass


class ORSUnavailable(RouteServiceError):
    pass


class ORSRejected(RouteServiceError):
    pass


class ScoringUnavailable(RouteServiceError):
    pass


def _load_scoring_module(model_path: str):
    """Load the data repository's authoritative scorer without copying it."""
    path = Path(model_path).expanduser().resolve()
    if not (path / "route_stress.py").is_file():
        raise RouteConfigurationError(
            f"DATA_MODEL_PATH does not contain route_stress.py: {path}"
        )
    path_text = str(path)
    if path_text not in sys.path:
        sys.path.insert(0, path_text)
    return importlib.import_module("route_stress")


def request_ors_routes(origin: dict, destination: dict, config) -> dict:
    """Request up to three walking alternatives from OpenRouteService."""
    api_key = config["ORS_API_KEY"]
    if not api_key:
        raise RouteConfigurationError("ORS_API_KEY is not configured")

    payload = {
        # ORS and GeoJSON use longitude first.
        "coordinates": [
            [origin["lon"], origin["lat"]],
            [destination["lon"], destination["lat"]],
        ],
        "instructions": True,
        "instructions_format": "text",
        "language": "en",
        "alternative_routes": {
            "target_count": 3,
            "weight_factor": 1.6,
            "share_factor": 0.6,
        },
    }
    try:
        response = requests.post(
            config["ORS_DIRECTIONS_URL"],
            json=payload,
            headers={
                "Authorization": api_key,
                "Accept": "application/geo+json, application/json",
                "Content-Type": "application/json",
            },
            timeout=config["ORS_TIMEOUT_SECONDS"],
        )
    except requests.RequestException as exc:
        raise ORSUnavailable("OpenRouteService could not be reached") from exc

    if response.status_code >= 400:
        detail = None
        try:
            body = response.json()
            detail = body.get("error", {}).get("message") or body.get("error")
        except (ValueError, AttributeError):
            detail = response.text[:300]
        raise ORSRejected(str(detail or f"OpenRouteService returned HTTP {response.status_code}"))

    try:
        geojson = response.json()
    except ValueError as exc:
        raise ORSUnavailable("OpenRouteService returned invalid JSON") from exc
    if geojson.get("type") != "FeatureCollection" or not geojson.get("features"):
        raise ORSUnavailable("OpenRouteService returned no walking routes")
    return geojson


def score_routes(geojson: dict, config) -> list[dict]:
    if not config["DATABASE_URL"]:
        raise RouteConfigurationError("DATABASE_URL is not configured")
    scoring = _load_scoring_module(config["DATA_MODEL_PATH"])
    try:
        with psycopg.connect(config["DATABASE_URL"]) as conn:
            provider = scoring.PostgresSegmentProvider(conn)
            return scoring.score_ors_response(geojson, provider)
    except psycopg.Error as exc:
        raise ScoringUnavailable("The sensory-score database is unavailable") from exc


def get_scored_routes(origin: dict, destination: dict, config) -> dict:
    geojson = request_ors_routes(origin, destination, config)
    routes = score_routes(geojson, config)
    timestamps = [route["dataAsOf"] for route in routes if route.get("dataAsOf")]
    metadata = geojson.get("metadata", {})
    return {
        "routes": routes,
        "count": len(routes),
        "data_as_of": min(timestamps) if timestamps else None,
        "attribution": metadata.get(
            "attribution", "openrouteservice.org | OpenStreetMap contributors"
        ),
    }
