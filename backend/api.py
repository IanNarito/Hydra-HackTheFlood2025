from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

DATABASE_FILE = "flood_control.db"


def dict_factory(cursor, row):
    """Convert sqlite3.Row to dictionary"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = dict_factory
    return conn


def calculate_risk_level(suspicion_score, max_severity):
    """
    OFFICIAL TRIAGE SYSTEM - Matches your risk assessment table:
    - CRITICAL severity or score 80-100: CRITICAL ANOMALY (Red)
    - HIGH severity or score 60-79: HIGH ANOMALY (Yellow) 
    - MEDIUM severity or score 0-59: WATCHLIST/LOW RISK (Green)
    - NULL/empty severity and score=0: INDETERMINATE (Grey)

    Returns tuple: (risk_label, color_name, risk_description)
    """
    sev = (max_severity or '').upper()
    score = float(suspicion_score) if suspicion_score else 0

    # If both score is 0 AND severity is NULL/empty -> Indeterminate
    if score == 0 and not sev:
        return (
            'Indeterminate',
            'Grey',
            'No risk assessment available.'
        )

    # Handle UNDER_INVESTIGATION / missing data separately
    if sev == 'UNDER_INVESTIGATION' or sev == 'VAGUENESS':
        return (
            'Indeterminate',
            'Grey',
            'DATA VALIDATION REQUIRED. Key data is missing or contradictory.'
        )

    # CRITICAL: severity = CRITICAL OR score >= 80
    if sev == 'CRITICAL' or score >= 80:
        return (
            'Critical',
            'Red',
            'IMMEDIATE INVESTIGATION. Strong, confirmed evidence of fraud.'
        )

    # HIGH: severity = HIGH OR score >= 60
    if sev == 'HIGH' or score >= 60:
        return (
            'High',
            'Yellow',
            'PRIORITY INVESTIGATION. Serious red flags are present.'
        )

    # MEDIUM/LOW: severity = MEDIUM/LOW OR score < 60
    if sev in ['MEDIUM', 'LOW'] or score < 60:
        return (
            'Low',
            'Green',
            'CONTINUOUS MONITORING. Low-level anomalies.'
        )

    # Default fallback
    return (
        'Low',
        'Green',
        'CONTINUOUS MONITORING. Low-level anomalies.'
    )


@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if latitude/longitude columns exist
        cursor.execute("PRAGMA table_info(projects)")
        columns_info = cursor.fetchall()
        column_names = [col['name'] for col in columns_info]

        print("📋 Available columns:", column_names)  # DEBUG

        has_coordinates = 'latitude' in column_names and 'longitude' in column_names

        if not has_coordinates:
            conn.close()
            print(
                "⚠️  Warning: Database missing latitude/longitude. Returning empty map.")
            return jsonify([]), 200

        # Build dynamic query based on available columns
        # Check for score column variations
        score_column = None
        if 'suspicion_score' in column_names:
            score_column = 'suspicion_score'
        elif 'score' in column_names:
            score_column = 'score'
        elif 'risk_score' in column_names:
            score_column = 'risk_score'

        print(f"🔍 Using score column: {score_column}")  # DEBUG

        # Get projects with coordinates
        query = f'''
            SELECT
                id,
                project_id,
                project_description,
                contractor,
                contract_cost,
                region,
                province,
                municipality,
                start_date,
                completion_date,
                is_flagged,
                max_severity,
                {score_column if score_column else '0 as suspicion_score'},
                color_triage,
                latitude,
                longitude
            FROM projects
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        '''

        cursor.execute(query)
        rows = cursor.fetchall()

        print(f"📊 Fetched {len(rows)} projects")  # DEBUG

        projects = []

        for row in rows:
            # Get score using the correct column name
            raw_score = row.get(score_column) if score_column else row.get(
                'suspicion_score', 0)

            # Handle None values and convert to float
            try:
                score = float(raw_score) if raw_score is not None else 0.0
            except (ValueError, TypeError):
                score = 0.0

            # DEBUG
            print(
                f"  Project {row['project_id']}: raw_score={raw_score}, converted_score={score}")

            # Use OFFICIAL triage calculation
            risk_level, color_name, risk_description = calculate_risk_level(
                score, row['max_severity'])

            # SKIP GREY/INDETERMINATE MARKERS - only show Red/Yellow/Green
            if risk_level == 'Indeterminate' or color_name == 'Grey':
                continue

            # Determine status based on OFFICIAL TRIAGE
            # Flagged if: High/Critical risk level OR database says flagged
            # Don't use score if it's 0 (not calculated yet)
            is_flagged = (
                row['is_flagged'] == 1 or
                risk_level in ['High', 'Critical']
            )
            status_text = 'Flagged' if is_flagged else 'Normal'

            projects.append({
                'id': row['id'],
                'name': row['project_description'] or f"Project {row['project_id']}",
                'contractor': row['contractor'] or 'Unknown Contractor',
                'risk': risk_level,  # "Critical", "High", "Low", or "Indeterminate"
                'color': color_name,  # "Red", "Yellow", "Green", "Grey"
                'score': score,  # Now properly converted
                'latitude': row['latitude'],
                'longitude': row['longitude'],
                'budget': f"₱ {row['contract_cost']:,.2f}" if row['contract_cost'] else 'N/A',
                'start_date': row['start_date'] or 'N/A',
                'end_date': row['completion_date'] or 'N/A',
                'status': status_text,
                'risk_description': risk_description,
                'region': row['region'],
                'province': row['province'],
                'municipality': row['municipality']
            })

        conn.close()
        print(f"✅ Returning {len(projects)} projects with scores")
        return jsonify(projects), 200

    except Exception as e:
        print(f"❌ Error in get_projects: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify([]), 200


@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_detail(project_id):
    """Get detailed info including flags for a specific project"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get project
        cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
        project = cursor.fetchone()

        if not project:
            conn.close()
            return jsonify({'error': 'Project not found'}), 404

        # Check which score column exists
        score_value = (
            project.get('suspicion_score') or
            project.get('score') or
            project.get('risk_score') or
            0
        )

        # Recalculate using OFFICIAL TRIAGE
        try:
            score = float(score_value) if score_value is not None else 0.0
        except (ValueError, TypeError):
            score = 0.0

        risk_level, color_name, risk_description = calculate_risk_level(
            score, project['max_severity'])

        # Update fields to match
        project['risk'] = risk_level
        project['color'] = color_name
        project['risk_description'] = risk_description
        project['score'] = score

        # Status based on OFFICIAL triage - rely on risk_level instead of score
        is_flagged = project['is_flagged'] == 1 or risk_level in [
            'High', 'Critical']
        project['status'] = 'Flagged' if is_flagged else 'Normal'

        # Get flags
        cursor.execute('''
            SELECT severity, flag_type, reason 
            FROM project_flags 
            WHERE project_id = ?
        ''', (project['project_id'],))

        flags = cursor.fetchall()
        project['flags'] = flags

        conn.close()
        return jsonify(project), 200

    except Exception as e:
        print(f"❌ Error in get_project_detail: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics - UPDATED to match official triage"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check which score column exists
        cursor.execute("PRAGMA table_info(projects)")
        columns_info = cursor.fetchall()
        column_names = [col['name'] for col in columns_info]

        score_column = None
        if 'suspicion_score' in column_names:
            score_column = 'suspicion_score'
        elif 'score' in column_names:
            score_column = 'score'
        elif 'risk_score' in column_names:
            score_column = 'risk_score'

        stats = {}

        # Total Projects & Budget
        cursor.execute(
            'SELECT COUNT(*) as count, SUM(contract_cost) as total_money FROM projects')
        total_row = cursor.fetchone()
        stats['total_projects'] = total_row['count']
        stats['total_budget'] = total_row['total_money'] or 0

        # Flagged Projects - based on severity OR score OR is_flagged flag
        if score_column:
            query = f'''
                SELECT COUNT(*) as count, SUM(contract_cost) as flagged_money 
                FROM projects 
                WHERE {score_column} >= 60 
                   OR is_flagged = 1 
                   OR max_severity IN ('HIGH', 'CRITICAL')
            '''
        else:
            query = '''
                SELECT COUNT(*) as count, SUM(contract_cost) as flagged_money 
                FROM projects 
                WHERE is_flagged = 1 
                   OR max_severity IN ('HIGH', 'CRITICAL')
            '''

        cursor.execute(query)
        flagged_row = cursor.fetchone()
        stats['flagged_projects'] = flagged_row['count']
        stats['flagged_budget'] = flagged_row['flagged_money'] or 0

        # Calculate Percentage
        if stats['total_projects'] > 0:
            stats['flagged_percentage'] = round(
                (stats['flagged_projects'] / stats['total_projects']) * 100, 1)
        else:
            stats['flagged_percentage'] = 0.0

        # Check if coordinates exist
        stats['has_coordinates'] = 'latitude' in column_names and 'longitude' in column_names

        # Geocoded count
        if stats['has_coordinates']:
            cursor.execute(
                'SELECT COUNT(*) as count FROM projects WHERE latitude IS NOT NULL')
            stats['geocoded_projects'] = cursor.fetchone()['count']
        else:
            stats['geocoded_projects'] = 0

        # Total flags
        try:
            cursor.execute('SELECT COUNT(*) as count FROM project_flags')
            stats['total_flags'] = cursor.fetchone()['count']
        except:
            stats['total_flags'] = 0

        conn.close()
        return jsonify(stats), 200

    except Exception as e:
        print(f"❌ Error in stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route("/debug/table")
def debug_table():
    """Debug endpoint to see table structure"""
    conn = sqlite3.connect("flood_control.db")
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(projects);")
    columns = cursor.fetchall()

    # Also get sample data
    cursor.execute("SELECT * FROM projects LIMIT 3")
    sample_data = cursor.fetchall()

    conn.close()

    return {
        "table_info": columns,
        "sample_data": sample_data
    }


@app.route("/debug/scores")
def debug_scores():
    """New debug endpoint specifically for scores"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get column names
        cursor.execute("PRAGMA table_info(projects)")
        columns = [col['name'] for col in cursor.fetchall()]

        # Get first 5 projects with all their data
        cursor.execute("SELECT * FROM projects LIMIT 5")
        projects = cursor.fetchall()

        conn.close()

        return jsonify({
            "columns": columns,
            "sample_projects": projects
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
