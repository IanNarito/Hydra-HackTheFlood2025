import sqlite3
import os

# 1. Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, 'Datas', 'flood_control.db')


def update_database():
    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Error: Database not found at {DATABASE_FILE}")
        return

    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()

        print(f"🔌 Connected to: {DATABASE_FILE}")

        # ==========================================
        # 1. Create the 'published_reports' table
        # ==========================================
        print("🔨 Creating 'published_reports' table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS published_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL UNIQUE,
                published_at TEXT,
                public_summary TEXT,
                admin_notes TEXT,
                FOREIGN KEY (report_id) REFERENCES reports(id)
            )
        ''')

        # ==========================================
        # 2. Add CASCADING DELETE Triggers
        # ==========================================
        # Since SQLite tables often need to be recreated to add "ON DELETE CASCADE",
        # using Triggers is the safest way to ensure data is wiped automatically.

        print("⚙️  Adding cascading delete triggers...")

        # Trigger A: When a Report is deleted -> Delete its Published Entry
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS cascade_delete_published
            AFTER DELETE ON reports
            BEGIN
                DELETE FROM published_reports WHERE report_id = OLD.id;
            END;
        ''')

        # Trigger B: When a Report is deleted -> Delete its Files
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS cascade_delete_files
            AFTER DELETE ON reports
            BEGIN
                DELETE FROM report_files WHERE report_id = OLD.id;
            END;
        ''')

        conn.commit()
        conn.close()
        print("\n✅ SUCCESS: Schema updated.")
        print("   1. 'published_reports' table created.")
        print("   2. Triggers added. (Deleting a report will now auto-delete files and published records).")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    update_database()
