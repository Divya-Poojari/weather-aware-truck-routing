RISK_SCORE = {"Low": 0, "Moderate": 1, "High": 2, "Severe": 3, "No Travel": 4, "Unknown": 5}

def classify_wind(mph):
    if mph is None: return "Unknown"
    if mph >= 55: return "No Travel"
    if mph >= 45: return "Severe"
    if mph >= 35: return "High"
    if mph >= 25: return "Moderate"
    return "Low"

def classify_rain(inches_per_hour):
    if inches_per_hour is None: return "Unknown"
    if inches_per_hour > 1.00: return "No Travel"
    if inches_per_hour >= 0.50: return "Severe"
    if inches_per_hour >= 0.25: return "High"
    if inches_per_hour >= 0.10: return "Moderate"
    return "Low"

def classify_snow(inches_per_hour):
    if inches_per_hour is None: return "Unknown"
    if inches_per_hour > 3.0: return "No Travel"
    if inches_per_hour >= 2.0: return "Severe"
    if inches_per_hour >= 1.0: return "High"
    if inches_per_hour >= 0.5: return "Moderate"
    return "Low"

def assess_checkpoint(wind_mph, rain_in_hr, snow_in_hr, load_lb):
    wind = classify_wind(wind_mph)
    if wind_mph is not None:
        if wind_mph >= 55:
            wind = "No Travel"
        elif 45 <= wind_mph < 55 and load_lb > 30000:
            wind = "No Travel"
        elif 35 <= wind_mph < 45 and load_lb > 40000:
            wind = "Severe"
    components = {
        "wind": wind,
        "rain": classify_rain(rain_in_hr),
        "snow": classify_snow(snow_in_hr),
    }
    worst = max(components.values(), key=lambda value: RISK_SCORE[value])
    return worst, components
