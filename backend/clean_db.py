import sqlite3
import os

# 1. Find the database using the exact same logic as your API
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, 'Datas', 'flood_control.db')


def clean_database():
    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Error: Database not found at {DATABASE_FILE}")
        return

    # Check initial size
    initial_size = os.path.getsize(DATABASE_FILE) / (1024 * 1024)
    print(f"📉 Current File Size: {initial_size:.2f} MB")

    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        print("🧹 Cleaning data...")

        # 2. Delete data from specific tables (Keeps 'projects' safe)
        cursor.execute("DELETE FROM published_reports")
        print("   - Cleared 'published_reports'")

        cursor.execute("DELETE FROM report_files")
        print("   - Cleared 'report_files'")

        cursor.execute("DELETE FROM reports")
        print("   - Cleared 'reports'")

        # 3. Reset ID counters
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='reports'")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='report_files'")
        cursor.execute(
            "DELETE FROM sqlite_sequence WHERE name='published_reports'")
        print("   - Reset ID counters")

        # 4. VACUUM to shrink file size (Crucial!)
        print("🗜️  Compressing database file (VACUUM)...")
        conn.execute("VACUUM")

        conn.commit()
        conn.close()

        # Check final size
        final_size = os.path.getsize(DATABASE_FILE) / (1024 * 1024)
        print(f"\n✅ SUCCESS! New File Size: {final_size:.2f} MB")
        print("   (Your 'projects' table is still safe inside)")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    clean_database()
