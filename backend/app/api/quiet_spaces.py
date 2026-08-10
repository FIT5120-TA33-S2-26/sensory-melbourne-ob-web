from flask import Blueprint, current_app, jsonify, request

from app.services.quiet_space_service import (
    QuietSpaceConfigurationError,
    QuietSpaceUnavailable,
    nearby_quiet_spaces,
)
from app.utils.responses import error_response
from app.utils.validators import ValidationError, coordinate

quiet_spaces_blueprint = Blueprint("quiet_spaces", __name__)


@quiet_spaces_blueprint.get("/api/quiet-spaces")
def nearby():
    """Return parks, libraries, docks and piers within 1.6 km of the user."""
    try:
        location = coordinate(
            {"lat": request.args.get("lat"), "lon": request.args.get("lon")},
            "location",
        )
        return jsonify(nearby_quiet_spaces(location, current_app.config))
    except ValidationError as exc:
        return error_response(str(exc), 400, code="invalid_request")
    except QuietSpaceConfigurationError:
        return error_response(
            "Quiet spaces are not configured", 503, code="configuration_error"
        )
    except QuietSpaceUnavailable:
        return error_response(
            "Quiet spaces are temporarily unavailable",
            503,
            code="quiet_spaces_unavailable",
        )
