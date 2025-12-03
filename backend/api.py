from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# ================= PATH CONFIGURATION =================
# Assuming api.py is in 'backend/', and data is in 'backend/Datas/'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, "Datas", "flood_control.db")
# ======================================================


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = dict_factory
    return conn


def calculate_risk_level(suspicion_score, max_severity):
    sev = (max_severity or '').upper()
    score = float(suspicion_score) if suspicion_score else 0

    if sev == 'CRITICAL' or score >= 80:
        return ('Critical', 'Red', 'IMMEDIATE INVESTIGATION. Strong, confirmed evidence of fraud.')

    if sev == 'HIGH' or score >= 40:
        return ('High', 'Yellow', 'PRIORITY INVESTIGATION. Serious red flags detected.')

    return ('Low', 'Green', 'CONTINUOUS MONITORING. No major anomalies detected.')


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("PRAGMA table_info(projects)")
        columns_info = cursor.fetchall()
        column_names = [col['name'] for col in columns_info]
        score_column = 'suspicion_score' if 'suspicion_score' in column_names else 'score'

        query = f'''
            SELECT id, project_id, project_description, contractor, contract_cost,
                region, province, municipality, start_date, completion_date,
                is_flagged, max_severity, {score_column}, color_triage, 
                latitude, longitude, year, satellite_image_url
            FROM projects
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        '''

        cursor.execute(query)
        rows = cursor.fetchall()
        projects = []

        for row in rows:
            raw_score = row.get(score_column, 0)
            score = float(raw_score) if raw_score is not None else 0.0

            risk_level, color_name, risk_description = calculate_risk_level(
                score, row['max_severity'])

            projects.append({
                'id': row['id'],
                'name': row['project_description'] or f"Project {row['project_id']}",
                'contractor': row['contractor'] or 'Unknown Contractor',
                'risk': risk_level,
                'color': color_name,
                'score': score,
                'latitude': row['latitude'],
                'longitude': row['longitude'],
                'budget': row['contract_cost'] or 0,
                'start_date': row['start_date'] or 'N/A',
                'end_date': row['completion_date'] or 'N/A',
                'status': 'Flagged' if score >= 40 else 'Normal',
                'risk_description': risk_description,
                'region': row['region'],
                'province': row['province'],
                'municipality': row['municipality'],
                'year': row['year'],
                'satellite_image_url': row['satellite_image_url']
            })

        conn.close()
        return jsonify(projects), 200

    except Exception as e:
        print(f"❌ Error in get_projects: {str(e)}")
        return jsonify([]), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        stats = {}

        cursor.execute(
            'SELECT COUNT(*) as count, SUM(contract_cost) as total_money FROM projects')
        total_row = cursor.fetchone()
        stats['total_projects'] = total_row['count']
        stats['total_budget'] = total_row['total_money'] or 0

        cursor.execute(f'''
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE suspicion_score >= 40 OR max_severity IN ('HIGH', 'CRITICAL')
        ''')
        flagged_row = cursor.fetchone()
        stats['flagged_projects'] = flagged_row['count']

        if stats['total_projects'] > 0:
            stats['flagged_percentage'] = round(
                (stats['flagged_projects'] / stats['total_projects']) * 100, 1)
        else:
            stats['flagged_percentage'] = 0.0

        conn.close()
        return jsonify(stats), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_detail(project_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
        project = cursor.fetchone()

        if not project:
            conn.close()
            return jsonify({'error': 'Project not found'}), 404

        score = project.get('suspicion_score', 0) or 0
        risk_level, color_name, risk_desc = calculate_risk_level(
            score, project['max_severity'])

        project['risk'] = risk_level
        project['color'] = color_name
        project['risk_description'] = risk_desc
        project['score'] = score

        conn.close()
        return jsonify(project), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
