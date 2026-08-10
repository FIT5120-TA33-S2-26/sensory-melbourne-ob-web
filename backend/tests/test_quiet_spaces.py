import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import psycopg

from app import create_app
from app.services.quiet_space_service import QUIET_SPACE_RADIUS_M, nearby_quiet_spaces


class QuietSpacesApiTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

    @patch("app.api.quiet_spaces.nearby_quiet_spaces")
    def test_returns_places_for_valid_location(self, nearby):
        nearby.return_value = {
            "places": [{"id": 1, "name": "Flagstaff Gardens", "category": "park"}],
            "count": 1,
            "radius": 1600,
            "data_as_of": "2026-08-10T00:00:00+00:00",
            "attribution": "City of Melbourne Open Data (modified)",
        }

        response = self.client.get("/api/quiet-spaces?lat=-37.8136&lon=144.9631")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["radius"], 1600)
        nearby.assert_called_once()
        self.assertEqual(nearby.call_args.args[0], {"lat": -37.8136, "lon": 144.9631})

    def test_rejects_missing_or_invalid_coordinates(self):
        missing = self.client.get("/api/quiet-spaces?lat=-37.8136")
        invalid = self.client.get("/api/quiet-spaces?lat=-91&lon=144.9631")

        self.assertEqual(missing.status_code, 400)
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(invalid.get_json()["code"], "invalid_request")


class QuietSpaceServiceTest(unittest.TestCase):
    @patch("app.services.quiet_space_service.psycopg.connect")
    def test_query_uses_fixed_radius_and_normalises_rows(self, connect):
        cursor = MagicMock()
        cursor.fetchall.return_value = [
            {
                "id": 3,
                "name": "State Library Victoria",
                "category": "library",
                "distance_m": 420,
                "lat": -37.8099,
                "lon": 144.9643,
                "loaded_at": datetime(2026, 8, 10, tzinfo=timezone.utc),
            }
        ]
        connection = MagicMock()
        connection.__enter__.return_value = connection
        connection.cursor.return_value.__enter__.return_value = cursor
        connect.return_value = connection

        result = nearby_quiet_spaces(
            {"lat": -37.8136, "lon": 144.9631}, {"DATABASE_URL": "postgresql://test"}
        )

        params = cursor.execute.call_args.args[1]
        self.assertEqual(params["radius_m"], QUIET_SPACE_RADIUS_M)
        self.assertEqual(result["places"][0]["category"], "library")
        self.assertEqual(result["places"][0]["distance"], 420)

    @patch(
        "app.services.quiet_space_service.psycopg.connect",
        side_effect=psycopg.OperationalError("down"),
    )
    def test_database_failure_becomes_service_error(self, _):
        with self.assertRaisesRegex(RuntimeError, "database is unavailable"):
            nearby_quiet_spaces(
                {"lat": -37.8136, "lon": 144.9631},
                {"DATABASE_URL": "postgresql://test"},
            )


if __name__ == "__main__":
    unittest.main()
