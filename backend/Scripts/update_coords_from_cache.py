"""
Quick script to update project coordinates from the geocode cache.
Run this after setup_database.py to populate lat/lng for map display.
"""
import sqlite3
import json
import os

# Path configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")
DATABASE_FILE = os.path.join(DATA_DIR, "flood_control.db")
CACHE_FILE = os.path.join(DATA_DIR, "geocode_cache.json")


def main():
    print("=" * 60)
    print("UPDATING PROJECT COORDINATES FROM CACHE")
    print("=" * 60)

    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Database not found: {DATABASE_FILE}")
        return

    if not os.path.exists(CACHE_FILE):
        print(f"❌ Cache file not found: {CACHE_FILE}")
        return

    # Load geocode cache
    with open(CACHE_FILE, 'r', encoding='utf-8') as f:
        cache = json.load(f)

    print(f"📦 Loaded {len(cache)} cached locations")

    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    # Ensure columns exist
    try:
        cursor.execute('ALTER TABLE projects ADD COLUMN latitude REAL')
    except:
        pass
    try:
        cursor.execute('ALTER TABLE projects ADD COLUMN longitude REAL')
    except:
        pass

    # Get all unique municipality/province combinations
    cursor.execute('''
        SELECT DISTINCT municipality, province 
        FROM projects 
        WHERE municipality IS NOT NULL
    ''')
    locations = cursor.fetchall()
    print(f"📍 Found {len(locations)} unique locations in database")

    updated = 0
    for municipality, province in locations:
        # Build cache key (same format as add_geocoding.py)
        cache_key = f"{municipality}, {province}, Philippines"
        
        if cache_key in cache and cache[cache_key]:
            lat = cache[cache_key].get('lat')
            lon = cache[cache_key].get('lon')
            
            if lat and lon:
                cursor.execute('''
                    UPDATE projects 
                    SET latitude = ?, longitude = ? 
                    WHERE municipality = ? AND province = ?
                ''', (lat, lon, municipality, province))
                updated += 1

    conn.commit()

    # Check results
    cursor.execute('SELECT COUNT(*) FROM projects WHERE latitude IS NOT NULL')
    with_coords = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM projects')
    total = cursor.fetchone()[0]

    conn.close()

    print(f"\n✅ Updated {updated} location groups")
    print(f"📊 Projects with coordinates: {with_coords}/{total}")
    
    if with_coords == 0:
        print("\n⚠️  No coordinates were added. You may need to run add_geocoding.py first.")


if __name__ == "__main__":
    main()
