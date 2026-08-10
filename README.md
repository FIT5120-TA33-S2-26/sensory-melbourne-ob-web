# Sensory Melbourne web app

Currently hosted on AWS using EC2 at https://3.27.140.106.sslip.io 

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
- Nearby parks, libraries, docks and piers within 1.6 km of the device location
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

### Nearby quiet spaces

```http
GET /api/quiet-spaces?lat=-37.8136&lon=144.9631
```

The radius is fixed at 1,600 metres. Results are ordered by straight-line
distance and include only categories defensibly identified by the City of
Melbourne landmarks data: parks, named libraries, docks/marinas and piers.

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

## Production deployment on Amazon EC2

The production stack runs on one x86_64 EC2 instance:

```text
Internet :80/:443
        |
        v
   Caddy + Vue
        | /api/* on the private Docker network
        v
 Flask + Gunicorn
        |
        v
 PostgreSQL/PostGIS + persistent Docker volume
```

Caddy serves the Vue build, sends all `/api/*` traffic to Flask, provides the
Vue Router fallback, and obtains/renews HTTPS certificates. PostgreSQL and
Gunicorn do not publish host ports.

### 1. Create the EC2 instance

Recommended prototype configuration:

- Ubuntu 24.04 LTS, x86_64
- `t3.small` or larger
- 30 GiB gp3 EBS
- an Elastic IP
- Sydney (`ap-southeast-2`) when latency to Melbourne matters

Allow these inbound security-group rules:

| Port | Source | Purpose |
|---|---|---|
| 22 | your current public IP only | SSH |
| 80 | `0.0.0.0/0`, `::/0` | HTTP and certificate validation |
| 443 | `0.0.0.0/0`, `::/0` | HTTPS |

Do not open ports 5432 or 5500.

### 2. Install Docker

Connect to the instance:

```bash
ssh -i sensory-melbourne.pem ubuntu@YOUR_ELASTIC_IP
```

Install Docker and the Compose plugin:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

Log out and reconnect so the Docker group membership takes effect.

### 3. Clone and configure the application

```bash
mkdir sensory-melbourne
cd sensory-melbourne
git clone https://github.com/FIT5120-TA33-S2-26/sensory-melbourne-ob-data.git
git clone https://github.com/FIT5120-TA33-S2-26/sensory-melbourne-ob-web.git
git -C sensory-melbourne-ob-data checkout 7b7fc6ada9c64a6f5129af43e1a21d5669666886
cd sensory-melbourne-ob-web
cp .env.production.example .env.production
```

Both repositories are private, so authenticate with GitHub using SSH or a
fine-grained personal access token that has read access. They must remain
sibling directories: Compose supplies `sensory-melbourne-ob-data/model` to the
API build as a private local build context. No GitHub credential is copied into
the resulting image.

Generate a database password containing URL-safe hexadecimal characters:

```bash
openssl rand -hex 24
```

Edit `.env.production` and set:

```dotenv
APP_DOMAIN=YOUR_ELASTIC_IP.sslip.io
ORS_API_KEY=your_new_rotated_ors_key
POSTGRES_USER=ta33
POSTGRES_PASSWORD=the_generated_password
POSTGRES_DB=ta33
```

For example, Elastic IP `3.24.10.20` can use
`3.24.10.20.sslip.io`. `sslip.io` resolves that hostname to the embedded IP,
allowing Caddy to obtain a normal browser-trusted certificate without buying a
domain. A team-owned domain is preferable for a longer-lived deployment.

HTTPS is required for browser geolocation on mobile devices.

### 4. Build and start

```bash
docker compose \
  --env-file .env.production \
  -f compose.production.yaml \
  up -d --build
```

The first startup imports the database snapshot and can take several minutes.
Monitor it with:

```bash
docker compose --env-file .env.production -f compose.production.yaml ps
docker compose --env-file .env.production -f compose.production.yaml logs -f db
docker compose --env-file .env.production -f compose.production.yaml logs -f api web
```

Verify through the public HTTPS endpoint:

```bash
curl https://YOUR_ELASTIC_IP.sslip.io/api/health
curl "https://YOUR_ELASTIC_IP.sslip.io/api/quiet-spaces?lat=-37.8136&lon=144.9631"
```

Then open `https://YOUR_ELASTIC_IP.sslip.io` on a phone and allow location
access.

### 5. Operations

Deploy application updates:

```bash
git pull --ff-only
git -C ../sensory-melbourne-ob-data pull --ff-only
docker compose --env-file .env.production -f compose.production.yaml up -d --build
```

View recent logs:

```bash
docker compose --env-file .env.production -f compose.production.yaml logs --tail=200
```

Restart the stack:

```bash
docker compose --env-file .env.production -f compose.production.yaml restart
```

Back up PostgreSQL before database or host changes:

```bash
mkdir -p backups
set -a
source .env.production
set +a
docker compose --env-file .env.production -f compose.production.yaml \
  exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "backups/ta33-$(date +%Y%m%d-%H%M%S).sql.gz"
```

Also configure automated EBS snapshots. A Docker volume survives container
replacement, but it does not protect against deletion or loss of the EC2
instance and its EBS volume.

### Production notes

- The API image copies the scoring model from the sibling data repository at
  build time. Check out a tested data commit before rebuilding, and record that
  commit with the deployed web revision.
- Updating the database image does not replace an existing PostgreSQL volume.
  Treat production data updates and migrations separately from application
  container updates.
- Never commit `.env.production`, the ORS key, SSH private keys, or database
  backups.
- Rotate the ORS key that previously appeared in GitHub Pages history before
  creating the EC2 deployment.
