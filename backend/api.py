import os
import sys
import uuid
import datetime
import sqlite3
import json
import base64
import re
import google.generativeai as genai
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

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
# 2. AI CONFIGURATION
# ============================================================
# ⚠️ PASTE YOUR KEY HERE ⚠️
GENAI_API_KEY = "AIzaSyBSLl29pvFc6hgrFecaLXs0pb1gev5RKiI"
VALID_AI_MODELS = []

try:
    genai.configure(api_key=GENAI_API_KEY)
    print("🤖 AI Neural Core: ONLINE")
    
    # --- STARTUP: CHECK WHICH MODELS ACTUALLY WORK ---
    print("🔍 Scanning for available AI models...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                if 'gemini' in m.name:
                    VALID_AI_MODELS.append(m.name)
        
        VALID_AI_MODELS.sort(key=lambda x: 'flash' not in x)
        print(f"✅ Auto-Detected {len(VALID_AI_MODELS)} working models: {VALID_AI_MODELS}")
    except Exception as e:
        print(f"⚠️ Model Scan Failed (using defaults): {e}")
        VALID_AI_MODELS = ['models/gemini-pro', 'gemini-pro']

except Exception as e:
    print(f"⚠️ AI Config Error: {e}")

# ============================================================
# 3. INTELLIGENCE DATA
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
# 4. DATABASE HELPERS
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
    if not conn: return

    try:
        conn.execute('''CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT UNIQUE, description TEXT, status TEXT DEFAULT "PENDING", ai_flags TEXT, timestamp TEXT, admin_notes TEXT, linked_project_id INTEGER)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS report_files (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL, case_id TEXT NOT NULL, original_filename TEXT, file_data BLOB, file_type TEXT, file_size INTEGER, uploaded_at TEXT, FOREIGN KEY (report_id) REFERENCES reports(id))''')
        conn.execute('''CREATE TABLE IF NOT EXISTS published_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL UNIQUE, published_at TEXT, public_summary TEXT, admin_notes TEXT, FOREIGN KEY (report_id) REFERENCES reports(id))''')
        conn.execute('''CREATE TABLE IF NOT EXISTS ai_audit_results (project_id TEXT PRIMARY KEY, ai_verdict TEXT, ai_comment TEXT, ai_score INTEGER, analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        
        try:
            conn.execute("ALTER TABLE ai_audit_results ADD COLUMN ai_score INTEGER")
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
# 5. LOGIC & HELPERS
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
    if not user_text or len(user_text) < 5: return None
    conn = get_db_connection()
    if not conn: return None
    user_text_upper = user_text.upper()
    try:
        query = 'SELECT * FROM projects WHERE suspicion_score > 10 OR contract_cost > 10000000'
        projects = conn.execute(query).fetchall()
        for project in projects:
            contractor = (project.get('contractor') or '').strip().upper()
            mun = (project.get('municipality') or '').strip().upper()
            prov = (project.get('province') or '').strip().upper()
            if len(contractor) > 5 and contractor in user_text_upper: return project
            if mun and prov and f"{mun}, {prov}" in user_text_upper: return project
    except: pass
    finally: conn.close()
    return None

def analyze_text_flags(text):
    flags = []
    if not text: return flags
    text_upper = text.upper()
    for contractor in KNOWN_BAD_CONTRACTORS:
        if contractor in text_upper: flags.append(f"BLACKLIST MATCH: {contractor}")
    keywords = ["GHOST", "INCOMPLETE", "BRIBE", "SUBSTANDARD", "CRACK", "DELAY", "ABANDONED"]
    for word in keywords:
        if word in text_upper: flags.append(word)
    return flags

def get_mime_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    return {'.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.mp4':'video/mp4'}.get(ext,'application/octet-stream')

def clean_ai_json(text):
    match = re.search(r'\[.*\]', text, re.DOTALL)
    return match.group(0) if match else "[]"

# ============================================================
# API ROUTES
# ============================================================

# --- 1. AI AUDITOR (STRICT PARANOID MODE) ---
@app.route('/api/ai-audit-batch', methods=['POST'])
def ai_audit_batch():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        user_ids = request.json.get('project_ids', [])
        
        if user_ids:
            placeholders = ','.join('?' * len(user_ids))
            query = f"SELECT project_id, project_description, contract_cost, contractor, suspicion_score FROM projects WHERE project_id IN ({placeholders})"
            cursor.execute(query, user_ids)
        else:
            cursor.execute("SELECT project_id, project_description, contract_cost, contractor, suspicion_score FROM projects WHERE project_id NOT IN (SELECT project_id FROM ai_audit_results) LIMIT 5")
        
        rows = cursor.fetchall()
        if not rows:
            return jsonify({"status": "empty", "message": "No pending projects to analyze."}), 200

        batch_data = [dict(row) for row in rows]

        # --- PROMPT ENGINEERING: PARANOID MODE ACTIVATED ---
        system_instruction = f"""
        You are HYDRA, a CYNICAL GOVERNMENT FRAUD DETECTOR.
        
        INPUT DATA (Contains 'suspicion_score' from database):
        {json.dumps(batch_data, indent=2)}
        
        YOUR STRICT RULES:
        1. NEVER LOWER THE SCORE: The input 'suspicion_score' is your MINIMUM baseline. If DB says 80, you CANNOT go below 80.
        2. PENALIZE VAGUENESS: If description is generic (e.g., "Road Repair") -> ADD +20 POINTS.
        3. PENALIZE GENERIC NAMES: If contractor is "General Merchandise" or "Trading" -> ADD +15 POINTS.
        4. IF NO DESCRIPTION: Score must be 100.
        
        LEGEND:
        [80-100] = CRITICAL (Red) - Corruption Likely
        [60-79]  = HIGH (Yellow) - Suspicious
        [0-59]   = LOW (Green) - Nominal

        OUTPUT FORMAT (Raw JSON List):
        [
            {{
                "project_id": "id",
                "ai_verdict": "CRITICAL" or "HIGH" or "LOW",
                "ai_score": (Integer 0-100),
                "ai_comment": "Specific reason for risk level."
            }}
        ]
        """

        models_to_try = VALID_AI_MODELS if VALID_AI_MODELS else ['gemini-pro', 'models/gemini-pro']
        audit_results = None
        last_error = None

        for model_name in models_to_try:
            try:
                print(f"🔄 Analyzing with: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(system_instruction)
                if response and hasattr(response, 'text'):
                    audit_results = json.loads(clean_ai_json(response.text))
                    print(f"✅ Success with {model_name}")
                    break 
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ Failed {model_name}: {last_error}")
                continue

        if not audit_results:
            return jsonify({"status": "error", "message": f"AI Failed. {last_error}"}), 500

        for res in audit_results:
            cursor.execute("""
                INSERT OR REPLACE INTO ai_audit_results (project_id, ai_verdict, ai_comment, ai_score)
                VALUES (?, ?, ?, ?)
            """, (res.get('project_id'), res.get('ai_verdict'), res.get('ai_comment'), res.get('ai_score')))
        
        conn.commit()
        return jsonify({"status": "success", "analyzed_count": len(audit_results), "results": audit_results}), 200

    except Exception as e:
        print(f"AI Audit Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn: conn.close()


# --- SEARCH & GET PROJECTS (FIXED LOGIC: MAX(MATH, AI)) ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        if not conn: return jsonify([]), 200
        
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
            # --- THE FIX: SAFETY NET LOGIC ---
            # We take the HIGHER of the two scores. AI cannot hide a Red Flag.
            math_score = float(row.get('suspicion_score') or 0)
            ai_score_val = row.get('ai_score')
            ai_score = float(ai_score_val) if ai_score_val is not None else 0
            
            # Logic: If AI analyzed it, take the MAX of (AI, Math).
            # This ensures that if Math said 80, and AI said 20, we keep 80.
            final_score = max(math_score, ai_score) if ai_score_val is not None else math_score

            # Scoring
            if final_score >= 80:
                risk, color, desc = 'CRITICAL', 'Red', f"Score {int(final_score)}: Immediate Investigation"
            elif final_score >= 60:
                risk, color, desc = 'HIGH', 'Yellow', f"Score {int(final_score)}: Elevated Risk"
            else:
                risk, color, desc = 'LOW', 'Green', f"Score {int(final_score)}: Nominal"

            # Add AI Comment if available
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
    except: return jsonify([]), 200


# Replace your existing /api/search route in app.py

@app.route('/api/search', methods=['GET'])
def search_projects():
    try:
        query = request.args.get('q', '').strip()
        # Default to ALL if not specified
        filter_type = request.args.get('type', 'ALL').upper() 
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
        
        if query:
            sql += " WHERE "
            search_term = f"%{query}%"
            
            if filter_type == 'PROJECT':
                sql += "p.project_description LIKE ?"
                params.append(search_term)
            
            elif filter_type == 'CONTRACTOR':
                sql += "p.contractor LIKE ?"
                params.append(search_term)
            
            else: 
                # 'ALL' CASE: Search Description OR Contractor OR Location
                sql += "(p.project_description LIKE ? OR p.contractor LIKE ? OR p.municipality LIKE ?)"
                params.append(search_term)
                params.append(search_term)
                params.append(search_term)

        sql += " ORDER BY p.id DESC LIMIT ? OFFSET ?"
        params.append(limit)
        params.append(offset)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            # Same Risk Logic
            math = float(row['suspicion_score'] or 0)
            ai = float(row['ai_score']) if row['ai_score'] is not None else 0
            final = max(math, ai) if row['ai_score'] is not None else math

            risk = 'LOW'
            if final >= 80: risk = 'CRITICAL'
            elif final >= 60: risk = 'HIGH'

            if row['ai_verdict']: risk = f"AI {row['ai_verdict']}"

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
        row = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
        conn.close()
        if not row: return jsonify({"error": "Not found"}), 404
        
        score = float(row.get('suspicion_score') or 0)
        risk, color, desc = calculate_risk_level(score, row.get('max_severity'))
        
        # Get latitude and longitude, with fallback values
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
    except Exception as e: return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat_with_hydra():
    try:
        user_message = request.json.get('message', '') if request.json else ''
        if not user_message: return jsonify({"reply": "Please provide a message."}), 400
        conn = get_db_connection()
        stats = conn.execute("SELECT COUNT(*) as c, COALESCE(SUM(contract_cost), 0) as s FROM projects").fetchone()
        worst = conn.execute("SELECT project_description, contractor, suspicion_score FROM projects WHERE suspicion_score > 0 ORDER BY suspicion_score DESC LIMIT 3").fetchall()
        conn.close()
        sys_msg = f"HYDRA Investigator. Status: {stats['c']} projects, ₱{stats['s']:,.2f}. High Risk: {json.dumps([dict(r) for r in worst])}. User: {user_message}"
        models = VALID_AI_MODELS if VALID_AI_MODELS else ['gemini-pro']
        for m in models:
            try:
                model = genai.GenerativeModel(m)
                res = model.generate_content(sys_msg)
                return jsonify({"reply": res.text}), 200
            except: continue
        return jsonify({"reply": "AI unavailable"}), 500
    except Exception as e: return jsonify({"reply": str(e)}), 500


@app.route('/api/submit-evidence', methods=['POST'])
def submit_evidence():
    try:
        text = request.form.get('description', '')
        files = request.files.getlist('files')
        match = check_database_for_matches(text)
        lid = match['id'] if match else None
        conn = get_db_connection()
        if match: conn.execute("UPDATE projects SET is_flagged=1, color_triage='RED', suspicion_score=100, flag_count=flag_count+1 WHERE id=?", (lid,))
        cid = str(uuid.uuid4())[:8].upper()
        flags = analyze_text_flags(text)
        ts = datetime.datetime.now().isoformat()
        cur = conn.execute('INSERT INTO reports (case_id, description, status, ai_flags, timestamp, linked_project_id) VALUES (?, ?, ?, ?, ?, ?)', (cid, text, 'PENDING', json.dumps(flags), ts, lid))
        rid = cur.lastrowid
        for f in files:
            if f.filename == '': continue
            d = f.read()
            conn.execute('INSERT INTO report_files (report_id, case_id, original_filename, file_data, file_type, file_size, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)', (rid, cid, f.filename, d, get_mime_type(f.filename), len(d), ts))
        conn.commit()
        conn.close()
        return jsonify({"status": "queued", "case_id": cid}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/files/base64/<int:file_id>', methods=['GET'])
def get_file_base64(file_id):
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        r = conn.cursor().execute('SELECT original_filename, file_data, file_type FROM report_files WHERE id = ?', (file_id,)).fetchone()
        conn.close()
        if not r: return jsonify({"error": "Not found"}), 404
        b64 = base64.b64encode(r[1]).decode('utf-8')
        return jsonify({"filename": r[0], "type": r[2], "data": f"data:{r[2]};base64,{b64}"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    if request.json.get('password') == "hydra_admin_2025": return jsonify({"status": "success", "token": "verified"}), 200
    return jsonify({"status": "error"}), 401


@app.route('/api/admin/reports', methods=['GET'])
def get_admin_reports():
    conn = get_db_connection()
    reps = conn.execute("SELECT r.*, (SELECT COUNT(*) FROM report_files rf WHERE rf.case_id = r.case_id) as file_count FROM reports r WHERE r.status = 'PENDING' ORDER BY r.id DESC").fetchall()
    stats = conn.execute("SELECT (SELECT COUNT(*) FROM reports WHERE status='PENDING') as pending, (SELECT COUNT(*) FROM published_reports) as published, (SELECT COUNT(*) FROM reports) as total").fetchone()
    conn.close()
    return jsonify({"reports": reps, "stats": {"pending": stats['pending'], "published": stats['published'], "total": stats['total'], "blacklist_count": len(KNOWN_BAD_CONTRACTORS)}}), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    s = conn.execute("SELECT COUNT(*) as c, COALESCE(SUM(contract_cost),0) as s FROM projects").fetchone()
    f = conn.execute("SELECT COUNT(*) as c FROM projects WHERE suspicion_score >= 40").fetchone()
    conn.close()
    return jsonify({'total_projects': s['c'], 'total_budget': s['s'], 'flagged_projects': f['c'], 'flagged_percentage': round((f['c']/s['c'])*100,1) if s['c']>0 else 0}), 200


@app.route('/api/admin/publish/<int:report_id>', methods=['POST'])
def publish_report(report_id):
    conn = get_db_connection()
    conn.execute("UPDATE reports SET status = 'PUBLISHED' WHERE id = ?", (report_id,))
    row = conn.execute("SELECT description FROM reports WHERE id = ?", (report_id,)).fetchone()
    conn.execute("INSERT OR IGNORE INTO published_reports (report_id, published_at, public_summary) VALUES (?, ?, ?)", (report_id, datetime.datetime.now().isoformat(), row['description']))
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