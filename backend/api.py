import os
import sys
import uuid
import datetime
import sqlite3
import json
import base64
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# ============================================================
# IMPORT THE NEW AI SERVICE (The Senior Analyst)
# ============================================================
import ai_service

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSSIBLE_DB_PATHS = [
    os.path.join(BASE_DIR, 'Datas', 'flood_control.db'),
    os.path.join(BASE_DIR, '..', 'Datas', 'flood_control.db'),
    os.path.join(BASE_DIR, 'flood_control.db'),
]
DATABASE_FILE = next((p for p in POSSIBLE_DB_PATHS if os.path.exists(p)),
                     os.path.join(BASE_DIR, 'Datas', 'flood_control.db'))

print(f"⚡ Database Path: {DATABASE_FILE}")

# ============================================================
# INTELLIGENCE DATA
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
# DATABASE HELPERS
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
    conn = get_db_connection()
    if not conn:
        return

    try:
        conn.execute('''CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT UNIQUE, description TEXT, status TEXT DEFAULT "PENDING", ai_flags TEXT, timestamp TEXT, admin_notes TEXT, linked_project_id INTEGER)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS report_files (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, case_id TEXT NOT NULL, original_filename TEXT, file_data BLOB, file_type TEXT, file_size INTEGER, uploaded_at TEXT, FOREIGN KEY (report_id) REFERENCES reports(id))''')
        conn.execute('''CREATE TABLE IF NOT EXISTS published_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL UNIQUE, published_at TEXT, public_summary TEXT, admin_notes TEXT, FOREIGN KEY (report_id) REFERENCES reports(id))''')
        conn.execute('''CREATE TABLE IF NOT EXISTS ai_audit_results (project_id TEXT PRIMARY KEY, ai_verdict TEXT, ai_comment TEXT, ai_score INTEGER, analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

        try:
            conn.execute(
                "ALTER TABLE ai_audit_results ADD COLUMN ai_score INTEGER")
        except:
            pass

        conn.commit()
        print("✅ Database tables initialized successfully.")
    except Exception as e:
        print(f"❌ Table Init Error: {e}")
    finally:
        conn.close()


init_tables()

# ============================================================
# LOGIC & HELPERS
# ============================================================


def calculate_risk_level(suspicion_score, max_severity):
    sev = (max_severity or '').upper()
    score = float(suspicion_score) if suspicion_score else 0

    if sev == 'CRITICAL' or score >= 80:
        return ('Critical', 'Red', f'Score {int(score)}: IMMEDIATE INVESTIGATION. Strong evidence of anomaly.')
    if sev == 'HIGH' or score >= 60:
        return ('High', 'Yellow', f'Score {int(score)}: PRIORITY INVESTIGATION. Serious red flags detected.')
    return ('Low', 'Green', f'Score {int(score)}: Nominal. Continuous monitoring.')


def check_database_for_matches(user_text):
    if not user_text or len(user_text) < 5:
        return None
    conn = get_db_connection()
    if not conn:
        return None
    user_text_upper = user_text.upper()
    try:
        query = 'SELECT * FROM projects WHERE suspicion_score > 10 OR contract_cost > 10000000'
        projects = conn.execute(query).fetchall()
        for project in projects:
            contractor = (project.get('contractor') or '').strip().upper()
            mun = (project.get('municipality') or '').strip().upper()
            prov = (project.get('province') or '').strip().upper()
            if len(contractor) > 5 and contractor in user_text_upper:
                return project
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
    return {'.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.mp4': 'video/mp4'}.get(ext, 'application/octet-stream')

# ============================================================
# API ROUTES
# ============================================================

# --- 1. AI AUDITOR (UPDATED: Uses Senior Analyst Logic) ---


@app.route('/api/ai-audit-batch', methods=['POST'])
def ai_audit_batch():
    """
    Triggered when user clicks 'Analyze'.
    Uses Tier 2 AI (ai_service) to compare projects against the Benchmark Cheat Sheet.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        user_ids = request.json.get('project_ids', [])

        # Fetch projects (Get everything needed for deep analysis)
        if user_ids:
            placeholders = ','.join('?' * len(user_ids))
            query = f"SELECT * FROM projects WHERE project_id IN ({placeholders})"
            cursor.execute(query, user_ids)
        else:
            # Analyze unanalyzed ones if no ID provided
            cursor.execute(
                "SELECT * FROM projects WHERE project_id NOT IN (SELECT project_id FROM ai_audit_results) LIMIT 5")

        rows = cursor.fetchall()
        if not rows:
            return jsonify({"status": "empty", "message": "No pending projects to analyze."}), 200

        results = []

        # --- THE INNOVATION: Deep Scan Loop ---
        # We iterate through each project and ask the AI to compare it
        # specifically against the Stats (Cheat Sheet) for its location.
        for row in rows:
            project_data = dict(row)

            # CALL THE NEW AI SERVICE
            # This function reads 'system_benchmarks.json' internally
            analysis_list = ai_service.analyze_project_with_facts(project_data)

            if analysis_list:
                res = analysis_list[0]  # Get the specific result
                results.append(res)

                # Save the "Senior Analyst's" verdict
                cursor.execute("""
                    INSERT OR REPLACE INTO ai_audit_results (project_id, ai_verdict, ai_comment, ai_score)
                    VALUES (?, ?, ?, ?)
                """, (res.get('project_id'), res.get('ai_verdict'), res.get('ai_analysis'), res.get('ai_score')))

        conn.commit()
        return jsonify({"status": "success", "analyzed_count": len(results), "results": results}), 200

    except Exception as e:
        print(f"AI Audit Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


# --- SEARCH & GET PROJECTS ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200

        query = '''
            SELECT p.id, p.project_id, p.project_description, p.contractor, p.contract_cost,
                p.region, p.province, p.municipality, p.start_date, p.completion_date,
                p.is_flagged, p.max_severity, p.suspicion_score, p.color_triage, 
                p.latitude, p.longitude, p.year, p.satellite_image_url,
                a.ai_verdict, a.ai_comment, a.ai_score
            FROM projects p
            LEFT JOIN ai_audit_results a ON p.project_id = a.project_id
            WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        '''
        rows = conn.cursor().execute(query).fetchall()
        projects = []

        for row in rows:
            math_score = float(row.get('suspicion_score') or 0)
            ai_score_val = row.get('ai_score')
            ai_score = float(ai_score_val) if ai_score_val is not None else 0

            # Combined Score Logic
            final_score = max(
                math_score, ai_score) if ai_score_val is not None else math_score

            if final_score >= 80:
                risk, color, desc = 'CRITICAL', 'Red', f"Score {int(final_score)}: Immediate Investigation"
            elif final_score >= 60:
                risk, color, desc = 'HIGH', 'Yellow', f"Score {int(final_score)}: Elevated Risk"
            else:
                risk, color, desc = 'LOW', 'Green', f"Score {int(final_score)}: Nominal"

            if row.get('ai_verdict'):
                desc = f"AI Analysis: {row.get('ai_comment')}"

            projects.append({
                'id': row['id'], 'name': row.get('project_description'), 'contractor': row.get('contractor'),
                'risk': risk, 'color': color, 'score': final_score, 'risk_description': desc,
                'ai_audited': bool(row.get('ai_verdict')), 'ai_verdict': row.get('ai_verdict'),
                'latitude': row['latitude'], 'longitude': row['longitude'], 'budget': row.get('contract_cost'),
                'contract_cost': row.get('contract_cost'),
                'start_date': row.get('start_date'), 'end_date': row.get('completion_date'),
                'completion_date': row.get('completion_date'),
                'region': row.get('region'), 'province': row.get('province'), 'municipality': row.get('municipality'),
                'year': row.get('year'), 'satellite_image_url': row.get('satellite_image_url'),
                'status': 'Active'
            })
        conn.close()
        return jsonify(projects), 200
    except:
        return jsonify([]), 200


@app.route('/api/search', methods=['GET'])
def search_projects():
    try:
        query = request.args.get('q', '').strip()
        filter_type = request.args.get('type', 'ALL').upper()
        risk_filter = request.args.get('risk', 'ALL').upper()  # <--- NEW
        offset = int(request.args.get('offset', 0))
        limit = 50

        conn = get_db_connection()
        cursor = conn.cursor()

        sql = '''
            SELECT 
                p.id, p.project_id, p.project_description, p.contractor, 
                p.municipality, p.province, p.region, p.suspicion_score, p.max_severity,
                p.contract_cost, p.start_date, p.completion_date, p.latitude, p.longitude,
                p.year, p.satellite_image_url,
                a.ai_verdict, a.ai_score, a.ai_comment
            FROM projects p
            LEFT JOIN ai_audit_results a ON p.project_id = a.project_id
        '''
        params = []
        conditions = []

        # Text Search Filter
        if query:
            search_term = f"%{query}%"
            if filter_type == 'PROJECT':
                conditions.append("p.project_description LIKE ?")
                params.append(search_term)
            elif filter_type == 'CONTRACTOR':
                conditions.append("p.contractor LIKE ?")
                params.append(search_term)
            else:
                conditions.append(
                    "(p.project_description LIKE ? OR p.contractor LIKE ? OR p.municipality LIKE ?)")
                params.extend([search_term, search_term, search_term])

        # Risk Level Filter (NEW)
        if risk_filter != 'ALL':
            if risk_filter == 'CRITICAL':
                conditions.append(
                    "(COALESCE(CAST(a.ai_score AS REAL), CAST(p.suspicion_score AS REAL)) >= 80)")
            elif risk_filter == 'HIGH':
                conditions.append(
                    "(COALESCE(CAST(a.ai_score AS REAL), CAST(p.suspicion_score AS REAL)) >= 60 AND COALESCE(CAST(a.ai_score AS REAL), CAST(p.suspicion_score AS REAL)) < 80)")
            elif risk_filter == 'LOW':
                conditions.append(
                    "(COALESCE(CAST(a.ai_score AS REAL), CAST(p.suspicion_score AS REAL)) < 60)")

        # Apply WHERE clause if conditions exist
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY p.id DESC LIMIT ? OFFSET ?"
        params.append(limit)
        params.append(offset)

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        results = []
        for row in rows:
            math = float(row['suspicion_score'] or 0)
            ai = float(row['ai_score']) if row['ai_score'] is not None else 0
            final = max(math, ai) if row['ai_score'] is not None else math

            risk = 'LOW'
            if final >= 80:
                risk = 'CRITICAL'
            elif final >= 60:
                risk = 'HIGH'

            if row['ai_verdict']:
                risk = f"AI {row['ai_verdict']}"

            results.append({
                'id': row['id'], 'project_id': row['project_id'],
                'name': row['project_description'], 'contractor': row['contractor'],
                'municipality': row['municipality'], 'province': row['province'],
                'region': row['region'], 'risk': risk, 'score': final,
                'budget': row['contract_cost'], 'contract_cost': row['contract_cost'],
                'start_date': row['start_date'], 'completion_date': row['completion_date'],
                'end_date': row['completion_date'], 'status': 'Active',
                'latitude': row['latitude'], 'longitude': row['longitude'],
                'year': row['year'], 'satellite_image_url': row['satellite_image_url'],
                'risk_description': row['ai_comment'] if row['ai_comment'] else f"Score {int(final)}: Risk assessment based on data analysis"
            })

        conn.close()
        return jsonify(results), 200

    except Exception as e:
        print(f"Search Error: {e}")
        return jsonify([]), 200


@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_by_id(project_id):
    try:
        conn = get_db_connection()
        row = conn.execute(
            'SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Not found"}), 404

        score = float(row.get('suspicion_score') or 0)
        risk, color, desc = calculate_risk_level(
            score, row.get('max_severity'))

        lat = row.get('latitude')
        lng = row.get('longitude')

        return jsonify({
            'id': row['id'], 'project_id': row.get('project_id'), 'name': row.get('project_description'),
            'project_description': row.get('project_description'),
            'contractor': row.get('contractor'), 'risk': risk, 'color': color, 'score': score,
            'contract_cost': row.get('contract_cost'), 'budget': row.get('contract_cost'),
            'start_date': row.get('start_date'), 'end_date': row.get('completion_date'),
            'completion_date': row.get('completion_date'),
            'status': 'Flagged' if score >= 60 else 'Normal', 'risk_description': desc,
            'region': row.get('region'), 'province': row.get('province'), 'municipality': row.get('municipality'),
            'latitude': lat, 'longitude': lng,
            'year': row.get('year'), 'satellite_image_url': row.get('satellite_image_url')
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat_with_hydra():
    try:
        user_message = request.json.get('message', '') if request.json else ''
        if not user_message:
            return jsonify({"reply": "Please provide a message."}), 400

        conn = get_db_connection()

        # 1. Get General Stats
        stats = conn.execute(
            "SELECT COUNT(*) as c, COALESCE(SUM(contract_cost), 0) as s FROM projects").fetchone()

        # 2. Get Top 3 Worst Projects (For specific examples)
        worst_projects = conn.execute(
            "SELECT project_description, contractor, suspicion_score FROM projects WHERE suspicion_score > 0 ORDER BY suspicion_score DESC LIMIT 3").fetchall()

        # 3. THE FIX: Get the LIST of ALL Flagged Contractors (Limit 20 to save space)
        # We query just the NAMES of everyone with a score >= 80 (Critical)
        bad_contractors_query = conn.execute(
            "SELECT DISTINCT contractor FROM projects WHERE suspicion_score >= 80 LIMIT 20").fetchall()

        # Convert list of dicts to a simple comma-separated string
        bad_contractors_list = ", ".join(
            [r['contractor'] for r in bad_contractors_query])

        conn.close()

        # 4. Feed EVERYTHING to the AI Context
        sys_msg = f"""
        HYDRA DATA FEED:
        - Total Projects: {stats['c']}
        - Total Budget: ₱{stats['s']:,.2f}
        
        - TOP 3 WORST CASES (DETAILS): {json.dumps([dict(r) for r in worst_projects])}
        
        - LIST OF ALL FLAGGED CONTRACTORS (CRITICAL RISK): 
        [{bad_contractors_list}]
        """

        # Use AI Service for Chat
        reply = ai_service.get_chat_response(sys_msg, user_message)
        return jsonify({"reply": reply}), 200

    except Exception as e:
        return jsonify({"reply": str(e)}), 500


# In api.py

@app.route('/api/submit-evidence', methods=['POST'])
def submit_evidence():
    conn = get_db_connection()
    try:
        # ... (Previous code for getting text, files, checking matches, saving report...)
        text = request.form.get('description', '')
        files = request.files.getlist('files')

        match = check_database_for_matches(text)
        lid = match['id'] if match else None
        if match:
            conn.execute(
                "UPDATE projects SET is_flagged=1, color_triage='RED', suspicion_score=100, flag_count=flag_count+1 WHERE id=?", (lid,))

        cid = str(uuid.uuid4())[:8].upper()
        ts = datetime.datetime.now().isoformat()

        # Insert PENDING Report
        cur = conn.execute('INSERT INTO reports (case_id, description, status, timestamp, linked_project_id) VALUES (?, ?, ?, ?, ?)',
                           (cid, text, 'PENDING', ts, lid))
        rid = cur.lastrowid

        filenames = []
        for f in files:
            if f.filename == '':
                continue
            d = f.read()
            filenames.append(f.filename)
            conn.execute('INSERT INTO report_files (report_id, case_id, original_filename, file_data, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                         (rid, cid, f.filename, d, get_mime_type(f.filename), len(d), ts))

        conn.commit()

        # --- AI ANALYSIS & AUTO-PUBLISH ---
        ai_eval = None
        try:
            ai_eval = ai_service.analyze_evidence(text, filenames)

            new_status = "PENDING"
            if ai_eval.get('verdict') == 'PUBLISH':
                new_status = "PUBLISHED"

                # --- THE FIX: INSERT INTO published_reports TABLE ---
                conn.execute("""
                    INSERT OR IGNORE INTO published_reports (report_id, published_at, public_summary, admin_notes)
                    VALUES (?, ?, ?, ?)
                """, (rid, ts, text, "Auto-published by AI Moderator"))
                # ----------------------------------------------------

            elif ai_eval.get('verdict') == 'DELETE':
                new_status = "SPAM"

            conn.execute("UPDATE reports SET ai_flags = ?, status = ? WHERE id = ?",
                         (json.dumps(ai_eval), new_status, rid))
            conn.commit()

        except Exception as ai_error:
            print(f"⚠️ AI Analysis Failed: {ai_error}")
            ai_eval = {"credibility_score": 50,
                       "verdict": "REVIEW", "reason": "AI Timeout"}

        conn.close()

        return jsonify({
            "status": "queued",
            "case_id": cid,
            "ai_evaluation": ai_eval
        }), 200

    except Exception as e:
        if conn:
            conn.close()
        print(f"❌ Upload Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/files/base64/<int:file_id>', methods=['GET'])
def get_file_base64(file_id):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        r = conn.cursor().execute(
            'SELECT original_filename, file_data, file_type FROM report_files WHERE id = ?', (file_id,)).fetchone()
        conn.close()
        if not r:
            return jsonify({"error": "Not found"}), 404
        b64 = base64.b64encode(r[1]).decode('utf-8')
        return jsonify({"filename": r[0], "type": r[2], "data": f"data:{r[2]};base64,{b64}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    if request.json.get('password') == "hydra_admin_2025":
        return jsonify({"status": "success", "token": "verified"}), 200
    return jsonify({"status": "error"}), 401


@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    conn = get_db_connection()
    reps = conn.execute(
        "SELECT r.*, (SELECT COUNT(*) FROM report_files rf WHERE rf.case_id = r.case_id) as file_count FROM reports r WHERE r.status = 'PENDING' ORDER BY r.id DESC").fetchall()
    stats = conn.execute(
        "SELECT (SELECT COUNT(*) FROM reports WHERE status='PENDING') as pending, (SELECT COUNT(*) FROM published_reports) as published, (SELECT COUNT(*) FROM reports) as total").fetchone()
    conn.close()
    return jsonify({"reports": reps, "stats": {"pending": stats['pending'], "published": stats['published'], "total": stats['total'], "blacklist_count": len(KNOWN_BAD_CONTRACTORS)}}), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    s = conn.execute(
        "SELECT COUNT(*) as c, COALESCE(SUM(contract_cost),0) as s FROM projects").fetchone()
    f = conn.execute(
        "SELECT COUNT(*) as c FROM projects WHERE suspicion_score >= 40").fetchone()
    conn.close()
    return jsonify({'total_projects': s['c'], 'total_budget': s['s'], 'flagged_projects': f['c'], 'flagged_percentage': round((f['c']/s['c'])*100, 1) if s['c'] > 0 else 0}), 200


@app.route('/api/admin/publish/<int:report_id>', methods=['POST'])
def publish_report(report_id):
    conn = get_db_connection()
    conn.execute(
        "UPDATE reports SET status = 'PUBLISHED' WHERE id = ?", (report_id,))
    row = conn.execute(
        "SELECT description FROM reports WHERE id = ?", (report_id,)).fetchone()
    conn.execute("INSERT OR IGNORE INTO published_reports (report_id, published_at, public_summary) VALUES (?, ?, ?)",
                 (report_id, datetime.datetime.now().isoformat(), row['description']))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 200


@app.route('/api/public-reports', methods=['GET'])
def get_public_reports():
    conn = get_db_connection()
    res = conn.execute("SELECT pr.*, r.case_id, r.description, r.ai_flags, r.timestamp, p.contractor as contractor_name, (SELECT COUNT(*) FROM report_files rf WHERE rf.case_id = r.case_id) as file_count FROM published_reports pr JOIN reports r ON pr.report_id = r.id LEFT JOIN projects p ON r.linked_project_id = p.id ORDER BY pr.id DESC").fetchall()
    conn.close()
    return jsonify(res), 200


@app.route('/api/admin/delete/<int:report_id>', methods=['POST', 'DELETE'])
def delete_report(report_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
