from flask import Flask
from flask_cors import CORS

from app.api.health import health_blueprint


def create_app() -> Flask:
    """Create the Flask application used by the Vue client."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(health_blueprint)
    return app
