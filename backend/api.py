import os
import sys
import uuid
import datetime
import sqlite3
import json
import base64
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
# 2. INTELLIGENCE DATA (Hardcoded for Stability)
# ============================================================
KNOWN_BAD_CONTRACTORS = {
    'SYMS CONSTRUCTION TRADING': {'reason': 'Ghost projects', 'severity': 'CRITICAL'},
    'M3 KONSTRUCT CORPORATION': {'reason': 'Irregularities', 'severity': 'CRITICAL'},
    'WAWAO BUILDERS': {'reason': 'Fraud flagged', 'severity': 'CRITICAL'}
}
PROBLEMATIC_LOCATIONS = {
    'BULACAN': 'High fraud risk',
    'QUEZON CITY': 'Audit flags'
}

# Add Scripts to path for imports if needed
SCRIPTS_DIR = os.path.join(BASE_DIR, 'Scripts')
if os.path.exists(SCRIPTS_DIR): sys.path.append(SCRIPTS_DIR)

# Set Upload Folder next to DB
UPLOAD_FOLDER = os.path.join(os.path.dirname(DATABASE_FILE), 'secure_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- DB HELPERS ---
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
    except: return None

# --- AUTH & INTELLIGENCE ---
ADMIN_PASSWORD = "hydra_admin_2025" 

def analyze_text_flags(text):
    flags = []
    if not text: return flags
    text_upper = text.upper()
    
    for contractor in KNOWN_BAD_CONTRACTORS:
        if contractor in text_upper:
            flags.append(f"BLACKLIST MATCH: {contractor}")
            
    keywords = ["GHOST", "INCOMPLETE", "BRIBE", "SUBSTANDARD", "CRACK", "DELAY", "ABANDONED"]
    for word in keywords:
        if word in text_upper: flags.append(word)
    return flags

def scan_database_for_match(text, conn):
    if not text: return None
    text_upper = text.upper()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM projects WHERE is_flagged = 1")
        flagged_projects = cursor.fetchall()
        
        possible_matches = []
        for proj in flagged_projects:
            contractor = (proj.get('contractor') or '').upper()
            location = (proj.get('municipality') or '').upper()
            
            if contractor and len(contractor) > 5 and contractor in text_upper:
                possible_matches.append(proj)
            elif location and len(location) > 5 and location in text_upper:
                possible_matches.append(proj)
                
        possible_matches.sort(key=lambda x: x.get('suspicion_score', 0), reverse=True)
        return possible_matches[0] if possible_matches else None
    except:
        return None

# --- ROUTES ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if data.get('password') == ADMIN_PASSWORD:
        return jsonify({"status": "success", "token": "verified_admin_token"}), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route('/api/submit-evidence', methods=['POST'])
def submit_evidence():
    try:
        text_content = request.form.get('description', '')
        files = request.files.getlist('files')
        conn = get_db_connection()
        if not conn: return jsonify({"error": "DB Error"}), 500

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

        existing_match = scan_database_for_match(text_content, conn)
        if existing_match:
            conn.close()
            return jsonify({
                "status": "match_found",
                "message": "This project is already in our database.",
                "match_data": existing_match
            }), 200

        case_id = str(uuid.uuid4())[:8].upper()
        saved_files = []
        for file in files:
            if file.filename == '': continue
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

# --- ADMIN MANAGEMENT ---

@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    conn = get_db_connection()
    if not conn: return jsonify([]), 200
    try:
        reports = conn.execute("SELECT * FROM reports WHERE status = 'PENDING' ORDER BY id DESC").fetchall()
        
        # Helper for stats
        def get_count(query):
            try: return conn.execute(query).fetchone()['c']
            except: return 0

        total_reports = get_count("SELECT COUNT(*) as c FROM reports")
        published = get_count("SELECT COUNT(*) as c FROM reports WHERE status = 'PUBLISHED'")
        
        conn.close()
        return jsonify({
            "reports": reports,
            "stats": {
                "pending": len(reports),
                "total": total_reports,
                "published": published,
                "blacklist_count": len(KNOWN_BAD_CONTRACTORS)
            }
        }), 200
    except: return jsonify({"reports": [], "stats": {}}), 200

@app.route('/api/admin/publish/<int:report_id>', methods=['POST'])
def publish_report(report_id):
    conn = get_db_connection()
    
    # Create published_reports table if needed
    conn.execute('''
        CREATE TABLE IF NOT EXISTS published_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER,
            published_at TEXT,
            public_summary TEXT,
            FOREIGN KEY(report_id) REFERENCES reports(id)
        )
    ''')
    
    conn.execute("UPDATE reports SET status = 'PUBLISHED' WHERE id = ?", (report_id,))
    
    # Add entry to public table
    conn.execute('''
        INSERT INTO published_reports (report_id, published_at, public_summary)
        VALUES (?, ?, ?)
    ''', (report_id, datetime.datetime.now().isoformat(), "Verified by HYDRA Investigation Unit."))
    
    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 200

@app.route('/api/admin/delete/<int:report_id>', methods=['POST'])
def delete_report(report_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 200

# --- PUBLIC ROUTES ---

@app.route('/api/public-reports', methods=['GET'])
def get_public_reports():
    conn = get_db_connection()
    if not conn: return jsonify([]), 200
    try:
        query = '''
            SELECT 
                pr.id as pub_id, 
                pr.published_at, 
                pr.public_summary, 
                r.case_id, 
                r.description, 
                r.ai_flags, 
                r.timestamp
            FROM published_reports pr
            JOIN reports r ON pr.report_id = r.id
            ORDER BY pr.id DESC
        '''
        reports = conn.execute(query).fetchall()
        conn.close()
        return jsonify(reports), 200
    except Exception as e:
        print(f"Public Reports Error: {e}")
        return jsonify([]), 200

# Helper function
def calculate_risk_level(suspicion_score, max_severity):
    sev = (max_severity or '').upper()
    score = float(suspicion_score) if suspicion_score else 0
    if sev == 'CRITICAL' or score >= 80:
        return ('Critical', 'Red', 'IMMEDIATE INVESTIGATION. Strong evidence of anomaly.')
    if sev == 'HIGH' or score >= 40:
        return ('High', 'Yellow', 'PRIORITY INVESTIGATION. Serious red flags detected.')
    return ('Low', 'Green', 'CONTINUOUS MONITORING. No major anomalies detected.')

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

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        if not conn: return jsonify({'error': 'DB Error'}), 500
        cursor = conn.cursor()
        
        stats = {'total_projects': 0, 'total_budget': 0, 'flagged_projects': 0, 'flagged_percentage': 0}
        
        try:
            cursor.execute('SELECT COUNT(*) as count, SUM(contract_cost) as total_money FROM projects')
            total_row = cursor.fetchone()
            if total_row:
                stats['total_projects'] = total_row['count'] or 0
                stats['total_budget'] = total_row['total_money'] or 0

            cursor.execute(f'''
                SELECT COUNT(*) as count 
                FROM projects 
                WHERE suspicion_score >= 40 OR max_severity IN ('HIGH', 'CRITICAL')
            ''')
            flagged_row = cursor.fetchone()
            if flagged_row:
                stats['flagged_projects'] = flagged_row['count'] or 0

            if stats['total_projects'] > 0:
                stats['flagged_percentage'] = round((stats['flagged_projects'] / stats['total_projects']) * 100, 1)
        except sqlite3.OperationalError:
            pass

        conn.close()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)