import sqlite3
import json
import os

# ================= PATH CONFIGURATION =================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")

DATABASE_FILE = os.path.join(DATA_DIR, "flood_control.db")
INPUT_JSON = os.path.join(DATA_DIR, "satellite_results.json")
# ======================================================


def main():
    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Error: Database not found.")
        return

    if not os.path.exists(INPUT_JSON):
        print(f"❌ Error: JSON file not found.")
        return

    print(f"Connecting to {DATABASE_FILE}...")
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    # 1. Add the new column (Safely)
    try:
        cursor.execute(
            "ALTER TABLE projects ADD COLUMN satellite_image_url TEXT")
        print("✓ Added column 'satellite_image_url' to projects table.")
    except sqlite3.OperationalError:
        print("✓ Column 'satellite_image_url' already exists.")

    # 2. Load the satellite data
    print("Loading satellite results...")
    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        satellite_data = json.load(f)

    # 3. Prepare the updates
    updates = []
    skipped_count = 0
    debug_limit = 5  # Only print first 5 errors to avoid console spam

    print("\n--- Analyzing JSON Data ---")

    for item in satellite_data:
        # TRY BOTH KEY NAMES: 'id' OR 'project_id'
        project_id = item.get("id") or item.get("project_id")

        sat_info = item.get("satellite", {})
        image_url = sat_info.get("image_url")
        status = sat_info.get("status")

        # VALIDATION LOGIC
        if not project_id:
            skipped_count += 1
            if skipped_count <= debug_limit:
                print(
                    f"⚠️ Skip: Could not find 'id' or 'project_id' in item: {item.keys()}")
            continue

        if status != "ready":
            skipped_count += 1
            if skipped_count <= debug_limit:
                print(
                    f"⚠️ Skip {project_id}: Status is '{status}' (Needs to be 'ready')")
            continue

        if not image_url:
            skipped_count += 1
            if skipped_count <= debug_limit:
                print(f"⚠️ Skip {project_id}: Image URL is empty.")
            continue

        # If we get here, it's valid
        updates.append((image_url, project_id))

    print(f"\n--- Analysis Complete ---")
    print(f"Valid Updates Found: {len(updates)}")
    print(f"Skipped Items: {skipped_count}")

    # 4. Execute Batch Update
    if updates:
        print(f"Applying {len(updates)} updates to database...")
        cursor.executemany(
            "UPDATE projects SET satellite_image_url = ? WHERE project_id = ?",
            updates
        )
        conn.commit()
        print(f"✓ Success! Updated {cursor.rowcount} rows in the database.")

        # Verification check
        cursor.execute(
            "SELECT project_id, satellite_image_url FROM projects WHERE satellite_image_url IS NOT NULL LIMIT 1")
        check = cursor.fetchone()
        if check:
            print(
                f"Verification: Project {check[0]} now has URL: {check[1][:30]}...")
    else:
        print("❌ No updates were performed. Check the skip reasons above.")

    conn.close()


if __name__ == "__main__":
    main()
