import unittest
from unittest.mock import Mock, patch

from app import create_app
from app.services.geocoding_service import autocomplete, reverse_geocode


FEATURE = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [144.9652, -37.8098]},
    "properties": {
        "label": "State Library Victoria, Melbourne",
        "name": "State Library Victoria",
        "locality": "Melbourne",
        "region": "Victoria",
        "country": "Australia",
        "layer": "venue",
        "confidence": 0.95,
    },
}


class GeocodingApiTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

    @patch("app.api.geocoding.autocomplete")
    def test_search_returns_normalised_results(self, search):
        search.return_value = [{"label": "State Library", "lat": -37.81, "lon": 144.96}]

        response = self.client.get(
            "/api/geocode/search?q=State%20Library&lat=-37.8136&lon=144.9631"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["count"], 1)
        query, _, focus = search.call_args.args
        self.assertEqual(query, "State Library")
        self.assertEqual(focus, {"lat": -37.8136, "lon": 144.9631})

    def test_short_search_is_rejected_without_calling_ors(self):
        response = self.client.get("/api/geocode/search?q=s")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["code"], "invalid_request")

    def test_partial_focus_coordinate_is_rejected(self):
        response = self.client.get("/api/geocode/search?q=library&lat=-37.81")

        self.assertEqual(response.status_code, 400)

    @patch("app.api.geocoding.reverse_geocode")
    def test_reverse_returns_location(self, reverse):
        reverse.return_value = {
            "label": "Swanston Street, Melbourne",
            "lat": -37.8136,
            "lon": 144.9631,
        }

        response = self.client.get(
            "/api/geocode/reverse?lat=-37.8136&lon=144.9631"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["location"]["label"], "Swanston Street, Melbourne")


class GeocodingServiceTest(unittest.TestCase):
    def config(self):
        return {
            "ORS_API_KEY": "secret",
            "ORS_TIMEOUT_SECONDS": 15,
            "ORS_GEOCODE_AUTOCOMPLETE_URL": "https://example.test/autocomplete",
            "ORS_GEOCODE_REVERSE_URL": "https://example.test/reverse",
            "GEOCODE_RESULT_LIMIT": 6,
            "MELBOURNE_CBD_BBOX": (144.93, -37.83, 144.99, -37.79),
        }

    @patch("app.services.geocoding_service.requests.get")
    def test_autocomplete_is_cbd_bounded_and_focused(self, get):
        response = Mock(status_code=200)
        response.json.return_value = {"type": "FeatureCollection", "features": [FEATURE]}
        get.return_value = response

        results = autocomplete(
            "State Library",
            self.config(),
            {"lat": -37.8136, "lon": 144.9631},
        )

        params = get.call_args.kwargs["params"]
        self.assertEqual(params["boundary.rect.min_lon"], 144.93)
        self.assertEqual(params["focus.point.lat"], -37.8136)
        self.assertEqual(results[0]["lat"], -37.8098)
        self.assertEqual(results[0]["lon"], 144.9652)
        self.assertNotIn("secret", params)
        self.assertEqual(get.call_args.kwargs["headers"]["Authorization"], "secret")

    @patch("app.services.geocoding_service.requests.get")
    def test_reverse_uses_point_parameters(self, get):
        response = Mock(status_code=200)
        response.json.return_value = {"type": "FeatureCollection", "features": [FEATURE]}
        get.return_value = response

        location = reverse_geocode(-37.8136, 144.9631, self.config())

        params = get.call_args.kwargs["params"]
        self.assertEqual(params["point.lat"], -37.8136)
        self.assertEqual(params["point.lon"], 144.9631)
        self.assertEqual(location["label"], "State Library Victoria, Melbourne")


if __name__ == "__main__":
    unittest.main()
