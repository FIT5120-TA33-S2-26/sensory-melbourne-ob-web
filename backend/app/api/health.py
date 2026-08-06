from datetime import datetime, timezone

from flask import Blueprint, jsonify

health_blueprint = Blueprint("health", __name__)


@health_blueprint.get("/api/health")
def health():
    """Report API liveness without requiring the data pipeline to be running."""
    checked_at = datetime.now(timezone.utc).isoformat()
    return jsonify(
        {
            "status": "ok",
            "service": "sensory-melbourne-api",
            "message": "The web API is running.",
            "sources": [],
            "stale_sources": [],
            "data_as_of": checked_at,
        }
    )
