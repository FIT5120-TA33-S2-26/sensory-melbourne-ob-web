import unittest
from unittest.mock import Mock, patch

from app import create_app
from app.services.route_service import (
    ORSRejected,
    ORSUnavailable,
    ScoringUnavailable,
    request_ors_routes,
)


REQUEST_BODY = {
    "origin": {"lat": -37.8136, "lon": 144.9631},
    "destination": {"lat": -37.8075, "lon": 144.9712},
}


class RoutesApiTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

    @patch("app.api.routes.get_scored_routes")
    def test_valid_request_returns_scored_routes(self, get_scored_routes):
        get_scored_routes.return_value = {
            "routes": [{"id": "calmest", "stress": 42}],
            "count": 1,
            "data_as_of": "2026-08-09T00:00:00+10:00",
            "attribution": "ORS",
        }

        response = self.client.post("/api/routes", json=REQUEST_BODY)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["routes"][0]["id"], "calmest")
        origin, destination, _ = get_scored_routes.call_args.args
        self.assertEqual(origin, REQUEST_BODY["origin"])
        self.assertEqual(destination, REQUEST_BODY["destination"])

    def test_missing_coordinates_are_rejected(self):
        response = self.client.post("/api/routes", json={"origin": REQUEST_BODY["origin"]})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "invalid_request")

    def test_lat_lon_arrays_are_rejected_to_prevent_order_ambiguity(self):
        response = self.client.post(
            "/api/routes",
            json={"origin": [-37.81, 144.96], "destination": [-37.80, 144.97]},
        )

        self.assertEqual(response.status_code, 400)

    @patch("app.api.routes.get_scored_routes", side_effect=ORSUnavailable("down"))
    def test_ors_outage_returns_bad_gateway(self, _):
        response = self.client.post("/api/routes", json=REQUEST_BODY)

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.get_json()["code"], "ors_unavailable")

    @patch("app.api.routes.get_scored_routes", side_effect=ORSRejected("outside graph"))
    def test_ors_rejection_returns_unprocessable_entity(self, _):
        response = self.client.post("/api/routes", json=REQUEST_BODY)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()["code"], "ors_rejected")

    @patch("app.api.routes.get_scored_routes", side_effect=ScoringUnavailable("db down"))
    def test_database_outage_returns_service_unavailable(self, _):
        response = self.client.post("/api/routes", json=REQUEST_BODY)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["code"], "scoring_unavailable")


class OpenRouteServiceRequestTest(unittest.TestCase):
    @patch("app.services.route_service.requests.post")
    def test_request_uses_lon_lat_and_requests_three_alternatives(self, post):
        response = Mock(status_code=200)
        response.json.return_value = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature"}],
        }
        post.return_value = response
        config = {
            "ORS_API_KEY": "secret",
            "ORS_DIRECTIONS_URL": "https://example.test/geojson",
            "ORS_TIMEOUT_SECONDS": 15,
        }

        request_ors_routes(REQUEST_BODY["origin"], REQUEST_BODY["destination"], config)

        kwargs = post.call_args.kwargs
        self.assertEqual(
            kwargs["json"]["coordinates"],
            [[144.9631, -37.8136], [144.9712, -37.8075]],
        )
        self.assertEqual(kwargs["json"]["alternative_routes"]["target_count"], 3)
        self.assertEqual(kwargs["headers"]["Authorization"], "secret")
        self.assertNotIn("secret", kwargs["json"])


if __name__ == "__main__":
    unittest.main()
