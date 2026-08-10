# Sensory Melbourne web app

Vue 3, Leaflet and Flask application for sensory-aware pedestrian wayfinding in
Melbourne CBD. The application requests walking alternatives from
OpenRouteService (ORS), scores them using the PostgreSQL/PostGIS data pipeline,
and presents route geometry with written navigation instructions.

## Current functionality

- Browser/mobile current-location detection
- Searchable starting-point override for testing or planning remotely
- Reverse geocoding for the current-location label
- CBD-bounded destination autocomplete
- Three ORS `foot-walking` candidate routes
- Database-backed sensory stress and crowd scores
- Route coverage, freshness and caution messages
- Leaflet rendering of ORS geometry
- Low/moderate/high/unknown route-section colouring
- Route selection and ORS turn-by-turn instructions
- Honest unknown-data and location-permission error states

## Architecture

```text
Vue 3 + Pinia + Leaflet
          |
          | /api/*
          v
       Flask API
        /     \
       v       v
ORS Directions  PostgreSQL/PostGIS
and Geocoding   fact_segment_stress
```

The backend imports the authoritative route-scoring model from the sibling
`sensory-melbourne-ob-data` repository. The ORS API key and database credentials
must never be exposed to the frontend.

## Repository layout

```text
backend/app/api/              Flask API endpoints
backend/app/services/         ORS, geocoding and scoring orchestration
backend/tests/                Backend tests
frontend/src/components/      Search and Leaflet components
frontend/src/services/        HTTP and browser-location clients
frontend/src/stores/          Pinia navigation state
frontend/src/views/           Home, route selection and navigation screens
docs/                         Saved ORS response used for local testing
```

## Prerequisites

- Docker Desktop
- Public `amis0020/ta33-database` Docker image
- `sensory-melbourne-ob-data` checked out for the route-scoring Python module
- Python 3.13+
- Node.js 22.18+ or 24.12+
- ORS API key from [openrouteservice.org](https://openrouteservice.org/)

Keep both repositories as siblings:

```text
onboarding/
├── sensory-melbourne-ob-data/
└── sensory-melbourne-ob-web/
```

## Database setup

Pull the public database image from Docker Hub:

```bash
docker pull --platform linux/amd64 amis0020/ta33-database:latest
```

Create persistent local storage:

```bash
docker volume create ta33-pgdata
```

Start PostgreSQL/PostGIS:

```bash
docker run -d \
  --platform linux/amd64 \
  --name ta33-db \
  --restart unless-stopped \
  -e POSTGRES_USER=ta33 \
  -e POSTGRES_PASSWORD=ta33_local_dev_only \
  -e POSTGRES_DB=ta33 \
  -v ta33-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  amis0020/ta33-database:latest
```

Monitor the initial database import:

```bash
docker logs -f ta33-db
```

Wait until PostgreSQL reports that it is ready to accept connections, then
confirm that segment scores exist:

```bash
docker exec ta33-db psql -U ta33 -d ta33 \
  -c "SELECT sensory_band, COUNT(*) FROM fact_segment_stress GROUP BY sensory_band;"
```

Local connection details:

```text
Host:     localhost
Port:     5432
Database: ta33
Username: ta33
Password: ta33_local_dev_only
```

Useful container commands:

```bash
docker stop ta33-db
docker start ta33-db
docker logs ta33-db
```

## Backend setup

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Configure `backend/.env`:

```dotenv
DATABASE_URL=postgresql://ta33:ta33_local_dev_only@localhost:5432/ta33
ORS_API_KEY=replace_with_your_openrouteservice_key
ORS_DIRECTIONS_URL=https://api.openrouteservice.org/v2/directions/foot-walking/geojson
ORS_GEOCODE_AUTOCOMPLETE_URL=https://api.openrouteservice.org/geocode/autocomplete
ORS_GEOCODE_REVERSE_URL=https://api.openrouteservice.org/geocode/reverse
ORS_TIMEOUT_SECONDS=15
GEOCODE_RESULT_LIMIT=6
DATA_MODEL_PATH=../../sensory-melbourne-ob-data/model
```

`backend/.env` is ignored by Git. Never commit API keys or database passwords.

Start Flask on port 5500:

```bash
.venv/bin/python run.py
```

Health check:

```bash
curl http://localhost:5500/api/health
```

## Frontend setup

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api`
requests to Flask on port 5500.

## API endpoints

### Destination autocomplete

```http
GET /api/geocode/search?q=State+Library&lat=-37.8136&lon=144.9631
```

### Reverse geocoding

```http
GET /api/geocode/reverse?lat=-37.8136&lon=144.9631
```

### Scored route alternatives

```http
POST /api/routes
Content-Type: application/json
```

```json
{
  "origin": { "lat": -37.8136, "lon": 144.9631 },
  "destination": { "lat": -37.8098, "lon": 144.9652 }
}
```

The response contains up to three routes with:

- Leaflet geometry in `[latitude, longitude]` order
- distance and duration
- mean and peak sensory stress
- crowd score and source
- score coverage and freshness
- band-coloured route sections
- ORS turn-by-turn instructions

ORS may return fewer than three routes when it cannot find sufficiently distinct
walking alternatives.

## Testing outside Melbourne CBD

The backend can be tested from Postman using the fixed coordinates above.

To test the complete frontend in Chrome:

1. Open DevTools.
2. Press `Command + Shift + P` on macOS or `Control + Shift + P` elsewhere.
3. Search for **Show Sensors**.
4. Set a custom location:

```text
Latitude:  -37.8117
Longitude: 144.9619
Timezone:  Australia/Melbourne
Locale:    en-AU
```

5. Reload the page and allow location access.
6. Search for and select a CBD destination.

## Automated checks

Backend:

```bash
cd backend
.venv/bin/python -m unittest discover -s tests -v
```

Frontend:

```bash
cd frontend
npm run test:unit -- --run
npm run lint
npm run build
```

## Important data behavior

- Missing sensory evidence is `unknown`, never low/calm.
- Routes with at least 50% coverage are marked `measured`; routes with 15–50%
  coverage show a clearly labelled score for the measured portion; below 15%
  the score is withheld.
- Candidates rank by evidence confidence first and mean stress second. A
  partially measured route is never recommended over a fully measured route.
- “Calmest” means the lowest mean score in the highest available confidence
  tier; it does not mean the route has an absolutely low sensory score.
- All candidates can legitimately be high stress.
- “Live” pedestrian data reflects the newest publisher reading and can carry an
  approximately 35-minute publication delay.
- Frontend stress values are percentages from 0–100; database/model values use
  the 0–1 range.

## Current limitations

- Navigation currently displays a static ORS instruction list; it does not yet
  track progress or automatically advance instructions using live GPS.
- The application is bounded to the Melbourne CBD data coverage area.
- Sensory-model weights are expert-set and still require usability calibration.
- Noise is not included in the route score; a measured-point overlay has not yet
  been added to the web interface.
