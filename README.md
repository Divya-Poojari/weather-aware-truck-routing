# Weather-Aware Truck Routing

A full-stack React + Django application that compares three driving routes using forecast weather, truck load, and travel time.

## Stack
- Frontend: React 18, Vite, TypeScript, Leaflet, React-Leaflet
- Backend: Django 5, Django REST Framework, requests
- Routing: public OSRM routing service (three alternatives where available)
- Geocoding: OpenStreetMap Nominatim
- Weather: Open-Meteo forecast API (no key required)

## Run locally

### Requirements
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend runs at `http://127.0.0.1:8000`.

### Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

The Vite dev server proxies `/api` to Django. No API keys are required for the included public services.

## How the calculation works
1. Geocode origin and destination using Nominatim.
2. Request up to three alternatives from OSRM.
3. Sample each route at the selected spacing (10, 25, or 50 miles).
4. Interpolate checkpoint coordinates and estimated arrival time from route distance and average route speed.
5. Request Open-Meteo hourly forecast values for each checkpoint. Forecast values are interpolated between hourly slots.
6. Classify wind, rain, and snow independently using the supplied thresholds, then apply load rules.
7. Rank routes lexicographically by severe miles, high miles, average risk score, then duration.

Risk scores used for tie-breaking: Low=0, Moderate=1, High=2, Severe=3, No Travel=4. Checkpoint risk is the highest of wind, rain, snow, and applicable load-adjusted wind risk. Route severe/high miles are calculated from the checkpoint segment represented by each sample, with the final checkpoint representing the remaining segment.

## Notes / limitations
- Public OSRM is a demo routing service, not a commercial truck-routing engine. It does not account for truck height, width, axle limits, hazmat restrictions, bridge clearances, or truck-specific road rules. Do not use this prototype for real dispatch or safety-critical decisions.
- Nominatim and public OSRM/Open-Meteo services have fair-use/rate limits. For production, use a contracted routing/geocoding provider, cache requests, and observe provider policies.
- Open-Meteo forecast availability is limited by forecast horizon and location. The 0–48 hour slider filters the map heat layer and checkpoint forecast display; it does not create forecasts beyond the provider's available data.
- Weather and risk are estimates. The app displays a clear no-data state where forecast data is unavailable rather than treating missing data as safe.
- A three-route comparison is best-effort: OSRM may return fewer than three alternatives for some origin/destination pairs.

## API
`POST /api/route-analysis/`
```json
{
  "origin": "Bengaluru, India",
  "destination": "Hyderabad, India",
  "departure_datetime": "2026-10-30T09:00:00+05:30",
  "load_weight_lb": 32000,
  "sample_spacing_miles": 25
}
```

`GET /api/health/`

## Project structure
```
backend/
  config/                 Django project
  routing/                API, routing/geocoding/weather services, risk engine
frontend/
  src/
    components/           Map, controls, route summaries, heatmap
    api/                  API client and types
```

## Tests
```bash
cd backend
python manage.py test routing
```

## Docker (development)
```bash
docker compose up --build
```
The frontend dev container is available on port 5173 and Django on port 8000.

Open-Meteo's snowfall forecast is supplied in centimetres; the backend converts it to inches before applying the requested snow thresholds.
