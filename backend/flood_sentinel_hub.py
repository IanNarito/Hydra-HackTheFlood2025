# sentinel_hub_fetch.py
import json
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode

INPUT_FILE = "satellite_candidates_geocoded.json"
OUTPUT_FILE = "satellite_results.json"

# You must set these from your Sentinel Hub account
SENTINEL_INSTANCE_ID = "YOUR_INSTANCE_ID_HERE"
LAYER_NAME = "YOUR_LAYER_NAME_HERE"

# Base WMS endpoint for Sentinel Hub
WMS_BASE_URL = f"https://services.sentinel-hub.com/ogc/wms/{SENTINEL_INSTANCE_ID}"


def load_json(path, default=None):
    if not os.path.exists(path):
        return default if default is not None else []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def parse_date(date_string):
    if not date_string:
        return None
    formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y']
    for fmt in formats:
        try:
            return datetime.strptime(str(date_string).split('T')[0], fmt)
        except ValueError:
            continue
    return None


def make_bbox(lat, lon, half_size_deg=0.002):
    """
    Create a small bounding box around the point.
    half_size_deg ~ 0.002 is ~200-250m, tune as needed.
    Returns [min_lon, min_lat, max_lon, max_lat]
    """
    lat_min = lat - half_size_deg
    lat_max = lat + half_size_deg
    lon_min = lon - half_size_deg
    lon_max = lon + half_size_deg
    return [lon_min, lat_min, lon_max, lat_max]


def build_time_range(completion_date_str):
    """
    Build a time range string for Sentinel Hub.
    E.g. '2020-06-15/2021-06-15'
    If no completion date, use last 2 years as fallback.
    """
    if completion_date_str:
        dt = parse_date(completion_date_str)
        if dt:
            start = dt.strftime("%Y-%m-%d")
            end = (dt + timedelta(days=365)).strftime("%Y-%m-%d")
            return f"{start}/{end}"

    # Fallback: last 2 years
    today = datetime.utcnow().date()
    start = today.replace(year=today.year - 2)
    return f"{start.isoformat()}/{today.isoformat()}"


def build_sentinel_wms_url(bbox, time_range, width=512, height=512, maxcc=40):
    """
    Build a WMS URL to request a PNG image from Sentinel Hub.
    - bbox: [min_lon, min_lat, max_lon, max_lat]
    - time_range: 'YYYY-MM-DD/YYYY-MM-DD'
    """
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "LAYERS": LAYER_NAME,
        "FORMAT": "image/png",
        "MAXCC": str(maxcc),
        "WIDTH": str(width),
        "HEIGHT": str(height),
        "BBOX": ",".join(f"{x:.6f}" for x in bbox),
        "CRS": "EPSG:4326",
        "TIME": time_range
    }
    return f"{WMS_BASE_URL}?{urlencode(params)}"


def main():
    if "YOUR_INSTANCE_ID_HERE" in SENTINEL_INSTANCE_ID or "YOUR_LAYER_NAME_HERE" in LAYER_NAME:
        print("⚠️  Please set SENTINEL_INSTANCE_ID and LAYER_NAME in sentinel_hub_fetch.py before running.")
        return

    print("Loading geocoded satellite candidates...")
    candidates = load_json(INPUT_FILE, default=[])
    if not candidates:
        print("No geocoded candidates found. Run geocode_candidates.py first.")
        return

    print(f"Loaded {len(candidates)} geocoded candidates")

    enriched = []
    with_geo = 0
    without_geo = 0

    for proj in candidates:
        geo = proj.get("geocode", {}).get("result")
        if not geo or geo.get("lat") is None or geo.get("lon") is None:
            without_geo += 1
            proj["satellite"] = {
                "status": "no_geocode",
                "message": "No valid coordinates available"
            }
            enriched.append(proj)
            continue

        lat = geo["lat"]
        lon = geo["lon"]
        bbox = make_bbox(lat, lon)
        time_range = build_time_range(proj.get("completion_date"))

        image_url = build_sentinel_wms_url(bbox, time_range)

        proj["satellite"] = {
            "status": "ready",
            "provider": "sentinel-hub",
            "data_source": "S2",
            "bbox": bbox,
            "time_range": time_range,
            "image_url": image_url
        }
        enriched.append(proj)
        with_geo += 1

    print(
        f"Satellite info attached. {with_geo} with coords, {without_geo} without coords.")

    save_json(enriched, OUTPUT_FILE)
    print(f"✓ Satellite results saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
