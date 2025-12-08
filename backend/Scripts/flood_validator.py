import json
import os
from datetime import datetime, timedelta
from collections import defaultdict, Counter

# ================= PATH CONFIGURATION =================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "Datas")

RAW_INPUT_FILE = os.path.join(DATA_DIR, "flood_control_raw_projects.json")
CLEAN_OUTPUT_FILE = os.path.join(DATA_DIR, "flood_projects.json")
FLAGGED_OUTPUT_FILE = os.path.join(DATA_DIR, "flood_flagged_projects.json")
CANDIDATES_FILE = os.path.join(
    DATA_DIR, "satellite_verification_candidates.json")
SUMMARY_FILE = os.path.join(DATA_DIR, "validation_summary.json")
COA_REPORT_FILE = os.path.join(DATA_DIR, "coa_contractor_report.json")
BENCHMARK_OUTPUT_FILE = os.path.join(DATA_DIR, "system_benchmarks.json")
# ======================================================

# ============================================================================
# 1. KNOWLEDGE BASE (CONTRACTORS & LOCATIONS)
# ============================================================================

KNOWN_BAD_CONTRACTORS = {
    'SYMS CONSTRUCTION TRADING': {'reason': 'Ghost projects', 'severity': 'CRITICAL', 'source': 'COA'},
    'M3 KONSTRUCT CORPORATION': {'reason': 'Irregularities', 'severity': 'CRITICAL', 'source': 'COA'},
    'WAWAO BUILDERS': {'reason': 'Fraud findings', 'severity': 'CRITICAL', 'source': 'COA'},
    'ST. TIMOTHY CONSTRUCTION CORP.': {'reason': 'Serious discrepancies', 'severity': 'CRITICAL', 'source': 'COA'},
    'ST. TIMOTHY CONSTRUCTION': {'reason': 'Serious discrepancies', 'severity': 'CRITICAL', 'source': 'COA'},
    'AMETHYST HORIZON BUILDERS': {'reason': 'Substandard works', 'severity': 'CRITICAL', 'source': 'COA'},
    'L.R. TIQUI BUILDERS': {'reason': 'Flagged Joint Ventures', 'severity': 'CRITICAL', 'source': 'COA'},
    'SBD BUILDERS INC': {'reason': 'Expired licenses', 'severity': 'HIGH', 'source': 'COA'},
    'ADL GENERAL CONSTRUCTION': {'reason': 'Blacklisted firm', 'severity': 'HIGH', 'source': 'COA'},
    'TAWID BUILDERS CORP': {'reason': 'Re-awarded contracts', 'severity': 'MEDIUM', 'source': 'COA'},
    'R.U. AQUINO CONSTRUCTION': {'reason': 'Conflict of interest', 'severity': 'MEDIUM', 'source': 'COA'},
    'LE BRON CONSTRUCTION': {'reason': 'Conflict of interest', 'severity': 'MEDIUM', 'source': 'COA'}
}

BAD_CONTRACTOR_NAMES = set(KNOWN_BAD_CONTRACTORS.keys())

PROBLEMATIC_LOCATIONS = {
    'Bulacan': 'High incidence of COA-flagged ghost projects',
    'Quezon City': 'Multiple fraud cases documented',
    'Maguindanao': 'Audit findings show irregularities',
    'Cebu City': 'Sports center rehab irregularities flagged'
}

# ============================================================================
# 2. HELPER FUNCTIONS
# ============================================================================


def normalize_contractor_name(name):
    if not name:
        return ''
    normalized = str(name).upper().strip()
    return ' '.join(normalized.split()).replace(',', '').replace('.', '').replace('&', 'AND')


def check_bad_contractor(contractor_name):
    if not contractor_name:
        return None
    variations = normalize_contractor_name(contractor_name)
    # Check exact match or substring match against known bad list
    for bad_name in BAD_CONTRACTOR_NAMES:
        norm_bad = normalize_contractor_name(bad_name)
        if norm_bad == variations or norm_bad in variations:
            return KNOWN_BAD_CONTRACTORS[bad_name]
    return None


def parse_date(date_string):
    if not date_string:
        return None
    formats = ['%Y-%m-%d', '%m/%d/%Y', '%Y/%m/%d', '%d-%m-%Y']
    for fmt in formats:
        try:
            return datetime.strptime(str(date_string).split('T')[0], fmt)
        except ValueError:
            continue
    return None


def calculate_data_completeness(project):
    critical_fields = {
        'contractor': bool(project.get('contractor') and project['contractor'].strip() not in ['', 'TBA', 'N/A']),
        'contract_cost': bool(project.get('contract_cost') and project['contract_cost'] > 0),
        'start_date': bool(project.get('start_date')),
        'completion_date': bool(project.get('completion_date')),
        'municipality': bool(project.get('municipality')),
        'province': bool(project.get('province'))
    }
    completed = sum(critical_fields.values())
    return {
        'score': round((completed / len(critical_fields)) * 100, 1),
        'is_incomplete': completed < 4
    }

# ============================================================================
# 3. CLEANING ENGINE (UPDATED FOR MAP COORDINATES)
# ============================================================================


def clean_projects(raw_projects):
    print("\nCleaning project data...")
    cleaned = []
    for p in raw_projects:
        # Normalize Keys (Handle different JSON formats)
        lat = p.get('Latitude') or p.get('Lat') or p.get('latitude')
        lng = p.get('Longitude') or p.get('Long') or p.get('longitude')

        cleaned_project = {
            'project_id': p.get('GlobalID') or p.get('ProjectID'),
            'project_description': p.get('ProjectDescription', ''),
            'year': p.get('InfraYear') or p.get('FundingYear'),
            'region': p.get('Region', ''),
            'province': p.get('Province', ''),
            'municipality': p.get('Municipality', ''),
            'barangay': p.get('Barangay', ''),
            'type_of_work': p.get('TypeofWork', ''),
            'contractor': p.get('Contractor', ''),
            'contract_cost': None,
            'contract_id': p.get('ContractID', ''),
            'legislative_district': p.get('LegislativeDistrict', ''),
            'district_engineering_office': p.get('DistrictEngineeringOffice', ''),
            'start_date': p.get('StartDate', ''),
            'completion_date': p.get('CompletionDateActual', ''),
            # --- MAP FIX: ENSURE LAT/LONG ARE CAPTURED ---
            'latitude': float(lat) if lat else None,
            'longitude': float(lng) if lng else None,
            # ---------------------------------------------
            'satellite_image_url': p.get('SatelliteImageURL', '')
        }

        # Parse Cost safely
        if p.get('ContractCost'):
            try:
                val = str(p['ContractCost']).replace(',', '')
                cleaned_project['contract_cost'] = float(val)
            except (ValueError, TypeError):
                pass

        cleaned.append(cleaned_project)
    return cleaned

# ============================================================================
# 4. SCORING & FLAGGING LOGIC (TIER 1 VALIDATION)
# ============================================================================


def flag_project(project, all_projects):
    flags = []
    current_year = datetime.now().year
    contractor = (project.get('contractor') or '').strip()
    start_date = parse_date(project.get('start_date'))
    completion_date = parse_date(project.get('completion_date'))

    # 1. COA FLAGGED CONTRACTOR (+80)
    contractor_info = check_bad_contractor(contractor)
    if contractor_info:
        flags.append({
            'type': 'KNOWN_PROBLEMATIC_CONTRACTOR',
            'reason': f"Flagged by COA: {contractor_info['reason']}",
            'weight': 80
        })

    # 2. INVALID TIMELINE (+70)
    if start_date and completion_date and completion_date < start_date:
        flags.append({
            'type': 'INVALID_TIMELINE',
            'reason': 'Completion date is before start date',
            'weight': 70
        })

    # 3. MISSING CONTRACTOR (+50)
    if (not contractor or contractor in ['TBA', 'N/A']) and (current_year - (project.get('year') or current_year) >= 1):
        flags.append({
            'type': 'MISSING_CONTRACTOR',
            'reason': 'No contractor on record for old project',
            'weight': 50
        })

    # 4. DUPLICATE CONTRACT ID (+40)
    if project.get('contract_id'):
        dupes = [x for x in all_projects if x.get(
            'contract_id') == project['contract_id']]
        if len(dupes) > 1:
            flags.append({
                'type': 'DUPLICATE_CONTRACT_ID',
                'reason': f'Contract ID appears {len(dupes)} times',
                'weight': 40
            })

    # 5. MISSING COST (+40)
    if not project.get('contract_cost'):
        flags.append(
            {'type': 'MISSING_COST', 'reason': 'No cost recorded', 'weight': 40})

    return flags


def calculate_suspicion_score(flags):
    return min(100, sum(flag['weight'] for flag in flags))


def get_triage(score, is_incomplete):
    if score >= 80:
        return {'color': 'RED', 'rating': 'Critical Risk', 'severity': 'CRITICAL', 'priority': 1}
    if is_incomplete:
        return {'color': 'GREY', 'rating': 'Incomplete Data', 'severity': 'UNKNOWN', 'priority': 4}
    if score >= 60:
        return {'color': 'YELLOW', 'rating': 'High Risk', 'severity': 'HIGH', 'priority': 2}
    return {'color': 'GREEN', 'rating': 'Low Risk', 'severity': 'LOW', 'priority': 3}

# ============================================================================
# 5. CONTEXT & ORCHESTRATION
# ============================================================================


def add_contextual_info(project):
    info = {}
    prov = project.get('province', '')
    if prov in PROBLEMATIC_LOCATIONS:
        info['location_note'] = f'{prov}: {PROBLEMATIC_LOCATIONS[prov]}'
        info['high_risk_location'] = True

    # Check if eligible for satellite view (Has Coordinates)
    if project.get('latitude') and project.get('longitude'):
        info['satellite_eligible'] = True
    else:
        info['satellite_eligible'] = False

    return info


def validate_and_flag_projects(projects):
    print("Analyzing projects with Tier 1 Rules...")
    flagged_projects = []

    for project in projects:
        completeness = calculate_data_completeness(project)
        flags = flag_project(project, projects)
        score = calculate_suspicion_score(flags)
        triage = get_triage(score, completeness['is_incomplete'])
        context = add_contextual_info(project)

        if flags:
            flagged_projects.append({
                **project,
                'flags': flags,
                'flag_count': len(flags),
                'suspicion_score': score,
                'max_severity': triage['severity'],
                'color_triage': triage['color'],
                'triage_rating': triage['rating'],
                'contextual_info': context
            })

    return flagged_projects

# ============================================================================
# 6. AI MEMORY GENERATOR (THE CHEAT SHEET)
# ============================================================================


def generate_system_benchmarks(projects):
    """
    Tier 1 Logic: Calculates the 'Normal' baseline for your specific system.
    This creates the 'Brain' that the AI will reference later.
    """
    print("\n📊 Generating Statistical Benchmarks (The 'Brain' for Tier 2)...")
    stats = {
        "province_stats": defaultdict(list),
        "type_stats": defaultdict(list)
    }
    count = 0

    for p in projects:
        cost = p.get('contract_cost', 0) or 0
        prov = str(p.get('province', 'Unknown')).strip().upper()
        desc = str(p.get('project_description', '')).strip().upper()

        if "ROAD" in desc:
            group = "ROADS"
        elif "FLOOD" in desc or "RIVER" in desc:
            group = "FLOOD_CONTROL"
        elif "BUILDING" in desc:
            group = "BUILDINGS"
        else:
            group = "OTHERS"

        if cost > 10000:
            stats["province_stats"][prov].append(cost)
            stats["type_stats"][group].append(cost)
            count += 1

    benchmarks = {
        "generated_at": datetime.now().isoformat(),
        "provinces": {},
        "project_types": {}
    }

    for prov, costs in stats["province_stats"].items():
        benchmarks["provinces"][prov] = {
            "avg": sum(costs) / len(costs),
            "max": max(costs),
            "count": len(costs)
        }

    for ptype, costs in stats["type_stats"].items():
        benchmarks["project_types"][ptype] = {
            "avg": sum(costs) / len(costs),
            "max": max(costs)
        }

    with open(BENCHMARK_OUTPUT_FILE, 'w') as f:
        json.dump(benchmarks, f, indent=2)
    print(f"✓ Benchmarks generated based on {count} valid projects.")

# ============================================================================
# 7. REPORTING & MAIN
# ============================================================================


def save_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"✓ Data saved to: {filename}")


def main():
    try:
        print("=" * 80)
        print("FLOOD CONTROL PROJECT VALIDATOR (TIER 1)")
        print("=" * 80)

        # 1. Load Raw Data
        print(f"\nLoading raw project data from: {RAW_INPUT_FILE}")
        with open(RAW_INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_projects = json.load(f)

        # 2. Clean Data (Extract Lat/Long here!)
        projects = clean_projects(raw_projects)

        # 3. Validate & Flag
        flagged = validate_and_flag_projects(projects)

        # 4. Generate AI Benchmarks
        generate_system_benchmarks(projects)

        # 5. Save Outputs
        save_json(projects, CLEAN_OUTPUT_FILE)
        save_json(flagged, FLAGGED_OUTPUT_FILE)

        # 6. Stats
        print("\n" + "=" * 80)
        print(f"Total Projects: {len(projects):,}")
        print(f"Flagged: {len(flagged):,}")
        print("=" * 80)
        print("✓ VALIDATION COMPLETE")

    except FileNotFoundError:
        print(f"\n❌ Error: Could not find input file at {RAW_INPUT_FILE}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
