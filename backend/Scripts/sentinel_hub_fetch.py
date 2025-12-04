import json
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode

# ================= PATH CONFIGURATION =================
# Finds files in backend/Datas/ no matter where you run this script from
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")

INPUT_FILE = os.path.join(DATA_DIR, "satellite_candidates_geocoded.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "satellite_results.json")
# ======================================================

# --- YOUR CREDENTIALS ---
SENTINEL_INSTANCE_ID = "1a5c8e46-65a8-4d86-9612-a23d4016774e"
LAYER_NAME = "TRUE_COLOR"

# --- UPDATED BASE URL FOR CDSE ---
WMS_BASE_URL = f"https://sh.dataspace.copernicus.eu/ogc/wms/{SENTINEL_INSTANCE_ID}"


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
    # Attempt to parse various date formats
    formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y']
    for fmt in formats:
        try:
            return datetime.strptime(str(date_string).split('T')[0], fmt)
        except ValueError:
            continue
    return None


def make_bbox(lat, lon, half_size_deg=0.015):
    """
    0.015 = ~1.5km (Good balance for road context)
    """
    lat_min = lat - half_size_deg
    lat_max = lat + half_size_deg
    lon_min = lon - half_size_deg
    lon_max = lon + half_size_deg
    return [lon_min, lat_min, lon_max, lat_max]


def build_time_range(completion_date_str):
    """
    UPDATED: Looks at a much wider window (6 months before/after)
    to avoid rainy season clouds in the Philippines.
    """
    if completion_date_str:
        dt = parse_date(completion_date_str)
        if dt:
            # +/- 180 days (approx 6 months) to find a clear day
            start = (dt - timedelta(days=180)).strftime("%Y-%m-%d")
            end = (dt + timedelta(days=180)).strftime("%Y-%m-%d")
            return f"{start}/{end}"

    # Fallback: Last 1.5 years
    today = datetime.utcnow().date()
    start = today.replace(
        days=today.day, month=today.month, year=today.year - 2)
    return f"{start.isoformat()}/{today.isoformat()}"


def build_sentinel_wms_url(bbox, time_range, width=512, height=250, maxcc=20):
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "LAYERS": LAYER_NAME,
        "FORMAT": "image/png",
        "WIDTH": str(width),
        "HEIGHT": str(height),

        # 1. Use the computed BBox
        "BBOX": ",".join(f"{x:.6f}" for x in bbox),

        # 2. Change CRS to CRS:84 to ensure Longitude comes first
        "CRS": "CRS:84",

        "TIME": time_range,

        # 3. Keep the cloud filter
        "PRIORITY": "leastCC"
    }
    return f"{WMS_BASE_URL}?{urlencode(params)}"


def main():
    print(f"Loading geocoded satellite candidates from {INPUT_FILE}...")
    candidates = load_json(INPUT_FILE, default=[])

    if not candidates:
        print(f"❌ No data found in {INPUT_FILE}.")
        return

    print(f"Loaded {len(candidates)} geocoded candidates")
