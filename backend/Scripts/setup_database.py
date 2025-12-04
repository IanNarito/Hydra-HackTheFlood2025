import sqlite3
import json
import os
import sys

# --- SETUP PATHS DYNAMICALLY ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'Datas')

# Define paths relative to the Datas folder
CLEAN_INPUT_FILE = os.path.join(DATA_DIR, "flood_projects.json")
FLAGGED_INPUT_FILE = os.path.join(DATA_DIR, "flood_flagged_projects.json")
DATABASE_FILE = os.path.join(DATA_DIR, "flood_control.db")

def create_tables(cursor):
    """Create database tables and indexes"""
    print("Creating database tables...")

    # Create main projects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT UNIQUE,
            project_description TEXT,
            year TEXT,
            region TEXT,
            province TEXT,
            municipality TEXT,
            type_of_work TEXT,
            contractor TEXT,
            contract_cost REAL,
            contract_id TEXT,
            legislative_district TEXT,
            district_engineering_office TEXT,
            start_date TEXT,
            completion_date TEXT,
            is_flagged INTEGER DEFAULT 0,
            flag_count INTEGER DEFAULT 0,
            max_severity TEXT,
            suspicion_score REAL DEFAULT 0,
            color_triage TEXT,
            triage_rating TEXT,
            triage_action TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')

    # Create flags table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS project_flags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            severity TEXT,
            flag_type TEXT,
            reason TEXT,
            weight INTEGER,
            FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
    ''')
    
    # Create reports table (For Dropbox)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT UNIQUE,
            description TEXT,
            files TEXT,
            status TEXT DEFAULT 'PENDING', 
            ai_flags TEXT,
            timestamp TEXT,
            admin_notes TEXT
        )
    ''')

    print("Creating indexes...")
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_project_id ON projects(project_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_region ON projects(region)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_suspicion_score ON projects(suspicion_score)')

    print("Tables and indexes created successfully")

def normalize_pid(pid):
    if pid is None: return None
    s = str(pid).strip()
    return s if s != '' else None

def load_json_data():
    print(f"\nLoading data from: {DATA_DIR}")

    try:
        with open(CLEAN_INPUT_FILE, 'r', encoding='utf-8') as f:
            projects = json.load(f)
        print(f"Loaded {len(projects):,} projects from JSON")
    except FileNotFoundError:
        print(f"❌ Error: Could not find {CLEAN_INPUT_FILE}")
        return None, None

    flagged_dict = {}
    try:
        with open(FLAGGED_INPUT_FILE, 'r', encoding='utf-8') as f:
            flagged_projects = json.load(f)
        for fp in flagged_projects:
            pid = normalize_pid(fp.get('project_id'))
            if pid: flagged_dict[pid] = fp
        print(f"Loaded {len(flagged_dict):,} flagged records")
    except FileNotFoundError:
        print(f"⚠️ Warning: {FLAGGED_INPUT_FILE} not found. Proceeding without flags.")

    return projects, flagged_dict

def insert_projects(cursor, projects, flagged_dict):
    print("\nInserting projects into database...")
    inserted = 0
    
    # Clear existing data to avoid duplicates/stale data
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM project_flags")

    for project in projects:
        raw_pid = project.get('project_id')
        project_id = normalize_pid(raw_pid)

        # Merge Flag Data
        is_flagged = 0
        flag_count = 0
        max_severity = None
        suspicion_score = 0
        color_triage = None
        triage_rating = None
        triage_action = None

        flagged_data = flagged_dict.get(project_id) if project_id else None
        if flagged_data:
            is_flagged = 1
            flag_count = flagged_data.get('flag_count', 0)
            max_severity = flagged_data.get('max_severity')
            suspicion_score = flagged_data.get('suspicion_score', 0)
            color_triage = flagged_data.get('color_triage')
            triage_rating = flagged_data.get('triage_rating')
            triage_action = flagged_data.get('triage_action')

        try:
            cursor.execute('''
                INSERT INTO projects (
                    project_id, project_description, year, region, province,
                    municipality, type_of_work, contractor, contract_cost,
                    contract_id, legislative_district, district_engineering_office,
                    start_date, completion_date, is_flagged, flag_count, max_severity,
                    suspicion_score, color_triage, triage_rating, triage_action,
                    latitude, longitude
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                project_id,
                project.get('project_description'),
                project.get('year'),
                project.get('region'),
                project.get('province'),
                project.get('municipality'),
                project.get('type_of_work'),
                project.get('contractor'),
                project.get('contract_cost'),
                project.get('contract_id'),
                project.get('legislative_district'),
                project.get('district_engineering_office'),
                project.get('start_date'),
                project.get('completion_date'),
                is_flagged,
                flag_count,
                max_severity,
                suspicion_score,
                color_triage,
                triage_rating,
                triage_action,
                project.get('latitude'),  # Ensure lat/lng are passed if they exist in JSON
                project.get('longitude')
            ))
            inserted += 1

            # Insert Flags
            if flagged_data and project_id:
                flags = flagged_data.get('flags', [])
                for flag in flags:
                    cursor.execute('''
                        INSERT INTO project_flags (project_id, severity, flag_type, reason, weight)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        project_id,
                        flag.get('severity', 'UNKNOWN'),
                        flag.get('type'),
                        flag.get('reason'),
                        flag.get('weight', 0)
                    ))

        except Exception as e:
            print(f"Error inserting project {project_id}: {e}")

    print(f"Successfully inserted {inserted:,} projects.")

def create_database():
    print("=" * 80)
    print(f"BUILDING DATABASE AT: {DATABASE_FILE}")
    print("=" * 80)

    # Ensure Datas directory exists
    if not os.path.exists(DATA_DIR):
        print(f"❌ Error: Directory {DATA_DIR} does not exist.")
        return

    projects, flagged_dict = load_json_data()
    if not projects:
        return

    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()

    try:
        create_tables(cursor)
        conn.commit()
        insert_projects(cursor, projects, flagged_dict or {})
        conn.commit()
        print("\n✅ DATABASE CREATED SUCCESSFULLY!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_database()
