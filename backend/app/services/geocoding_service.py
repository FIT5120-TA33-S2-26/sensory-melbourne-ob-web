from __future__ import annotations

import requests


class GeocodingServiceError(RuntimeError):
    pass


class GeocodingConfigurationError(GeocodingServiceError):
    pass


class GeocodingUnavailable(GeocodingServiceError):
    pass


def _api_key(config) -> str:
    key = config["ORS_API_KEY"]
    if not key:
        raise GeocodingConfigurationError("ORS_API_KEY is not configured")
    return key


def _get_geojson(url: str, params: dict, config) -> dict:
    try:
        response = requests.get(
            url,
            params=params,
            headers={"Authorization": _api_key(config), "Accept": "application/json"},
            timeout=config["ORS_TIMEOUT_SECONDS"],
        )
    except requests.RequestException as exc:
        raise GeocodingUnavailable("The ORS geocoder could not be reached") from exc

    if response.status_code >= 400:
        raise GeocodingUnavailable(
            f"The ORS geocoder returned HTTP {response.status_code}"
        )
    try:
        body = response.json()
    except ValueError as exc:
        raise GeocodingUnavailable("The ORS geocoder returned invalid JSON") from exc
    if body.get("type") != "FeatureCollection":
        raise GeocodingUnavailable("The ORS geocoder returned an invalid response")
    return body


def _normalise(feature: dict) -> dict | None:
    geometry = feature.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []
    if geometry.get("type") != "Point" or len(coordinates) < 2:
        return None
    properties = feature.get("properties") or {}
    try:
        lon, lat = float(coordinates[0]), float(coordinates[1])
    except (TypeError, ValueError):
        return None
    label = properties.get("label") or properties.get("name")
    if not label:
        return None
    return {
        "label": label,
        "name": properties.get("name"),
        "lat": lat,
        "lon": lon,
        "locality": properties.get("locality") or properties.get("localadmin"),
        "region": properties.get("region"),
        "country": properties.get("country"),
        "type": properties.get("layer"),
        "confidence": properties.get("confidence"),
    }


def autocomplete(query: str, config, focus: dict | None = None) -> list[dict]:
    lon_min, lat_min, lon_max, lat_max = config["MELBOURNE_CBD_BBOX"]
    params = {
        "text": query,
        "size": config["GEOCODE_RESULT_LIMIT"],
        "boundary.rect.min_lon": lon_min,
        "boundary.rect.min_lat": lat_min,
        "boundary.rect.max_lon": lon_max,
        "boundary.rect.max_lat": lat_max,
    }
    if focus:
        params["focus.point.lat"] = focus["lat"]
        params["focus.point.lon"] = focus["lon"]
    body = _get_geojson(config["ORS_GEOCODE_AUTOCOMPLETE_URL"], params, config)
    return [result for feature in body.get("features", []) if (result := _normalise(feature))]


def reverse_geocode(lat: float, lon: float, config) -> dict | None:
    body = _get_geojson(
        config["ORS_GEOCODE_REVERSE_URL"],
        {"point.lat": lat, "point.lon": lon, "size": 1},
        config,
    )
    for feature in body.get("features", []):
        result = _normalise(feature)
        if result:
            return result
    return None
