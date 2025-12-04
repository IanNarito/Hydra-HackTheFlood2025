import os
import sys
import uuid
import datetime
import sqlite3
import json
from flask import Flask, jsonify, request
from flask_cors import CORS

# ============================================================
# 1. CRITICAL PATH CONFIGURATION (Run this first)
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# FORCE the path to be inside the 'Datas' folder.
DATABASE_FILE = os.path.join(BASE_DIR, 'Datas', 'flood_control.db')

# PRINT THE PATH IMMEDIATELY SO WE KNOW IT IS CORRECT
print("\n" + "="*60)
if os.path.exists(DATABASE_FILE):
    print(f"✅ SUCCESS: Database found at:\n   {DATABASE_FILE}")
else:
    print(f"❌ ERROR: Database NOT found at:\n   {DATABASE_FILE}")
    print("   Please check that 'flood_control.db' exists inside the 'Datas' folder.")
print("="*60 + "\n")

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'secure_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Import Validator Lists
try:
    sys.path.append(os.path.join(BASE_DIR, 'Scripts'))
    from flood_validator import KNOWN_BAD_CONTRACTORS
except ImportError:
    KNOWN_BAD_CONTRACTORS = {}

# ============================================================
# 2. APP SETUP
# ============================================================
app = Flask(__name__)
CORS(app)

# ============================================================
# 3. DATABASE HELPERS
# ============================================================


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_db_connection():
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        conn.row_factory = dict_factory
        return conn
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return None

# ============================================================
# 4. INTELLIGENCE LOGIC
# ============================================================


def check_database_for_matches(user_text):
    """Scans user text against High Risk projects in the main DB."""
    if not user_text or len(user_text) < 5:
        return None

    conn = get_db_connection()
    if not conn:
        return None

    user_text_upper = user_text.upper()

    try:
        # Check existing High Risk projects
        query = '''
            SELECT * FROM projects 
            WHERE suspicion_score > 50 
        '''
        high_risk_projects = conn.execute(query).fetchall()

        for project in high_risk_projects:
            contractor = (project.get('contractor') or '').strip().upper()
            municipality = (project.get('municipality') or '').strip().upper()
            province = (project.get('province') or '').strip().upper()

            # If Contractor Name matches (and isn't short/generic)
            if len(contractor) > 5 and contractor in user_text_upper:
                return project

            # If Location matches
            if municipality and province and f"{municipality}, {province}" in user_text_upper:
                return project

    except Exception as e:
        print(f"Intelligence Error: {e}")
    finally:
        conn.close()
    return None


def analyze_text_flags(text):
    flags = []
    if not text:
        return flags
    text_upper = text.upper()

    for contractor in KNOWN_BAD_CONTRACTORS:
        if contractor in text_upper:
            flags.append(f"BLACKLIST MATCH: {contractor}")

    keywords = ["GHOST", "INCOMPLETE", "BRIBE",
                "SUBSTANDARD", "CRACK", "ABANDONED"]
    for word in keywords:
        if word in text_upper:
            flags.append(word)
    return flags

# ============================================================
# 5. API ROUTES
# ============================================================


@app.route('/api/submit-evidence', methods=['POST'])
def submit_evidence():
    try:
        text_content = request.form.get('description', '')
        files = request.files.getlist('files')

        # --- A. CHECK FOR MATCHING RECORDS ---
        existing_match = check_database_for_matches(text_content)

        if existing_match:
            # If we found a match in the DB, return immediately so React shows the RED SCREEN
            return jsonify({
                "status": "match_found",
                "match_data": existing_match
            }), 200

        # --- B. IF NO MATCH, SAVE TO REPORTS TABLE ---
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB Error"}), 500

        # Create table in the SAME database file as projects
        conn.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                case_id TEXT UNIQUE, 
                description TEXT, 
                files TEXT, 
                status TEXT DEFAULT "PENDING", 
                ai_flags TEXT, 
                timestamp TEXT,
                admin_notes TEXT,
                linked_project_id INTEGER
            )
        ''')

        case_id = str(uuid.uuid4())[:8].upper()
        saved_files = []
        for file in files:
            if file.filename == '':
                continue
            ext = os.path.splitext(file.filename)[1]
            safe_name = f"{case_id}_{uuid.uuid4().hex[:6]}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER, safe_name))
            saved_files.append(safe_name)

        ai_flags = analyze_text_flags(text_content)

        conn.execute('''
            INSERT INTO reports (case_id, description, files, status, ai_flags, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (case_id, text_content, json.dumps(saved_files), 'PENDING', json.dumps(ai_flags), datetime.datetime.now().isoformat()))

        conn.commit()
        conn.close()

        return jsonify({
            "status": "queued_for_admin",
            "case_id": case_id,
            "flags_detected": ai_flags
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- STANDARD ROUTES ---


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200
        cursor = conn.cursor()

        # Included satellite_image_url
        query = '''
            SELECT id, project_id, project_description, contractor, contract_cost,
                region, province, municipality, start_date, completion_date,
                is_flagged, max_severity, suspicion_score, color_triage, 
                latitude, longitude, year, satellite_image_url
            FROM projects
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        '''
        cursor.execute(query)
        rows = cursor.fetchall()

        # Quick convert to dict list
        projects = [dict(row) for row in rows]

        # Ensure scores are floats for frontend
        for p in projects:
            p['score'] = float(p.get('suspicion_score') or 0)
            if p['score'] >= 40:
                p['status'] = 'Flagged'
            else:
                p['status'] = 'Normal'

        conn.close()
        return jsonify(projects), 200
    except Exception as e:
        print(f"Project Load Error: {e}")
        return jsonify([]), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        stats = {'total_projects': 0, 'total_budget': 0, 'flagged_projects': 0}

        res_total = conn.execute(
            'SELECT COUNT(*), SUM(contract_cost) FROM projects').fetchone()
        stats['total_projects'] = res_total['COUNT(*)'] or 0
        stats['total_budget'] = res_total['SUM(contract_cost)'] or 0

        res_flagged = conn.execute(
            'SELECT COUNT(*) FROM projects WHERE suspicion_score >= 40').fetchone()
        stats['flagged_projects'] = res_flagged['COUNT(*)'] or 0

        conn.close()
        return jsonify(stats), 200
    except:
        return jsonify({}), 200


@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    conn = get_db_connection()
    try:
        reports = conn.execute(
            "SELECT * FROM reports WHERE status = 'PENDING' ORDER BY id DESC").fetchall()
        conn.close()
        return jsonify({"reports": reports, "stats": {}}), 200
    except:
        return jsonify({"reports": []}), 200


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if data.get('password') == "hydra_admin_2025":
        return jsonify({"status": "success", "token": "verified"}), 200
    return jsonify({"status": "error"}), 401


if __name__ == '__main__':
    app.run(debug=True, port=5000)
