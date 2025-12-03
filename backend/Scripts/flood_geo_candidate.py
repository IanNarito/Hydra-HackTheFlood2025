import json
import time
import os
import requests

# ================= PATH CONFIGURATION =================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")

CANDIDATES_FILE = os.path.join(
    DATA_DIR, "satellite_verification_candidates.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "satellite_candidates_geocoded.json")
GEOCODE_CACHE_FILE = os.path.join(DATA_DIR, "geocode_cache.json")
# ======================================================

# Nominatim (OpenStreetMap) endpoint
GEOCODE_URL = "https://nominatim.openstreetmap.org/search"


def load_json(path, default=None):
    if not os.path.exists(path):
        return default if default is not None else []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def build_address(project):
    parts = []
    if project.get("barangay") and str(project["barangay"]).lower() != "nan":
        parts.append(str(project["barangay"]))
    if project.get("municipality"):
        parts.append(str(project["municipality"]))
    if project.get("province"):
        parts.append(str(project["province"]))
    parts.append("Philippines")
    return ", ".join(parts)


def geocode_address(address, session):
    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }
    # IMPORTANT: Use a User-Agent to prevent getting blocked
    headers = {
        "User-Agent": "FloodControlProjectValidator/1.0 (Hackathon)",
    }

    try:
        resp = session.get(GEOCODE_URL, params=params,
                           headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return None

        item = data[0]
        return {
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
            "display_name": item.get("display_name"),
            "type": item.get("type")
        }
    except Exception as e:
        print(f"  !! Error: {e}")
        return None


def main():
    print("Loading satellite verification candidates...")
    candidates = load_json(CANDIDATES_FILE, default=[])
    if not candidates:
        print(
            f"❌ No candidates found in {CANDIDATES_FILE}. Run flood_validator.py first.")
        return

    total_count = len(candidates)
    print(f"Loaded {total_count} candidates for geocoding.")

    # Load existing cache to avoid re-fetching (speeds up re-runs)
    geocode_cache = load_json(GEOCODE_CACHE_FILE, default={})
    session = requests.Session()

    enriched = []
    new_geocodes = 0
    errors = 0

    for i, project in enumerate(candidates, 1):
        address = build_address(project)

        if i % 10 == 0:
            print(f"Processing {i}/{total_count}...")

        geo = None

        if address in geocode_cache:
            geo = geocode_cache[address]
        else:
            print(f"  Fetching: {address}")
            geo = geocode_address(address, session)

            if geo:
                geocode_cache[address] = geo
                new_geocodes += 1
            else:
                errors += 1

            # Respect API Rate Limit (1 second delay)
            time.sleep(1.1)

        project["geocode"] = {
            "query": address,
            "result": geo
        }
        enriched.append(project)

        # Auto-save cache every 50 requests
        if new_geocodes > 0 and new_geocodes % 50 == 0:
            save_json(geocode_cache, GEOCODE_CACHE_FILE)

    print("\nGeocoding Complete!")
    print(f"Total Processed: {len(enriched)}")
    print(f"Failed/No Res:   {errors}")

    save_json(enriched, OUTPUT_FILE)
    print(f"✓ Saved to: {OUTPUT_FILE}")

    save_json(geocode_cache, GEOCODE_CACHE_FILE)
    print(f"✓ Cache updated: {GEOCODE_CACHE_FILE}")


if __name__ == "__main__":
    main()
