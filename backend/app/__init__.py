from flask import Flask
from flask_cors import CORS

from app.api.geocoding import geocoding_blueprint
from app.api.health import health_blueprint
from app.api.routes import routes_blueprint
from app.config import Config


def create_app() -> Flask:
    """Create the Flask application used by the Vue client."""
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(geocoding_blueprint)
    app.register_blueprint(health_blueprint)
    app.register_blueprint(routes_blueprint)
    return app
