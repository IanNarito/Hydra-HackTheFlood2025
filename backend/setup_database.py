import sqlite3
import json
import os

# Configuration
CLEAN_INPUT_FILE = "flood_projects.json"
FLAGGED_INPUT_FILE = "flood_flagged_projects.json"
DATABASE_FILE = "flood_control.db"


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
            triage_action TEXT
        )
    ''')

    # Create flags table - UPDATED to include weight
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

    print("Creating indexes...")

    # Create indexes for better query performance
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_project_id ON projects(project_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_region ON projects(region)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_province ON projects(province)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_contractor ON projects(contractor)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_is_flagged ON projects(is_flagged)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_max_severity ON projects(max_severity)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_suspicion_score ON projects(suspicion_score)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_year ON projects(year)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_flag_project_id ON project_flags(project_id)')

    print("Tables and indexes created successfully")


def normalize_pid(pid):
    """Normalize project_id for consistent dictionary keys and comparisons."""
    if pid is None:
        return None
    s = str(pid).strip()
    return s if s != '' else None


def load_json_data():
    """Load projects and flagged data from JSON files"""
    print("\nLoading data from JSON files...")

    try:
        with open(CLEAN_INPUT_FILE, 'r', encoding='utf-8') as f:
            projects = json.load(f)
        print(f"Loaded {len(projects):,} projects from {CLEAN_INPUT_FILE}")
    except FileNotFoundError:
        print(f"Error: {CLEAN_INPUT_FILE} not found!")
        return None, None

    flagged_dict = {}
    try:
        with open(FLAGGED_INPUT_FILE, 'r', encoding='utf-8') as f:
            flagged_projects = json.load(f)
        for fp in flagged_projects:
            pid = normalize_pid(fp.get('project_id'))
            if not pid:
                continue
            flagged_dict[pid] = fp
        print(
            f"Loaded {len(flagged_dict):,} flagged projects from {FLAGGED_INPUT_FILE}")
    except FileNotFoundError:
        print(
            f"Warning: {FLAGGED_INPUT_FILE} not found. Proceeding without flags.")

    return projects, flagged_dict


def insert_projects(cursor, projects, flagged_dict):
    """Insert projects and flags into database"""
    print("\nInserting projects into database...")
    inserted = 0
    errors = 0

    for project in projects:
        raw_pid = project.get('project_id')
        project_id = normalize_pid(raw_pid)

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
                INSERT OR REPLACE INTO projects (
                    project_id, project_description, year, region, province,
                    municipality, type_of_work, contractor, contract_cost,
                    contract_id, legislative_district, district_engineering_office,
                    start_date, completion_date, is_flagged, flag_count, max_severity,
                    suspicion_score, color_triage, triage_rating, triage_action
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                triage_action
            ))
            inserted += 1

            if flagged_data and project_id:
                cursor.execute(
                    'DELETE FROM project_flags WHERE project_id = ?', (project_id,))

                flags = flagged_data.get('flags', [])
                for flag in flags:
                    # --- FIX: Translate Weight to Severity Label ---
                    weight = flag.get('weight', 0)
                    severity_label = "LOW"

                    if weight >= 80:
                        severity_label = "CRITICAL"
                    elif weight >= 60:
                        severity_label = "HIGH"
                    elif weight >= 40:
                        severity_label = "MEDIUM"
                    else:
                        severity_label = "LOW"
                    # -----------------------------------------------

                    cursor.execute('''
                        INSERT INTO project_flags (project_id, severity, flag_type, reason, weight)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        project_id,
                        severity_label,  # Insert the translated label
                        flag.get('type'),
                        flag.get('reason'),
                        weight           # Insert the raw weight
                    ))

            if inserted % 1000 == 0:
                print(f"  Inserted {inserted:,} projects...")

        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"Error inserting project: {e}")

    print(f"Successfully inserted {inserted:,} projects ({errors} errors)")


def print_database_stats(cursor):
    """Print database statistics"""
    print("\n" + "=" * 80)
    print("DATABASE STATISTICS")
    print("=" * 80)

    total_projects = cursor.execute(
        'SELECT COUNT(*) FROM projects').fetchone()[0]
    flagged_count = cursor.execute(
        'SELECT COUNT(*) FROM projects WHERE is_flagged = 1').fetchone()[0]

    print(f"Total projects: {total_projects:,}")
    print(f"Flagged projects: {flagged_count:,}")

    print("\nFlagged Projects by Severity:")
    for row in cursor.execute('SELECT max_severity, COUNT(*) FROM projects WHERE is_flagged = 1 GROUP BY max_severity'):
        print(f"  {row[0]}: {row[1]:,}")

    print("\nTop 5 Flag Types:")
    for row in cursor.execute('SELECT flag_type, COUNT(*) FROM project_flags GROUP BY flag_type ORDER BY 2 DESC LIMIT 5'):
        print(f"  {row[0]}: {row[1]:,}")
    print("=" * 80)


def create_database():
    print("=" * 80)
    print("CREATING SQLITE DATABASE")
    print("=" * 80)

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
        print_database_stats(cursor)
        print("\nDATABASE CREATED SUCCESSFULLY!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


def main():
    create_database()


if __name__ == "__main__":
    main()
