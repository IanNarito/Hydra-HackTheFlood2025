import sqlite3
import re  # Import Regex for text cleaning
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

DATABASE_FILE = "flood_control.db"


def clean_location_name(name):
    """Removes text inside parentheses like (CAPITAL) or (BULACAN)"""
    if not name:
        return ""
    # Remove text inside parentheses e.g., "(CAPITAL)" -> ""
    cleaned = re.sub(r'\s*\(.*?\)', '', name)
    return cleaned.strip()


def main():
    print("🧹 Starting Cleaner Geocoding...")

    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    # 1. Add columns if they don't exist
    try:
        cursor.execute('ALTER TABLE projects ADD COLUMN latitude REAL')
        cursor.execute('ALTER TABLE projects ADD COLUMN longitude REAL')
    except:
        pass

    # 2. Find UNIQUE locations
    print("📊 Analyzing unique locations...")
    cursor.execute('''
        SELECT DISTINCT municipality, province 
        FROM projects 
        WHERE latitude IS NULL AND municipality IS NOT NULL
    ''')

    locations = cursor.fetchall()
    total = len(locations)
    print(f"found {total} unique towns to geocode.")

    geolocator = Nominatim(
        user_agent="hydra_flood_hackathon_2025_cleaner", timeout=10)
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1)

    count = 0

    for index, (municipality, province) in enumerate(locations):
        # CLEAN THE NAME FIRST
        clean_muni = clean_location_name(municipality)

        query = f"{clean_muni}, {province}, Philippines"
        print(f"[{index}/{total}] 📍 Looking up: {query}...", end="\r")

        try:
            location = geocode(query)

            if location:
                # UPDATE the database using the ORIGINAL names to match rows
                cursor.execute('''
                    UPDATE projects 
                    SET latitude = ?, longitude = ? 
                    WHERE municipality = ? AND province = ?
                ''', (location.latitude, location.longitude, municipality, province))

                conn.commit()
                count += 1
            else:
                # Optional: Try one more time with just the municipality
                location_backup = geocode(f"{clean_muni}, Philippines")
                if location_backup:
                    cursor.execute('''
                        UPDATE projects 
                        SET latitude = ?, longitude = ? 
                        WHERE municipality = ? AND province = ?
                    ''', (location_backup.latitude, location_backup.longitude, municipality, province))
                    conn.commit()
                    count += 1
                else:
                    # Print failure on a new line so it doesn't get overwritten
                    print(f"\n❌ Could not find: {query}")

        except Exception as e:
            print(f"\n⚠️ Error: {e}")

    conn.close()
    print(f"\n\n✅ DONE! Successfully mapped {count} towns.")


if __name__ == "__main__":
    main()
