import os
import sys
import uuid
import datetime
import sqlite3
import json
import base64
# --- 1. NEW IMPORT FOR AI ---
import google.generativeai as genai
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ============================================================
# 1. CONFIGURATION & DATABASE PATH
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_DB_PATHS = [
    os.path.join(BASE_DIR, 'Datas', 'flood_control.db'),
    os.path.join(BASE_DIR, '..', 'Datas', 'flood_control.db'),
    os.path.join(BASE_DIR, 'flood_control.db'),
]
# Find the first existing path, default to the Datas folder if none found
DATABASE_FILE = next((p for p in POSSIBLE_DB_PATHS if os.path.exists(p)),
                     os.path.join(BASE_DIR, 'Datas', 'flood_control.db'))

print(f"⚡ Database Path: {DATABASE_FILE}")

# ============================================================
# 2. AI CONFIGURATION (NEW SECTION)
# ============================================================
# ⚠️ PASTE YOUR KEY HERE ⚠️
GENAI_API_KEY = "Blanko"

try:
    genai.configure(api_key=GENAI_API_KEY)
    print("🤖 AI Neural Core: ONLINE")
except Exception as e:
    print(f"⚠️ AI Config Error: {e}")

# ============================================================
# 3. INTELLIGENCE DATA (Hardcoded for Stability)
# ============================================================
KNOWN_BAD_CONTRACTORS = {
    'SYMS CONSTRUCTION TRADING': {'reason': 'Ghost projects', 'severity': 'CRITICAL'},
    'M3 KONSTRUCT CORPORATION': {'reason': 'Irregularities', 'severity': 'CRITICAL'},
    'WAWAO BUILDERS': {'reason': 'Fraud findings', 'severity': 'CRITICAL'},
    'ST. TIMOTHY CONSTRUCTION': {'reason': 'Serious discrepancies', 'severity': 'CRITICAL'},
    'AMETHYST HORIZON BUILDERS': {'reason': 'Substandard works', 'severity': 'CRITICAL'},
    'L.R. TIQUI BUILDERS': {'reason': 'Flagged Joint Ventures', 'severity': 'CRITICAL'},
    'SBD BUILDERS INC': {'reason': 'Expired licenses', 'severity': 'HIGH'},
    'ADL GENERAL CONSTRUCTION': {'reason': 'Blacklisted firm', 'severity': 'HIGH'},
    'TAWID BUILDERS CORP': {'reason': 'Re-awarded contracts after blacklist', 'severity': 'MEDIUM'},
    'R.U. AQUINO CONSTRUCTION': {'reason': 'Conflict of interest', 'severity': 'MEDIUM'},
    'LE BRON CONSTRUCTION': {'reason': 'Conflict of interest', 'severity': 'MEDIUM'}
}

# ============================================================
# 4. DATABASE HELPERS & INITIALIZATION
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
        print(f"❌ DB Connection Error: {e}")
        return None


def init_tables():
    """Initialize tables for storing files in database + reports"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        # 1. Reports table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                case_id TEXT UNIQUE, 
                description TEXT, 
                status TEXT DEFAULT "PENDING", 
                ai_flags TEXT, 
                timestamp TEXT,
                admin_notes TEXT,
                linked_project_id INTEGER
            )
        ''')

        # 2. Files table (BLOB storage)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS report_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                case_id TEXT NOT NULL,
                original_filename TEXT,
                file_data BLOB,
                file_type TEXT,
                file_size INTEGER,
                uploaded_at TEXT,
                FOREIGN KEY (report_id) REFERENCES reports(id)
            )
        ''')

        # 3. Published Reports table (For the Public Page)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS published_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL UNIQUE,
                published_at TEXT,
                public_summary TEXT,
                admin_notes TEXT,
                FOREIGN KEY (report_id) REFERENCES reports(id)
            )
        ''')

        conn.commit()
        print("✅ Database tables initialized successfully.")
    except Exception as e:
        print(f"❌ Table Init Error: {e}")
    finally:
        conn.close()


# Run init immediately
init_tables()

# ============================================================
# 5. INTELLIGENCE LOGIC
# ============================================================


def calculate_risk_level(suspicion_score, max_severity):
    """Strict logic to ensure map colors appear correctly."""
    sev = (max_severity or '').upper()
    score = float(suspicion_score) if suspicion_score else 0

    if sev == 'CRITICAL' or score >= 80:
        return ('Critical', 'Red', 'IMMEDIATE INVESTIGATION. Strong evidence of anomaly.')
    if sev == 'HIGH' or score >= 40:
        return ('High', 'Yellow', 'PRIORITY INVESTIGATION. Serious red flags detected.')
    return ('Low', 'Green', 'CONTINUOUS MONITORING. No major anomalies detected.')


def check_database_for_matches(user_text):
    """Scans text to find if it matches a High Risk project, to update its score."""
    if not user_text or len(user_text) < 5:
        return None
    conn = get_db_connection()
    if not conn:
        return None

    user_text_upper = user_text.upper()
    try:
        # Look for projects that already have some suspicion or high cost
        query = 'SELECT * FROM projects WHERE suspicion_score > 10 OR contract_cost > 10000000'
        projects = conn.execute(query).fetchall()

        for project in projects:
            contractor = (project.get('contractor') or '').strip().upper()
            mun = (project.get('municipality') or '').strip().upper()
            prov = (project.get('province') or '').strip().upper()

            # Match Contractor
            if len(contractor) > 5 and contractor in user_text_upper:
                return project
            # Match Location
            if mun and prov and f"{mun}, {prov}" in user_text_upper:
                return project
    except:
        pass
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
                "SUBSTANDARD", "CRACK", "DELAY", "ABANDONED"]
    for word in keywords:
        if word in text_upper:
            flags.append(word)
    return flags


def get_mime_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.docx': 'application/msword',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo'
    }
    return mime_types.get(ext, 'application/octet-stream')

# ============================================================
# 6. API ROUTES
# ============================================================

# --- NEW: AI CHAT ROUTE ---


@app.route('/api/chat', methods=['POST'])
def chat_with_hydra():
    conn = None
    try:
        user_message = request.json.get('message', '') if request.json else ''

        if not user_message:
            return jsonify({"reply": "Please provide a message."}), 400

        # 1. GET DATABASE DATA
        conn = get_db_connection()
        if not conn:
            return jsonify({"reply": "⚠️ Database offline."}), 500

        stats = conn.execute(
            "SELECT COUNT(*) as c, COALESCE(SUM(contract_cost), 0) as s FROM projects"
        ).fetchone()

        worst_projects = conn.execute("""
            SELECT project_description, contractor, suspicion_score, municipality 
            FROM projects WHERE suspicion_score > 0 ORDER BY suspicion_score DESC LIMIT 3
        """).fetchall()

        conn.close()
        conn = None

        # 2. CREATE AI PROMPT
        system_instruction = f"""You are HYDRA, an AI Investigator for the Philippines Dept of Public Works.

SYSTEM STATUS:
- Projects Monitored: {stats['c']}
- Total Budget: ₱{stats['s']:,.2f}

HIGH RISK PROJECTS:
{json.dumps([dict(r) for r in worst_projects], indent=2)}

BLACKLISTED CONTRACTORS:
{', '.join(KNOWN_BAD_CONTRACTORS.keys())}

USER QUERY: {user_message}

INSTRUCTIONS: Answer as a professional investigator. Keep responses concise (max 3-4 sentences). Reference data when relevant."""

        # 3. TRY MULTIPLE MODEL NAMES (IN ORDER OF PREFERENCE)
        model_names_to_try = [
            'models/gemini-2.5-flash',       # Latest stable (Dec 2024)
            'models/gemini-2.0-flash-exp',   # Experimental backup
            'models/gemini-2.5-pro',         # More powerful alternative
        ]

        last_error = None

        for model_name in model_names_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(system_instruction)

                if response and hasattr(response, 'text'):
                    return jsonify({"reply": response.text}), 200

            except Exception as model_error:
                last_error = str(model_error)
                continue

        # If all models failed
        return jsonify({
            "reply": f"⚠️ All AI models unavailable. Last error: {last_error}"
        }), 500

    except Exception as e:
        return jsonify({"reply": f"⚠️ System Error: {str(e)}"}), 500

    finally:
        if conn:
            conn.close()


@app.route('/api/submit-evidence', methods=['POST'])
def submit_evidence():
    try:
        text_content = request.form.get('description', '')
        files = request.files.getlist('files')

        # 1. Check for intelligence matches
        matched_project = check_database_for_matches(text_content)
        linked_project_id = None

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB Error"}), 500

        # 2. If match found, UPDATE the project stats
        if matched_project:
            linked_project_id = matched_project['id']
            conn.execute('''
                UPDATE projects 
                SET is_flagged = 1, 
                    color_triage = 'RED', 
                    suspicion_score = CASE 
                        WHEN suspicion_score < 90 THEN suspicion_score + 10 
                        ELSE 100 
                    END,
                    flag_count = flag_count + 1
                WHERE id = ?
            ''', (linked_project_id,))

        # 3. Create Report Record
        case_id = str(uuid.uuid4())[:8].upper()
        ai_flags = analyze_text_flags(text_content)
        timestamp = datetime.datetime.now().isoformat()

        cursor = conn.execute('''
            INSERT INTO reports (case_id, description, status, ai_flags, timestamp, linked_project_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (case_id, text_content, 'PENDING', json.dumps(ai_flags), timestamp, linked_project_id))

        report_id = cursor.lastrowid

        # 4. Save Files to Database (BLOB)
        for file in files:
            if file.filename == '':
                continue
            file_data = file.read()
            file_type = get_mime_type(file.filename)
            conn.execute('''
                INSERT INTO report_files (report_id, case_id, original_filename, file_data, file_type, file_size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (report_id, case_id, file.filename, file_data, file_type, len(file_data), timestamp))

        conn.commit()
        conn.close()

        return jsonify({
            "status": "queued_for_admin",
            "case_id": case_id,
            "flags_detected": ai_flags,
            "match_found": True if matched_project else False
        }), 200

    except Exception as e:
        print(f"Submit Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# --- FILE ROUTES ---


@app.route('/api/files/base64/<int:file_id>', methods=['GET'])
def get_file_base64(file_id):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        result = cursor.execute(
            'SELECT original_filename, file_data, file_type FROM report_files WHERE id = ?', (file_id,)).fetchone()
        conn.close()
        if not result:
            return jsonify({"error": "Not found"}), 404
        filename, data, ftype = result
        b64 = base64.b64encode(data).decode('utf-8')
        return jsonify({"filename": filename, "type": ftype, "data": f"data:{ftype};base64,{b64}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/files/<case_id>', methods=['GET'])
def get_case_files(case_id):
    try:
        conn = get_db_connection()
        files = conn.execute(
            'SELECT id, original_filename, file_type, file_size FROM report_files WHERE case_id = ?', (case_id,)).fetchall()
        conn.close()
        return jsonify(files), 200
    except:
        return jsonify([]), 200

# --- PROJECT DATA ROUTE ---


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200
        cursor = conn.cursor()
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
        projects = []
        for row in rows:
            raw_score = row.get('suspicion_score', 0)
            score = float(raw_score) if raw_score is not None else 0.0
            risk_level, color_name, risk_desc = calculate_risk_level(
                score, row.get('max_severity'))
            projects.append({
                'id': row['id'],
                'name': row.get('project_description') or f"Project {row.get('project_id')}",
                'contractor': row.get('contractor') or 'Unknown Contractor',
                'risk': risk_level,
                'color': color_name,
                'score': score,
                'latitude': row['latitude'],
                'longitude': row['longitude'],
                'budget': row.get('contract_cost') or 0,
                'start_date': row.get('start_date') or 'N/A',
                'end_date': row.get('completion_date') or 'N/A',
                'status': 'Flagged' if score >= 40 else 'Normal',
                'risk_description': risk_desc,
                'region': row.get('region'),
                'province': row.get('province'),
                'municipality': row.get('municipality'),
                'year': row.get('year'),
                'satellite_image_url': row.get('satellite_image_url')
            })
        conn.close()
        return jsonify(projects), 200
    except Exception as e:
        return jsonify([]), 200

# --- ADMIN ROUTES ---


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    if request.json.get('password') == "hydra_admin_2025":
        return jsonify({"status": "success", "token": "verified_admin_token"}), 200
    return jsonify({"status": "error"}), 401


@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    conn = get_db_connection()
    if not conn:
        return jsonify({"reports": [], "stats": {}}), 200
    try:
        pending_reports = conn.execute('''
            SELECT r.id, r.case_id, r.description, r.status, r.ai_flags, r.timestamp,
                   (SELECT COUNT(*) FROM report_files rf WHERE rf.case_id = r.case_id) as file_count
            FROM reports r 
            WHERE r.status = 'PENDING' 
            ORDER BY r.id DESC
        ''').fetchall()

        stats_result = conn.execute('''
            SELECT 
                (SELECT COUNT(*) FROM reports WHERE status = 'PENDING') as pending,
                (SELECT COUNT(*) FROM published_reports) as published,
                (SELECT COUNT(*) FROM reports) as total
        ''').fetchone()

        stats = {
            "pending": stats_result['pending'] or 0,
            "published": stats_result['published'] or 0,
            "total": stats_result['total'] or 0,
            "blacklist_count": len(KNOWN_BAD_CONTRACTORS)
        }
        conn.close()
        return jsonify({"reports": pending_reports, "stats": stats}), 200
    except:
        return jsonify({"reports": [], "stats": {}}), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'total_projects': 0,
                'total_budget': 0,
                'flagged_projects': 0,
                'flagged_percentage': 0
            }), 200

        # Get total projects and budget
        res = conn.execute(
            'SELECT COUNT(*) as c, COALESCE(SUM(contract_cost), 0) as s FROM projects'
        ).fetchone()

        total_projects = res['c'] or 0
        total_budget = res['s'] or 0

        # Get flagged projects count
        res_f = conn.execute(
            'SELECT COUNT(*) as c FROM projects WHERE suspicion_score >= 40'
        ).fetchone()

        flagged_projects = res_f['c'] or 0

        # Calculate percentage (avoid division by zero)
        if total_projects > 0:
            flagged_percentage = round(
                (flagged_projects / total_projects) * 100, 1)
        else:
            flagged_percentage = 0

        conn.close()

        stats = {
            'total_projects': total_projects,
            'total_budget': total_budget,
            'flagged_projects': flagged_projects,
            'flagged_percentage': flagged_percentage
        }

        return jsonify(stats), 200

    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({
            'total_projects': 0,
            'total_budget': 0,
            'flagged_projects': 0,
            'flagged_percentage': 0
        }), 200


@app.route('/api/admin/publish/<int:report_id>', methods=['POST'])
def publish_report(report_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB Error"}), 500

        # 1. Update Main Report Status
        conn.execute(
            "UPDATE reports SET status = 'PUBLISHED' WHERE id = ?", (report_id,))

        # 2. Add to Published Reports Table
        row = conn.execute(
            "SELECT description FROM reports WHERE id = ?", (report_id,)).fetchone()
        summary = row['description'] if row else "No description"
        timestamp = datetime.datetime.now().isoformat()

        conn.execute('''
            INSERT OR IGNORE INTO published_reports (report_id, published_at, public_summary)
            VALUES (?, ?, ?)
        ''', (report_id, timestamp, summary))

        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Publish Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/public-reports', methods=['GET'])
def get_public_reports():
    conn = get_db_connection()
    if not conn:
        return jsonify([]), 200
    try:
        # UPGRADED QUERY: Fetches filenames AND file types
        query = '''
            SELECT 
                pr.id as pub_id, 
                pr.published_at, 
                pr.public_summary, 
                r.case_id, 
                r.description, 
                r.ai_flags, 
                r.timestamp,
                p.contractor as contractor_name,
                (SELECT COUNT(*) FROM report_files rf WHERE rf.case_id = r.case_id) as file_count,
                (SELECT GROUP_CONCAT(file_type) FROM report_files rf WHERE rf.case_id = r.case_id) as raw_file_types,
                (SELECT GROUP_CONCAT(original_filename) FROM report_files rf WHERE rf.case_id = r.case_id) as raw_filenames
            FROM published_reports pr
            JOIN reports r ON pr.report_id = r.id
            LEFT JOIN projects p ON r.linked_project_id = p.id
            ORDER BY pr.id DESC
        '''
        reports = conn.execute(query).fetchall()
        conn.close()
        return jsonify(reports), 200
    except Exception as e:
        print(f"Public Reports Error: {e}")
        return jsonify([]), 200


@app.route('/api/admin/delete/<int:report_id>', methods=['POST', 'DELETE'])
def delete_report(report_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
