from flask import Blueprint, current_app, jsonify, request

from app.services.route_service import (
    ORSRejected,
    ORSUnavailable,
    RouteConfigurationError,
    ScoringUnavailable,
    get_scored_routes,
)
from app.utils.responses import error_response
from app.utils.validators import ValidationError, route_request

routes_blueprint = Blueprint("routes", __name__)


@routes_blueprint.post("/api/routes")
def routes():
    """Return up to three ORS walking alternatives with sensory scores."""
    try:
        origin, destination = route_request(request.get_json(silent=True))
        result = get_scored_routes(origin, destination, current_app.config)
        return jsonify(result)
    except ValidationError as exc:
        return error_response(str(exc), 400, code="invalid_request")
    except RouteConfigurationError as exc:
        current_app.logger.error("Route configuration error: %s", exc)
        return error_response(
            "Route service is not configured", 503, code="configuration_error"
        )
    except ORSRejected as exc:
        return error_response(
            "No walking route could be generated", 422, code="ors_rejected", detail=str(exc)
        )
    except ORSUnavailable:
        return error_response(
            "Walking directions are temporarily unavailable", 502, code="ors_unavailable"
        )
    except ScoringUnavailable:
        return error_response(
            "Sensory scoring is temporarily unavailable", 503, code="scoring_unavailable"
        )
