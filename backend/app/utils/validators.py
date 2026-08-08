class ValidationError(ValueError):
    """The client supplied an invalid route request."""


def coordinate(value, field: str) -> dict[str, float]:
    """Validate an explicit {lat, lon} object, avoiding coordinate-order ambiguity."""
    if not isinstance(value, dict):
        raise ValidationError(f"{field} must be an object containing lat and lon")
    try:
        lat = float(value["lat"])
        lon = float(value["lon"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValidationError(f"{field}.lat and {field}.lon must be numbers") from exc
    if not -90 <= lat <= 90:
        raise ValidationError(f"{field}.lat must be between -90 and 90")
    if not -180 <= lon <= 180:
        raise ValidationError(f"{field}.lon must be between -180 and 180")
    return {"lat": lat, "lon": lon}


def route_request(payload) -> tuple[dict[str, float], dict[str, float]]:
    if not isinstance(payload, dict):
        raise ValidationError("request body must be a JSON object")
    origin = coordinate(payload.get("origin"), "origin")
    destination = coordinate(payload.get("destination"), "destination")
    if origin == destination:
        raise ValidationError("origin and destination must be different")
    return origin, destination


def search_text(value) -> str:
    query = (value or "").strip()
    if len(query) < 2:
        raise ValidationError("q must contain at least 2 characters")
    if len(query) > 120:
        raise ValidationError("q must not exceed 120 characters")
    return query
