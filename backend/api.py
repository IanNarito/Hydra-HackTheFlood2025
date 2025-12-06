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
# Find the first existing path, default to the Datas folder if none found
DATABASE_FILE = next((p for p in POSSIBLE_DB_PATHS if os.path.exists(p)),
                     os.path.join(BASE_DIR, 'Datas', 'flood_control.db'))

print(f"⚡ Database Path: {DATABASE_FILE}")

# ============================================================
# 2. AI CONFIGURATION & SMART MODEL DETECTION
# ============================================================
# ⚠️ PASTE YOUR KEY HERE ⚠️
GENAI_API_KEY = "AIzaSyC7eE_XihiaxxDo27ctMITl0d0VwcsD2bE"
VALID_AI_MODELS = []

try:
    genai.configure(api_key=GENAI_API_KEY)
    print("🤖 AI Neural Core: ONLINE")
    
    # --- STARTUP: CHECK WHICH MODELS ACTUALLY WORK ---
    # This prevents the 404 Error by asking Google "What do I have access to?"
    print("🔍 Scanning for available AI models...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                # We prefer flash or pro models
                if 'gemini' in m.name:
                    VALID_AI_MODELS.append(m.name)
        
        # Sort to put 'flash' models first (usually faster)
        VALID_AI_MODELS.sort(key=lambda x: 'flash' not in x)
        print(f"✅ Auto-Detected {len(VALID_AI_MODELS)} working models: {VALID_AI_MODELS}")
    except Exception as e:
        print(f"⚠️ Model Scan Failed (using defaults): {e}")
        # Fallback hardcoded list if the scan fails (Safe defaults for older libs)
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
        # ... (Keep your existing reports/files tables code here) ...
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

        # --- UPDATED AI TABLE WITH SCORE COLUMN ---
        conn.execute('''
            CREATE TABLE IF NOT EXISTS ai_audit_results (
                project_id TEXT PRIMARY KEY,
                ai_verdict TEXT,
                ai_comment TEXT,
                ai_score INTEGER, 
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # SAFETY: If table exists but missing column (for existing DBs)
        try:
            conn.execute("ALTER TABLE ai_audit_results ADD COLUMN ai_score INTEGER")
        except:
            pass # Column likely exists

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

def clean_ai_json(text):
    # Removes markdown formatting if the AI adds it
    match = re.search(r'\[.*\]', text, re.DOTALL)
    return match.group(0) if match else "[]"

# ============================================================
# API ROUTES
# ============================================================

# --- 1. NEW AI AUDITOR ROUTE (WITH SMART MODEL SELECTION) ---
@app.route('/api/ai-audit-batch', methods=['POST'])
def ai_audit_batch():
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # A. Select Data
        user_ids = request.json.get('project_ids', [])
        
        if user_ids:
            placeholders = ','.join('?' * len(user_ids))
            query = f"""
                SELECT project_id, project_description, contract_cost, contractor, suspicion_score 
                FROM projects WHERE project_id IN ({placeholders})
            """
            cursor.execute(query, user_ids)
        else:
            cursor.execute("""
                SELECT project_id, project_description, contract_cost, contractor, suspicion_score 
                FROM projects 
                WHERE project_id NOT IN (SELECT project_id FROM ai_audit_results)
                LIMIT 5
            """)
        
        rows = cursor.fetchall()
        if not rows:
            return jsonify({"status": "empty", "message": "No pending projects to analyze."}), 200

        batch_data = [dict(row) for row in rows]

        # B. UPDATED PROMPT WITH SCORING RULES
        system_instruction = f"""
        You are HYDRA, a Senior Fraud Auditor.
        
        TASK: Analyze these projects. Assign a 'risk_score' based on this LEGEND:
        
        [80 - 100] = CRITICAL
        - Use if: Corruption is obvious, Contractor is blacklisted, or Description makes no sense for the cost.
        
        [60 - 79] = HIGH
        - Use if: Vague description, generic contractor name, or minor overpricing.
        
        [0 - 59] = LOW
        - Use if: Project looks legitimate and costs are reasonable.

        INPUT DATA:
        {json.dumps(batch_data, indent=2)}

        OUTPUT FORMAT (Raw JSON List):
        [
            {{
                "project_id": "id",
                "ai_verdict": "CRITICAL" or "HIGH" or "LOW",
                "ai_score": (Integer between 0-100),
                "ai_comment": "Short reason why."
            }}
        ]
        """

        # C. Call Gemini (Smart List)
        models_to_try = VALID_AI_MODELS if VALID_AI_MODELS else ['gemini-pro', 'models/gemini-pro']
        last_error = None
        audit_results = None

        for model_name in models_to_try:
            try:
                print(f"🔄 Attempting AI analysis using: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(system_instruction)

                if response and hasattr(response, 'text'):
                    cleaned_json = clean_ai_json(response.text)
                    audit_results = json.loads(cleaned_json)
                    print(f"✅ Success with {model_name}")
                    break 

            except Exception as model_error:
                last_error = str(model_error)
                print(f"⚠️ Failed with {model_name}: {last_error}")
                continue

        if audit_results is None:
            return jsonify({"status": "error", "message": f"AI Failed. Last error: {last_error}"}), 500

        # D. Save to DB (Now including SCORE)
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

        # 3. TRY MULTIPLE MODEL NAMES (Using Auto-Detected List)
        models_to_try = VALID_AI_MODELS if VALID_AI_MODELS else ['gemini-pro', 'models/gemini-pro']

        last_error = None

        for model_name in models_to_try:
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

# --- PROJECT DATA ROUTE (UPDATED FOR AI MAP REPLACEMENT) ---


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify([]), 200
        
        cursor = conn.cursor()

        # 1. FETCH PROJECTS + AI AUDIT RESULTS (LEFT JOIN)
        # Added 'a.ai_score' to the selection
        query = '''
            SELECT 
                p.id, p.project_id, p.project_description, p.contractor, p.contract_cost,
                p.region, p.province, p.municipality, p.start_date, p.completion_date,
                p.is_flagged, p.max_severity, p.suspicion_score, p.color_triage, 
                p.latitude, p.longitude, p.year, p.satellite_image_url,
                a.ai_verdict, a.ai_comment, a.ai_score
            FROM projects p
            LEFT JOIN ai_audit_results a ON p.project_id = a.project_id
            WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        '''
        
        cursor.execute(query)
        rows = cursor.fetchall()
        projects = []
        
        for row in rows:
            # -- LOGIC: Prefer AI Score if it exists, otherwise use Math Score --
            ai_score = row.get('ai_score')
            math_score = float(row.get('suspicion_score') or 0)
            
            final_score = float(ai_score) if ai_score is not None else math_score

            # -- Calculate Display Colors based on FINAL SCORE --
            # This matches your image legend strictly
            if final_score >= 80:
                risk_level = 'CRITICAL'
                color_name = 'Red'
                risk_desc = f"Score {int(final_score)}: Immediate investigation required"
            elif final_score >= 60:
                risk_level = 'HIGH'
                color_name = 'Yellow'
                risk_desc = f"Score {int(final_score)}: Elevated risk indicators"
            else:
                risk_level = 'LOW'
                color_name = 'Green'
                risk_desc = f"Score {int(final_score)}: Minimal risk"

            # -- AI Override Details for Frontend --
            ai_verdict = row.get('ai_verdict')
            ai_comment = row.get('ai_comment')
            
            # If AI has something to say, append it to description
            if ai_verdict:
                risk_level = f"AI {ai_verdict}" # e.g., AI CRITICAL
                risk_desc = f"AI SCORE {ai_score}: {ai_comment}"

            projects.append({
                'id': row['id'],
                'name': row.get('project_description') or f"Project {row.get('project_id')}",
                'contractor': row.get('contractor') or 'Unknown Contractor',
                
                # VISUALS (Now synchronized with score)
                'risk': risk_level,
                'color': color_name,
                'score': final_score, # Sending the synchronized score
                'risk_description': risk_desc,
                
                # AI Specific
                'ai_audited': bool(ai_verdict),
                'ai_verdict': ai_verdict,
                'ai_comment': ai_comment,

                # Standard Data
                'latitude': row['latitude'],
                'longitude': row['longitude'],
                'budget': row.get('contract_cost') or 0,
                'start_date': row.get('start_date') or 'N/A',
                'end_date': row.get('completion_date') or 'N/A',
                'status': 'Flagged' if final_score >= 60 else 'Normal',
                'region': row.get('region'),
                'province': row.get('province'),
                'municipality': row.get('municipality'),
                'year': row.get('year'),
                'satellite_image_url': row.get('satellite_image_url')
            })
        conn.close()
        return jsonify(projects), 200
    except Exception as e:
        print(f"Get Projects Error: {e}")
        return jsonify([]), 200


@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_by_id(project_id):
    """Get a single project by ID for satellite evidence page"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        query = '''
            SELECT id, project_id, project_description, contractor, contract_cost,
                region, province, municipality, start_date, completion_date,
                is_flagged, max_severity, suspicion_score, color_triage, 
                latitude, longitude, year, satellite_image_url
            FROM projects
            WHERE id = ?
        '''
        cursor.execute(query, (project_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({"error": "Project not found"}), 404
        
        raw_score = row.get('suspicion_score', 0)
        score = float(raw_score) if raw_score is not None else 0.0
        risk_level, color_name, risk_desc = calculate_risk_level(
            score, row.get('max_severity'))
        
        project = {
            'id': row['id'],
            'project_id': row.get('project_id'),
            'project_description': row.get('project_description'),
            'name': row.get('project_description') or f"Project {row.get('project_id')}",
            'contractor': row.get('contractor') or 'Unknown Contractor',
            'risk': risk_level,
            'color': color_name,
            'score': score,
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'contract_cost': row.get('contract_cost') or 0,
            'budget': row.get('contract_cost') or 0,
            'start_date': row.get('start_date') or 'N/A',
            'completion_date': row.get('completion_date') or 'N/A',
            'end_date': row.get('completion_date') or 'N/A',
            'status': 'Flagged' if score >= 40 else 'Normal',
            'risk_description': risk_desc,
            'region': row.get('region'),
            'province': row.get('province'),
            'municipality': row.get('municipality'),
            'year': row.get('year'),
            'satellite_image_url': row.get('satellite_image_url')
        }
        
        return jsonify(project), 200
    except Exception as e:
        print(f"Error fetching project {project_id}: {e}")
        return jsonify({"error": str(e)}), 500

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