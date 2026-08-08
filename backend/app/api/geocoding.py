from flask import Blueprint, current_app, jsonify, request

from app.services.geocoding_service import (
    GeocodingConfigurationError,
    GeocodingUnavailable,
    autocomplete,
    reverse_geocode,
)
from app.utils.responses import error_response
from app.utils.validators import ValidationError, coordinate, search_text

geocoding_blueprint = Blueprint("geocoding", __name__)


@geocoding_blueprint.get("/api/geocode/search")
def search():
    """Return CBD-bounded destination suggestions normalized for the frontend."""
    try:
        query = search_text(request.args.get("q"))
        focus = None
        if request.args.get("lat") is not None or request.args.get("lon") is not None:
            focus = coordinate(
                {"lat": request.args.get("lat"), "lon": request.args.get("lon")},
                "focus",
            )
        results = autocomplete(query, current_app.config, focus)
        return jsonify({"results": results, "count": len(results)})
    except ValidationError as exc:
        return error_response(str(exc), 400, code="invalid_request")
    except GeocodingConfigurationError:
        return error_response(
            "Geocoding is not configured", 503, code="configuration_error"
        )
    except GeocodingUnavailable:
        return error_response(
            "Destination search is temporarily unavailable",
            502,
            code="geocoding_unavailable",
        )


@geocoding_blueprint.get("/api/geocode/reverse")
def reverse():
    """Return a display label for device coordinates; routing does not depend on it."""
    try:
        point = coordinate(
            {"lat": request.args.get("lat"), "lon": request.args.get("lon")},
            "location",
        )
        location = reverse_geocode(point["lat"], point["lon"], current_app.config)
        return jsonify({"location": location})
    except ValidationError as exc:
        return error_response(str(exc), 400, code="invalid_request")
    except GeocodingConfigurationError:
        return error_response(
            "Geocoding is not configured", 503, code="configuration_error"
        )
    except GeocodingUnavailable:
        return error_response(
            "Location name is temporarily unavailable",
            502,
            code="geocoding_unavailable",
        )
