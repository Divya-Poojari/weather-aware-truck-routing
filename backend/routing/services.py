import math
import requests
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from dateutil import parser
from .risk import assess_checkpoint, RISK_SCORE

MILES_PER_METER = 1 / 1609.344
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OSRM = "https://router.project-osrm.org/route/v1/driving"
OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
HEADERS = {"User-Agent": "WeatherAwareTruckRouting/1.0 (demo project)"}

def geocode(place):
    response = requests.get(NOMINATIM, params={"q": place, "format": "jsonv2", "limit": 1}, headers=HEADERS, timeout=20)
    response.raise_for_status()
    results = response.json()
    if not results:
        raise ValueError(f"Could not find location: {place}")
    return {"lat": float(results[0]["lat"]), "lon": float(results[0]["lon"]), "label": results[0].get("display_name", place)}


def get_routes(origin, destination):
    url = "https://valhalla1.openstreetmap.de/route"

    payload = {
        "locations": [
            {
                "lat": origin["lat"],
                "lon": origin["lon"],
                "type": "break"
            },
            {
                "lat": destination["lat"],
                "lon": destination["lon"],
                "type": "break"
            }
        ],
        "costing": "truck",
        "units": "miles",
        "alternates": 2,
        "format": "osrm",
        "shape_format": "geojson",
        "directions_type": "none"
    }

    headers = {
        "Content-Type": "application/json",
        "X-Client-Id": "weather-aware-truck-routing"
    }

    response = requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=45
    )

    response.raise_for_status()

    data = response.json()

    routes = data.get("routes", [])

    if not routes:
        raise ValueError(
            "Valhalla could not find a route."
        )

    formatted_routes = []

    for route in routes[:3]:
        formatted_routes.append({
            "distance": route["distance"],
            "duration": route["duration"],
            "geometry": {
                "coordinates": route["geometry"]["coordinates"]
            }
        })

    return formatted_routes


def haversine(a, b):
    lat1, lon1 = math.radians(a[1]), math.radians(a[0])
    lat2, lon2 = math.radians(b[1]), math.radians(b[0])
    dlat, dlon = lat2-lat1, lon2-lon1
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371000 * 2 * math.asin(math.sqrt(h))

def route_cumulative(coords):
    cumulative = [0.0]
    for i in range(1, len(coords)):
        cumulative.append(cumulative[-1] + haversine(coords[i-1], coords[i]))
    return cumulative

def interpolate_point(coords, cumulative, target_m):
    if target_m <= 0: return coords[0]
    if target_m >= cumulative[-1]: return coords[-1]
    lo, hi = 0, len(cumulative)-1
    while lo < hi:
        mid = (lo+hi)//2
        if cumulative[mid] < target_m: lo = mid+1
        else: hi = mid
    idx = max(1, lo)
    segment = cumulative[idx]-cumulative[idx-1]
    ratio = (target_m-cumulative[idx-1])/segment if segment else 0
    a, b = coords[idx-1], coords[idx]
    return [a[0]+(b[0]-a[0])*ratio, a[1]+(b[1]-a[1])*ratio]

def weather_at(lat, lon, when):
    # Open-Meteo returns hourly wind, precipitation and snowfall forecasts.
    response = requests.get(OPEN_METEO, params={
        "latitude": lat, "longitude": lon,
        "hourly": "wind_speed_10m,precipitation,rain,snowfall",
        "wind_speed_unit": "mph", "precipitation_unit": "inch",
        "timezone": "UTC", "forecast_days": 7,
    }, timeout=25)
    response.raise_for_status()
    hourly = response.json().get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        return {"wind_mph": None, "rain_in_hr": None, "snow_in_hr": None, "available": False}
    target = when.astimezone(timezone.utc).replace(tzinfo=None)
    parsed = [datetime.fromisoformat(t) for t in times]
    if target < parsed[0] or target > parsed[-1]:
        return {"wind_mph": None, "rain_in_hr": None, "snow_in_hr": None, "available": False}
    before = max((i for i, t in enumerate(parsed) if t <= target), default=0)
    after = min((i for i, t in enumerate(parsed) if t >= target), default=len(parsed)-1)
    def value(key):
        arr = hourly.get(key, [])
        if not arr: return None
        x, y = arr[before], arr[after]
        if x is None and y is None: return None
        if x is None: return float(y)
        if y is None: return float(x)
        if before == after: return float(x)
        ratio = (target-parsed[before]).total_seconds() / (parsed[after]-parsed[before]).total_seconds()
        return float(x) + (float(y)-float(x))*ratio
    wind = value("wind_speed_10m")
    precip = value("precipitation")
    rain = value("rain")
    snow_cm = value("snowfall")
    snow = (snow_cm / 2.54) if snow_cm is not None else None
    # precipitation/rain/snowfall are hourly accumulated depth in inches.
    return {
        "wind_mph": wind,
        "rain_in_hr": rain if rain is not None else precip,
        "snow_in_hr": snow,
        "available": wind is not None or rain is not None or snow is not None,
    }

def build_checkpoints(route, departure, load_lb, spacing_miles):
    coords = route["geometry"]["coordinates"]
    cumulative = route_cumulative(coords)
    total_m = cumulative[-1]
    spacing_m = spacing_miles * 1609.344
    distances = list(range(0, int(total_m), max(1, int(spacing_m))))
    if not distances or distances[-1] != int(total_m):
        distances.append(int(total_m))
    duration_seconds = float(route["duration"])
    # Use route-wide average speed for ETA interpolation along distance.
    checkpoints = []
    for idx, distance in enumerate(distances):
        point = interpolate_point(coords, cumulative, distance)
        fraction = distance / total_m if total_m else 0
        eta = departure + timedelta(seconds=duration_seconds*fraction)
        segment_miles = min(spacing_m, max(0, total_m-distance)) * MILES_PER_METER
        checkpoints.append({
            "id": idx+1, "distance_miles": round(distance*MILES_PER_METER, 1),
            "segment_miles": round(segment_miles, 2),
            "coordinates": [point[1], point[0]], "eta": eta.isoformat(),
            "_lat": point[1], "_lon": point[0], "_eta": eta,
        })
    # Weather calls are independent; bounded concurrency keeps the request practical.
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(weather_at, cp["_lat"], cp["_lon"], cp["_eta"]) for cp in checkpoints]
        for cp, future in zip(checkpoints, futures):
            wx = future.result()
            overall, components = assess_checkpoint(wx["wind_mph"], wx["rain_in_hr"], wx["snow_in_hr"], load_lb)
            cp["weather"], cp["risk"], cp["risk_components"] = wx, overall, components
            del cp["_lat"], cp["_lon"], cp["_eta"]
    return checkpoints

def summarize_route(route, index, departure, load_lb, spacing):
    duration = float(route["duration"])
    distance = float(route["distance"]) * MILES_PER_METER
    checkpoints = build_checkpoints(route, departure, load_lb, spacing)
    severe_miles = sum(c["segment_miles"] for c in checkpoints if c["risk"] == "Severe")
    high_miles = sum(c["segment_miles"] for c in checkpoints if c["risk"] == "High")
    known = [c for c in checkpoints if c["risk"] != "Unknown"]
    total_weight = sum(c["segment_miles"] for c in known) or 1
    avg_risk = sum(RISK_SCORE[c["risk"]]*c["segment_miles"] for c in known)/total_weight
    no_travel_miles = sum(c["segment_miles"] for c in checkpoints if c["risk"] == "No Travel")
    return {
        "id": f"route-{index+1}", "name": f"Route {index+1}",
        "distance_miles": round(distance, 1), "duration_minutes": round(duration/60),
        "eta": (departure+timedelta(seconds=duration)).isoformat(),
        "severe_miles": round(severe_miles, 1), "high_miles": round(high_miles, 1),
        "no_travel_miles": round(no_travel_miles, 1), "average_risk_score": round(avg_risk, 2),
        "checkpoints": checkpoints, "geometry": route["geometry"]["coordinates"],
        "summary": f'{distance:.0f} miles · {duration/3600:.1f} hours · {len(checkpoints)} weather checkpoints',
    }

def analyze_trip(origin, destination, departure_datetime, load_weight_lb, spacing):
    if load_weight_lb < 0: raise ValueError("Load weight cannot be negative.")
    if spacing not in (10, 25, 50): raise ValueError("Sample spacing must be 10, 25, or 50 miles.")
    try: departure = parser.isoparse(departure_datetime)
    except Exception: raise ValueError("Departure date/time must be a valid ISO-8601 date-time.")
    if departure.tzinfo is None: departure = departure.replace(tzinfo=timezone.utc)
    departure = departure.astimezone(timezone.utc)
    origin_geo, destination_geo = geocode(origin), geocode(destination)
    raw_routes = get_routes(origin_geo, destination_geo)
    routes = [summarize_route(r, i, departure, load_weight_lb, spacing) for i, r in enumerate(raw_routes)]
    routes.sort(key=lambda r: (r["severe_miles"], r["high_miles"], r["average_risk_score"], r["duration_minutes"]))
    for rank, route in enumerate(routes, 1): route["rank"] = rank
    best = routes[0]
    return {
        "origin": origin_geo, "destination": destination_geo,
        "departure_datetime": departure.isoformat(), "load_weight_lb": load_weight_lb,
        "sample_spacing_miles": spacing, "routes": routes,
        "recommended_route_id": best["id"],
        "recommendation_reason": "Ranked by fewest Severe miles, then fewest High miles, lowest average risk, and shortest travel time.",
        "forecast_window_hours": 48,
        "provider_notes": ["Routes: OSRM", "Geocoding: OpenStreetMap Nominatim", "Weather: Open-Meteo"],
    }
