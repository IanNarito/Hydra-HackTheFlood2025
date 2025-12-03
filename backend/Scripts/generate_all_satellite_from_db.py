import sqlite3
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode

# ================= CONFIGURATION =================
DATABASE_FILE = "../Datas/flood_control.db"

# YOUR CREDENTIALS
SENTINEL_INSTANCE_ID = "1a5c8e46-65a8-4d86-9612-a23d4016774e"
LAYER_NAME = "TRUE_COLOR"
WMS_BASE_URL = f"https://sh.dataspace.copernicus.eu/ogc/wms/{SENTINEL_INSTANCE_ID}"
# =================================================


def parse_date(date_string):
    """Robust date parser"""
    if not date_string:
        return None
    formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y']
    for fmt in formats:
        try:
            return datetime.strptime(str(date_string).split('T')[0], fmt)
        except ValueError:
            continue
    return None


def build_time_range(completion_date_str):
    """
    Creates a 6-month window around the completion date.
    If no date, defaults to last 1.5 years.
    """
    if completion_date_str:
        dt = parse_date(completion_date_str)
        if dt:
            # +/- 180 days to find a cloud-free day
            start = (dt - timedelta(days=180)).strftime("%Y-%m-%d")
            end = (dt + timedelta(days=180)).strftime("%Y-%m-%d")
            return f"{start}/{end}"

    # Fallback
    today = datetime.utcnow().date()
    start = today.replace(year=today.year - 2)
    return f"{start.isoformat()}/{today.isoformat()}"


def build_sentinel_url(lat, lon, time_range):
    """
    Constructs the CDSE Sentinel-2 URL.
    Includes fixes for:
    1. Zoom level (0.015)
    2. Coordinate System (CRS:84)
    3. Clouds (PRIORITY=leastCC)
    """
    # ZOOM LEVEL: 0.015 degrees is approx 1.5km (Good context)
    half_size = 0.015

    bbox = [
        float(lon) - half_size,
        float(lat) - half_size,
        float(lon) + half_size,
        float(lat) + half_size
    ]

    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "LAYERS": LAYER_NAME,
        "FORMAT": "image/png",
        "WIDTH": "512",
        "HEIGHT": "250",

        # COORDINATE SYSTEM FIX
        "BBOX": ",".join(f"{x:.6f}" for x in bbox),
        "CRS": "CRS:84",

        # TIME & CLOUD FIX
        "TIME": time_range,
        "PRIORITY": "leastCC"
    }
    return f"{WMS_BASE_URL}?{urlencode(params)}"


def main():
    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Database {DATABASE_FILE} not found.")
        return

    print(f"Connecting to {DATABASE_FILE}...")
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name
    cursor = conn.cursor()

    # 1. Check if column exists, create if not
    try:
        cursor.execute(
            "ALTER TABLE projects ADD COLUMN satellite_image_url TEXT")
        print("✓ Added column 'satellite_image_url'")
    except sqlite3.OperationalError:
        pass  # Column exists

    # 2. Fetch ALL projects that have coordinates
    print("Fetching projects with coordinates...")
    cursor.execute("""
        SELECT id, project_id, latitude, longitude, completion_date 
        FROM projects 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    projects = cursor.fetchall()

    total = len(projects)
    print(f"Found {total} projects with valid coordinates.")

    if total == 0:
        print("⚠️ No projects have 'latitude' and 'longitude' set in the database.")
        conn.close()
        return

    # 3. Generate URLs
    updates = []
    print("Generating Satellite URLs...")

    for i, row in enumerate(projects):
        try:
            lat = float(row['latitude'])
            lon = float(row['longitude'])

            # Basic valid range check for Philippines (Lat 4-22, Lon 116-127)
            # This prevents errors if Lat/Lon are 0 or swapped
            if not (4 <= lat <= 22) or not (116 <= lon <= 128):
                continue

            time_range = build_time_range(row['completion_date'])
            url = build_sentinel_url(lat, lon, time_range)

            # Store tuple for batch update: (URL, ID)
            updates.append((url, row['project_id']))

        except (ValueError, TypeError):
            continue

    # 4. Batch Update
    if updates:
        print(f"Updating {len(updates)} rows in database...")
        cursor.executemany(
            "UPDATE projects SET satellite_image_url = ? WHERE project_id = ?",
            updates
        )
        conn.commit()
        print(
            f"✓ SUCCESS! {len(updates)} projects now have satellite imagery.")
    else:
        print("No updates performed.")

    conn.close()


if __name__ == "__main__":
    main()
