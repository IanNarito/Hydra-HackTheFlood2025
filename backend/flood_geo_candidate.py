# geocode_candidates.py
import json
import time
import os
import requests

CANDIDATES_FILE = "satellite_verification_candidates.json"
OUTPUT_FILE = "satellite_candidates_geocoded.json"
GEOCODE_CACHE_FILE = "geocode_cache.json"

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
    if project.get("barangay"):
        parts.append(str(project["barangay"]))
    if project.get("municipality"):
        parts.append(str(project["municipality"]))
    if project.get("province"):
        parts.append(str(project["province"]))
    parts.append("Philippines")
    return ", ".join(parts)


def geocode_address(address, session, email_for_nominatim=None):
    params = {
        "q": address,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "ghost-project-detector/1.0 (hackathon)",
    }
    if email_for_nominatim:
        params["email"] = email_for_nominatim

    resp = session.get(GEOCODE_URL, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        return None

    item = data[0]
    return {
        "lat": float(item["lat"]),
        "lon": float(item["lon"]),
        "display_name": item.get("display_name"),
        "type": item.get("type"),
        "class": item.get("class")
    }


def main():
    print("Loading satellite verification candidates...")
    candidates = load_json(CANDIDATES_FILE, default=[])
    if not candidates:
        print("No candidates found. Run validator.py first and ensure satellite_verification_candidates.json exists.")
        return

    print(f"Loaded {len(candidates)} candidates")

    geocode_cache = load_json(GEOCODE_CACHE_FILE, default={})
    session = requests.Session()

    enriched = []
    errors = 0

    for i, project in enumerate(candidates, 1):
        address = build_address(project)
        project_id = project.get("project_id", f"idx-{i}")

        print(f"[{i}/{len(candidates)}] {project_id} → {address}")

        # If already geocoded & cached, reuse
        if address in geocode_cache:
            geo = geocode_cache[address]
            print("  -> Using cached geocode")
        else:
            try:
                geo = geocode_address(address, session)
                # Respect Nominatim usage policy: don't spam
                time.sleep(1.0)
            except Exception as e:
                print(f"  !! Geocoding error: {e}")
                geo = None

            geocode_cache[address] = geo

        # Attach geocode info
        project["geocode"] = {
            "query": address,
            "result": geo
        }

        if geo is None:
            errors += 1
            print("  -> No result")

        enriched.append(project)

    print(
        f"\nGeocoding complete. {len(enriched)} projects processed, {errors} with no result.")

    save_json(enriched, OUTPUT_FILE)
    print(f"✓ Geocoded candidates saved to: {OUTPUT_FILE}")
    save_json(geocode_cache, GEOCODE_CACHE_FILE)
    print(f"✓ Geocode cache updated: {GEOCODE_CACHE_FILE}")


if __name__ == "__main__":
    main()
