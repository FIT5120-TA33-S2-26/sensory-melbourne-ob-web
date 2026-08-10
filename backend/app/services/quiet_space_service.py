from __future__ import annotations

import psycopg
from psycopg.rows import dict_row


QUIET_SPACE_RADIUS_M = 1600


class QuietSpaceServiceError(RuntimeError):
    """Base class for quiet-space failures exposed at the HTTP boundary."""


class QuietSpaceConfigurationError(QuietSpaceServiceError):
    pass


class QuietSpaceUnavailable(QuietSpaceServiceError):
    pass


# Classification stays deliberately narrow. The landmarks dataset has a formal
# park class, two identifiable libraries, Central Pier, and marina/dock/wharf
# names. It does not justify presenting every public building as a library or
# every waterfront venue as a quiet place.
QUIET_SPACES_SQL = """
WITH origin AS (
    SELECT ST_SetSRID(ST_MakePoint(%(lon)s, %(lat)s), 4326)::geography AS geog
), classified AS (
    SELECT r.refuge_id,
           r.feature_name,
           r.theme,
           r.sub_theme,
           r.loaded_at,
           r.geom,
           CASE
             WHEN r.refuge_class = 'park' THEN 'park'
             WHEN lower(coalesce(r.sub_theme, '')) = 'library'
               OR lower(r.feature_name) LIKE '%%library%%' THEN 'library'
             WHEN lower(r.feature_name) LIKE '%%pier%%' THEN 'pier'
             -- A name such as "DFO South Wharf" is not itself a dock. Require
             -- the source's explicit Marina classification for this category.
             WHEN lower(coalesce(r.sub_theme, '')) = 'marina' THEN 'dock'
             ELSE NULL
           END AS category
    FROM dim_refuge r
)
SELECT c.refuge_id AS id,
       c.feature_name AS name,
       c.category,
       c.theme,
       c.sub_theme,
       round(ST_Distance(c.geom::geography, o.geog))::int AS distance_m,
       ST_Y(c.geom) AS lat,
       ST_X(c.geom) AS lon,
       c.loaded_at
FROM classified c
CROSS JOIN origin o
WHERE c.category IS NOT NULL
  AND ST_DWithin(c.geom::geography, o.geog, %(radius_m)s)
ORDER BY distance_m, c.feature_name
"""


def nearby_quiet_spaces(location: dict[str, float], config) -> dict:
    """Return supported quiet-space categories within the fixed 1.6 km radius."""
    dsn = config["DATABASE_URL"]
    if not dsn:
        raise QuietSpaceConfigurationError("DATABASE_URL is not configured")

    try:
        with psycopg.connect(dsn, row_factory=dict_row) as conn, conn.cursor() as cur:
            cur.execute(
                QUIET_SPACES_SQL,
                {
                    "lat": location["lat"],
                    "lon": location["lon"],
                    "radius_m": QUIET_SPACE_RADIUS_M,
                },
            )
            rows = cur.fetchall()
    except psycopg.Error as exc:
        raise QuietSpaceUnavailable("The quiet-space database is unavailable") from exc

    places = [
        {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "distance": row["distance_m"],
            "lat": float(row["lat"]),
            "lon": float(row["lon"]),
        }
        for row in rows
    ]
    timestamps = [row["loaded_at"] for row in rows if row["loaded_at"] is not None]
    return {
        "places": places,
        "count": len(places),
        "radius": QUIET_SPACE_RADIUS_M,
        "data_as_of": max(timestamps).isoformat() if timestamps else None,
        "attribution": "City of Melbourne Open Data (modified)",
    }
