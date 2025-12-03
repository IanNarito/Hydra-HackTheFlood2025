import sqlite3
import os

# ================= PATH CONFIGURATION =================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")
DATABASE_FILE = os.path.join(DATA_DIR, "flood_control.db")
# ======================================================

if not os.path.exists(DATABASE_FILE):
    print(f"❌ Error: Database not found at {DATABASE_FILE}")
    exit()

conn = sqlite3.connect(DATABASE_FILE)
cursor = conn.cursor()

# Check score distribution
cursor.execute('''
    SELECT 
        suspicion_score,
        max_severity,
        COUNT(*) as count
    FROM projects
    GROUP BY suspicion_score, max_severity
    ORDER BY suspicion_score DESC
    LIMIT 20
''')

print("\n=== SCORE & SEVERITY DISTRIBUTION ===")
print(f"{'Score':<10} {'Severity':<20} {'Count':<10}")
print("-" * 40)
for row in cursor.fetchall():
    print(f"{row[0]:<10} {row[1]:<20} {row[2]:<10}")

# Also check some specific examples
cursor.execute('''
    SELECT 
        id,
        project_description,
        suspicion_score,
        max_severity,
        is_flagged
    FROM projects
    WHERE latitude IS NOT NULL
    LIMIT 10
''')

print("\n=== SAMPLE PROJECTS ===")
for row in cursor.fetchall():
    print(f"\nID: {row[0]}")
    print(f"  Name: {row[1][:60]}")
    print(f"  Score: {row[2]}")
    print(f"  Severity: {row[3]}")
    print(f"  Flagged: {row[4]}")

conn.close()
