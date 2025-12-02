# flood_validator.py
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter

# Configuration
RAW_INPUT_FILE = "flood_control_raw_projects.json"
CLEAN_OUTPUT_FILE = "flood_projects.json"
FLAGGED_OUTPUT_FILE = "flood_flagged_projects.json"
CANDIDATES_FILE = "satellite_verification_candidates.json"

# ============================================================================
# KNOWN PROBLEMATIC CONTRACTORS FROM COA REPORTS
# ============================================================================

KNOWN_BAD_CONTRACTORS = {
    'SYMS CONSTRUCTION TRADING': {
        'reason': 'Fully-paid but non-existent or substandard flood-control works in Bulacan',
        'source': 'COA Bulacan fraud reports',
        'officer': 'Sally N. Santos',
        'severity': 'CRITICAL'
    },
    'M3 KONSTRUCT CORPORATION': {
        'reason': 'Projects built in wrong sites or having irregularities in Bulacan',
        'source': 'COA Bulacan audit findings',
        'associates': ['L.R. TIQUI BUILDERS INC.'],
        'severity': 'CRITICAL'
    },
    'WAWAO BUILDERS': {
        'reason': 'Flagged in COA Bulacan fraud findings for flood-mitigation projects',
        'source': 'COA Bulacan fraud reports',
        'officer': 'Mark Allan Arevalo',
        'severity': 'CRITICAL'
    },
    'ST. TIMOTHY CONSTRUCTION CORP.': {
        'reason': 'Serious discrepancies in Bulacan flood-control works',
        'source': 'COA audit reports',
        'severity': 'CRITICAL'
    },
    'ST. TIMOTHY CONSTRUCTION': {
        'reason': 'Serious discrepancies in Bulacan flood-control works',
        'source': 'COA audit reports',
        'severity': 'CRITICAL'
    },
    'AMETHYST HORIZON BUILDERS & GENERAL CONTRACTOR AND DEVELOPMENT CORP.': {
        'reason': 'Substandard or misplaced works in Bulacan projects',
        'source': 'COA Bulacan audit findings',
        'severity': 'CRITICAL'
    },
    'DARCY & ANNA BUILDERS & TRADING': {
        'reason': 'Implicated in flagged Bulacan flood-control projects',
        'source': 'COA reports',
        'severity': 'CRITICAL'
    },
    'L.R. TIQUI BUILDERS, INC.': {
        'reason': 'Named in flagged Bulacan works, associated with M3 Konstract JVs',
        'source': 'COA reports',
        'severity': 'CRITICAL'
    },
    'L.R. TIQUI BUILDERS INC.': {
        'reason': 'Named in flagged Bulacan works, associated with M3 Konstract JVs',
        'source': 'COA reports',
        'severity': 'CRITICAL'
    },
    'SBD BUILDERS INC.': {
        'reason': 'Expired licenses and bid issues in Cebu City Sports Center rehab',
        'source': 'COA Cebu City audit',
        'severity': 'HIGH'
    },
    'ADL GENERAL CONSTRUCTION': {
        'reason': 'Previously blacklisted firm (Mountain Province procurement issues)',
        'source': 'COA procurement audit',
        'severity': 'HIGH'
    },
    'TAWID BUILDERS CORP.': {
        'reason': 'Appeared in re-awarded contracts after ADL blacklisting',
        'source': 'COA procurement audit',
        'severity': 'MEDIUM'
    },
    'R.U. AQUINO CONSTRUCTION & DEVELOPMENT CORP.': {
        'reason': 'Conflict-of-interest concerns in COA new building contract',
        'source': 'COA building contract audit',
        'severity': 'MEDIUM'
    },
    'LE BRON CONSTRUCTION': {
        'reason': 'JV partner in flagged contract with conflict-of-interest concerns',
        'source': 'COA building contract audit',
        'severity': 'MEDIUM'
    },
    'TRIPLE 8 CONSTRUCTION': {
        'reason': 'Historical COA flag (verify source)',
        'source': 'COA reports (to be verified)',
        'severity': 'MEDIUM'
    },
    'TOPNOTCH CATALYST BUILDERS': {
        'reason': 'Historical COA flag (verify source)',
        'source': 'COA reports (to be verified)',
        'severity': 'MEDIUM'
    }
}

BAD_CONTRACTOR_NAMES = set(KNOWN_BAD_CONTRACTORS.keys())

PROBLEMATIC_LOCATIONS = {
    'Bulacan': 'High incidence of COA-flagged ghost projects and irregular flood-control works',
    'Quezon City': 'Multiple fraud cases documented',
    'Maguindanao': 'Audit findings show irregularities',
    'Cebu City': 'Sports center rehab irregularities flagged'
}


def normalize_contractor_name(name):
    if not name:
        return ''
    normalized = str(name).upper().strip()
    normalized = ' '.join(normalized.split())
    variations = [
        normalized,
        normalized.replace(',', ''),
        normalized.replace('.', ''),
        normalized.replace('&', 'AND'),
    ]
    return variations


def check_bad_contractor(contractor_name):
    if not contractor_name:
        return None
    variations = normalize_contractor_name(contractor_name)
    for variant in variations:
        if variant in BAD_CONTRACTOR_NAMES:
            return KNOWN_BAD_CONTRACTORS[variant]
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
        'contractor': bool(project.get('contractor') and project['contractor'].strip() not in ['', 'TBA', 'N/A', 'NONE']),
        'contract_cost': bool(project.get('contract_cost') and project['contract_cost'] > 0),
        'start_date': bool(project.get('start_date')),
        'completion_date': bool(project.get('completion_date')),
        'municipality': bool(project.get('municipality')),
        'province': bool(project.get('province')),
        'project_description': bool(project.get('project_description') and len(project['project_description'].strip()) >= 10)
    }
    completed = sum(critical_fields.values())
    total = len(critical_fields)

    # If less than 4 fields are present, consider it "Incomplete" (GREY)
    is_incomplete = completed < 4

    return {
        'score': round((completed / total) * 100, 1),
        'completed_fields': completed,
        'total_fields': total,
        'missing': [field for field, present in critical_fields.items() if not present],
        'is_incomplete': is_incomplete
    }


# ============================================================================
# UPDATED SCORING & FLAGGING ENGINE (Accumulative Logic)
# ============================================================================

def flag_project(project, all_projects):
    """
    Assigns specific weights to anomalies.
    Weights accumulate later in calculate_suspicion_score.
    """
    flags = []
    current_year = datetime.now().year
    contractor = (project.get('contractor') or '').strip()

    start_date = parse_date(project.get('start_date'))
    completion_date = parse_date(project.get('completion_date'))

    # 1. COA FLAGGED CONTRACTOR (+80)
    contractor_info = check_bad_contractor(contractor)
    if contractor_info:
        reason = f"Contractor flagged by COA: {contractor_info['reason']}"
        flags.append({
            'type': 'KNOWN_PROBLEMATIC_CONTRACTOR',
            'reason': reason,
            'source': contractor_info['source'],
            'field': 'contractor',
            'weight': 80
        })

    # 2. INVALID TIMELINE (+70)
    if start_date and completion_date and completion_date < start_date:
        flags.append({
            'type': 'INVALID_TIMELINE',
            'reason': f'Completion date is before start date',
            'field': 'dates',
            'weight': 70  # LOGIC: +70
        })

    # 3. NO CONTRACTOR (+50)
    # (Only flag if project year is present, to avoid flagging fresh empty rows)
    project_age_years = current_year - project.get('year', current_year)
    if (not contractor or contractor.strip() in ['', 'TBA', 'N/A', 'NONE']) and project_age_years >= 1:
        flags.append({
            'type': 'MISSING_CONTRACTOR',
            'reason': f'Project has no contractor on record',
            'field': 'contractor',
            'weight': 50  # LOGIC: +50
        })

    # 4. DUPLICATE CONTRACT ID (+40)
    if project.get('contract_id') and project['contract_id'].strip():
        contract_id = project['contract_id']
        duplicates = [p for p in all_projects if p.get(
            'contract_id') == contract_id]
        if len(duplicates) > 1:
            flags.append({
                'type': 'DUPLICATE_CONTRACT_ID',
                'reason': f'Contract ID "{contract_id}" appears {len(duplicates)} times',
                'field': 'contract_id',
                'duplicate_count': len(duplicates),
                'weight': 40  # LOGIC: +40
            })

    # 5. MISSING COST (+40)
    # Adding this as it's a critical accountability gap
    if not project.get('contract_cost') or project['contract_cost'] == 0:
        flags.append({
            'type': 'MISSING_COST',
            'reason': 'No contract cost recorded',
            'field': 'contract_cost',
            'weight': 40  # LOGIC: +40
        })

    # 6. MISSING LOCATION (+30)
    if not project.get('municipality') or not project.get('province'):
        flags.append({
            'type': 'INCOMPLETE_LOCATION',
            'reason': 'Missing location data',
            'field': 'location',
            'weight': 30  # LOGIC: +30
        })

    return flags


def calculate_suspicion_score(flags):
    """
    Sum up the weights of all flags. Cap at 100.
    """
    score = sum(flag.get('weight', 0) for flag in flags)
    return min(100, score)


def get_triage(score, is_incomplete_data):
    """
    Determines color based on Final Score Range.

    UPDATED PRIORITY:
    1. Score 80-100 -> RED (CRITICAL overrides everything)
    2. Incomplete Data -> GREY (If not critical, but data missing)
    3. Score 60-79 -> YELLOW
    4. Score 0-59 -> GREEN
    """

    # PRIORITY 1: CRITICAL RISK (Overrides missing data)
    if score >= 80:
        return {
            'color': 'RED',
            'rating': 'Critical Risk',
            'action': 'IMMEDIATE INVESTIGATION. Strong evidence of anomaly.',
            'priority': 1,
            'severity': 'CRITICAL'
        }

    # PRIORITY 2: INCOMPLETE DATA (Only if score is NOT critical)
    if is_incomplete_data:
        return {
            'color': 'GREY',
            'rating': 'Incomplete Data',
            'action': 'Data validation required.',
            'priority': 4,
            'severity': 'UNKNOWN'
        }

    # PRIORITY 3: HIGH RISK
    if score >= 60:
        return {
            'color': 'YELLOW',
            'rating': 'High Risk',
            'action': 'Priority investigation.',
            'priority': 2,
            'severity': 'HIGH'
        }

    # PRIORITY 4: LOW RISK
    return {
        'color': 'GREEN',
        'rating': 'Low Risk',
        'action': 'Continuous monitoring.',
        'priority': 3,
        'severity': 'LOW'
    }


def add_contextual_info(project):
    info = {}
    province = project.get('province', '')
    municipality = project.get('municipality', '')

    if province in PROBLEMATIC_LOCATIONS:
        info['location_note'] = f'{province}: {PROBLEMATIC_LOCATIONS[province]}'
        info['high_risk_location'] = True

    current_year = datetime.now().year
    project_year = project.get('year')
    if project_year:
        age = current_year - project_year
        info['project_age_years'] = age

    # --- FORCE MODE FOR PIPELINE STABILITY ---
    # If we have a location, we allow it into the Satellite stage
    if municipality and province and str(municipality).strip() and str(province).strip():
        info['satellite_eligible'] = True
        info['satellite_note'] = 'Eligible (Location Present)'
    else:
        info['satellite_eligible'] = False
        info['satellite_note'] = 'Missing Municipality or Province'

    return info


def clean_projects(raw_projects):
    print("\nCleaning project data...")
    cleaned = []
    for p in raw_projects:
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
        }
        if p.get('ContractCost'):
            try:
                cleaned_project['contract_cost'] = float(p['ContractCost'])
            except (ValueError, TypeError):
                pass
        cleaned.append(cleaned_project)
    return cleaned


def validate_and_flag_projects(projects):
    """
    Main Orchestration of Validation with DEBUG PRINTING
    """
    print("Analyzing projects with Accumulative Scoring Logic...")
    print("  > COA Flag: +80 | Invalid Time: +70 | No Contractor: +50")
    print("  > Duplicate ID: +40 | Missing Cost: +40 | Missing Loc: +30")

    flagged_projects = []
    debug_counter = 0  # Counter to show only first few examples

    for project in projects:
        # 1. Assess Data Completeness
        completeness = calculate_data_completeness(project)

        # 2. Identify Flags & Weights
        flags = flag_project(project, projects)

        # 3. Add Context (Location Checks)
        context = add_contextual_info(project)

        # 4. Calculate Final Score (Accumulative)
        suspicion_score = calculate_suspicion_score(flags)

        # 5. Determine Triage Color
        triage = get_triage(suspicion_score, completeness['is_incomplete'])

        if flags:
            flagged_projects.append({
                **project,
                'flags': flags,
                'flag_count': len(flags),
                'suspicion_score': suspicion_score,
                'max_severity': triage['severity'],
                'data_completeness': completeness,
                'color_triage': triage['color'],
                'triage_rating': triage['rating'],
                'triage_action': triage['action'],
                'triage_priority': triage['priority'],
                'contextual_info': context
            })

            # --- X-RAY VISION: PRINT THE MATH ---
            if debug_counter < 5:
                print("-" * 60)
                print(
                    f"🔍 DEBUGGING PROJECT: {project.get('project_description', 'Unknown')[:50]}...")

                # Create a string showing the math: "80 + 30"
                math_string = " + ".join([str(f['weight']) for f in flags])
                raw_sum = sum(f['weight'] for f in flags)

                print(f"   Flags Found: {[f['type'] for f in flags]}")
                print(f"   Math: {math_string} = {raw_sum}")
                print(f"   Final Score (Capped at 100): {suspicion_score}")
                print(f"   Result: {triage['color']}")
                debug_counter += 1
            # ------------------------------------

    print(
        f"\nFound {len(flagged_projects)} projects with flags or data issues")
    return flagged_projects


def get_satellite_candidates(flagged_projects):
    """
    Returns projects that have valid locations, regardless of score,
    so the Geocoding/Satellite pipeline always has data to work with.
    """
    candidates = []

    for p in flagged_projects:
        ctx = p.get('contextual_info', {})

        # Force Mode: If location exists, take it.
        if ctx.get('satellite_eligible', False):
            candidates.append(p)

    # Sort candidates: Higher score first, then higher cost
    candidates.sort(
        key=lambda x: (
            x.get('suspicion_score', 0) or 0,
            x.get('contract_cost', 0) or 0
        ),
        reverse=True
    )

    # Return up to 100 to avoid API limits
    return candidates[:100]


def get_coa_contractor_report(flagged_projects):
    """
    Generates report of projects matching the COA watchlist
    """
    coa_flagged = [
        p for p in flagged_projects
        if any(f['type'] == 'KNOWN_PROBLEMATIC_CONTRACTOR' for f in p['flags'])
    ]
    if not coa_flagged:
        return None

    by_contractor = defaultdict(list)
    for project in coa_flagged:
        contractor = project.get('contractor', 'Unknown').upper()
        by_contractor[contractor].append(project)

    report = {
        'total_projects': len(coa_flagged),
        'total_value': sum(p.get('contract_cost', 0) for p in coa_flagged),
        'unique_contractors': len(by_contractor),
        'contractors': []
    }

    for contractor, projects in by_contractor.items():
        contractor_info = check_bad_contractor(contractor)
        total_value = sum(p.get('contract_cost', 0) for p in projects)
        report['contractors'].append({
            'name': contractor,
            'coa_reason': contractor_info['reason'] if contractor_info else 'Unknown',
            'coa_source': contractor_info['source'] if contractor_info else 'Unknown',
            'project_count': len(projects),
            'total_value': total_value,
            'projects': [
                {
                    'project_id': p.get('project_id'),
                    'description': p.get('project_description', '')[:100],
                    'location': f"{p.get('municipality', 'N/A')}, {p.get('province', 'N/A')}",
                    'year': p.get('year'),
                    'cost': p.get('contract_cost', 0),
                    'suspicion_score': p.get('suspicion_score', 0)
                }
                for p in sorted(projects, key=lambda x: x.get('suspicion_score', 0), reverse=True)
            ]
        })

    report['contractors'].sort(key=lambda x: x['total_value'], reverse=True)
    return report


def save_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Data saved to: {filename}")


def print_statistics(projects, flagged):
    if not projects:
        return

    total_cost = sum(p.get('contract_cost', 0) or 0 for p in projects)
    print("\n" + "=" * 80)
    print("VALIDATION STATISTICS")
    print("=" * 80)
    print(f"Total Projects Analyzed: {len(projects):,}")
    print(f"Total Contract Value: ₱{total_cost:,.2f}")

    print("\nFLAGGED PROJECTS SUMMARY")
    print("=" * 80)
    flagged_count = len(flagged)
    print(f"Projects Flagged: {flagged_count:,}")

    if flagged:
        triage_counts = Counter(p['color_triage'] for p in flagged)
        print("\nBy Triage Rating:")
        print(f"  RED (Critical Risk):    {triage_counts.get('RED', 0):,}")
        print(f"  YELLOW (High Risk):     {triage_counts.get('YELLOW', 0):,}")
        print(f"  GREEN (Low Risk):       {triage_counts.get('GREEN', 0):,}")
        print(f"  GREY (Incomplete Data): {triage_counts.get('GREY', 0):,}")

        satellite_candidates = get_satellite_candidates(flagged)
        print(
            f"\nSatellite Verification Candidates (Location Present): {len(satellite_candidates):,} projects")
        if satellite_candidates:
            satellite_value = sum(p.get('contract_cost', 0)
                                  for p in satellite_candidates)
            print(f"Total Value for Verification: ₱{satellite_value:,.2f}")

    print("=" * 80)


def generate_summary_report(projects, flagged):
    coa_report = get_coa_contractor_report(flagged)
    triage_counts = Counter(p['color_triage'] for p in flagged)

    report = {
        'total_projects': len(projects),
        'total_contract_value': sum(p.get('contract_cost', 0) or 0 for p in projects),
        'flagged_projects': len(flagged),
        'triage_breakdown': dict(triage_counts),
        'satellite_candidates': len(get_satellite_candidates(flagged)),
        'accountability_gaps': {
            'missing_contractor': sum(1 for p in projects if not p.get('contractor') or not p['contractor'].strip()),
            'missing_location': sum(1 for p in projects if not p.get('municipality') or not p.get('province')),
            'missing_cost': sum(1 for p in projects if not p.get('contract_cost') or p['contract_cost'] == 0)
        },
        'coa_contractor_matches': coa_report
    }
    return report


def main():
    try:
        print("=" * 80)
        print("FLOOD CONTROL PROJECT VALIDATOR")
        print("With COA-Verified Contractor Blacklist & Accumulative Scoring")
        print("=" * 80)

        print("\nLoading raw project data...")
        with open(RAW_INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_projects = json.load(f)
        if not raw_projects:
            print("❌ No projects to validate.")
            return
        print(f"✓ Loaded {len(raw_projects):,} raw projects")

        projects = clean_projects(raw_projects)
        print(f"✓ Cleaned {len(projects):,} projects")

        flagged = validate_and_flag_projects(projects)

        flagged_sorted = sorted(
            flagged,
            key=lambda x: (
                x.get('triage_priority', 999),
                -x.get('suspicion_score', 0)
            )
        )

        satellite_candidates = get_satellite_candidates(flagged_sorted)
        coa_report = get_coa_contractor_report(flagged_sorted)

        print("\nSaving results...")
        save_json(projects, CLEAN_OUTPUT_FILE)
        save_json(flagged_sorted, FLAGGED_OUTPUT_FILE)

        # Save candidates to the specific filename required by geocode_candidates.py
        save_json(satellite_candidates, CANDIDATES_FILE)
        print(
            f"✓ Satellite candidates saved to: {CANDIDATES_FILE} ({len(satellite_candidates)} projects)"
        )

        if coa_report:
            save_json(coa_report, "coa_contractor_report.json")
            print("✓ COA contractor report saved to: coa_contractor_report.json")

        summary = generate_summary_report(projects, flagged)
        save_json(summary, "validation_summary.json")
        print("✓ Summary report saved to: validation_summary.json")

        print_statistics(projects, flagged)

        print("\n" + "=" * 80)
        print("✓ VALIDATION COMPLETE")
        print("=" * 80)

    except FileNotFoundError:
        print(f"\n❌ Error: Could not find '{RAW_INPUT_FILE}'")
        print("Make sure you've run the scraper first to generate raw project data.")
    except Exception as e:
        print(f"\n❌ Error during validation: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
