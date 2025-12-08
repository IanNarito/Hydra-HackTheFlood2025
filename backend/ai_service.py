import google.generativeai as genai
import json
import re
import os

# ============================================================
# AI CONFIGURATION
# ============================================================
# ⚠️ PASTE YOUR KEY HERE ⚠️
GENAI_API_KEY = "AIzaSyDcU0Yo4vaH0ce1marAuNcKD4NYf1R-rDU"
VALID_AI_MODELS = []
AI_AVAILABLE = False

# Path to the "Brain" created by validator.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARK_FILE = os.path.join(BASE_DIR, 'Datas', 'system_benchmarks.json')


def init_ai():
    """Initializes the AI connection and scans for models."""
    global AI_AVAILABLE, VALID_AI_MODELS
    try:
        genai.configure(api_key=GENAI_API_KEY)
        print("🤖 AI Neural Core: ONLINE")

        # --- STARTUP: CHECK WHICH MODELS ACTUALLY WORK ---
        print("🔍 Scanning for available AI models...")
        found_models = []
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    if 'gemini' in m.name:
                        found_models.append(m.name)

            found_models.sort(key=lambda x: 'flash' not in x)
            VALID_AI_MODELS = found_models
            print(
                f"✅ Auto-Detected {len(VALID_AI_MODELS)} working models: {VALID_AI_MODELS}")
            AI_AVAILABLE = True
        except Exception as e:
            print(f"⚠️ Model Scan Failed (using defaults): {e}")
            VALID_AI_MODELS = ['models/gemini-pro', 'gemini-pro']
            AI_AVAILABLE = True

    except Exception as e:
        print(f"⚠️ AI Config Error: {e}")
        AI_AVAILABLE = False


# Initialize on module import
init_ai()

# ============================================================
# HELPERS (THE FIX FOR DROPBOX & MAPS)
# ============================================================


def clean_ai_json(text):
    """
    Extracts JSON object OR array from markdown text.
    Fixes the bug where Dropbox returns 0% because it couldn't find a List.
    """
    # Look for either {...} OR [...]
    match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
    if match:
        return match.group(0)
    return "{}"  # Return empty object by default so it doesn't crash


def load_benchmarks():
    """Loads the Cheat Sheet created by Validator.py"""
    if not os.path.exists(BENCHMARK_FILE):
        return None
    try:
        with open(BENCHMARK_FILE, 'r') as f:
            return json.load(f)
    except:
        return None


def determine_project_type(desc):
    """Maps description to benchmark categories"""
    d = str(desc).upper()
    if "ROAD" in d or "CONCRETE" in d:
        return "ROADS"
    if "FLOOD" in d or "RIVER" in d or "DIKE" in d:
        return "FLOOD_CONTROL"
    if "BUILDING" in d or "HALL" in d or "SCHOOL" in d:
        return "BUILDINGS"
    if "LIGHT" in d or "SOLAR" in d:
        return "STREET_LIGHTS"
    return "OTHERS"


# ============================================================
# 1. TAGALOG CHATBOT (STRICT & DIRECT)
# ============================================================

def get_chat_response(system_context, user_message):
    if not AI_AVAILABLE:
        return "Pasensya na, offline ang system."

    full_prompt = f"""
    ROLE: Ikaw si HYDRA, isang database search assistant.
    HAWAK MONG DATOS (Reference Only - HUWAG SABIHIN AGAD):
    {system_context}
    USER QUESTION: "{user_message}"
    
    STRICT RULES:
    1. DIREKTA SA PUNTO. Bawal ang intro "Ako si Hydra".
    2. SAGUTIN LANG ANG TINATANONG.
    3. LANGUAGE: Tagalog na pang-masa. Simple.
    4. HUWAG MAG-IMBENTO. Kung wala sa datos, sabihin "Wala sa record".
    
    IYONG SAGOT (TAGALOG):
    """

    for model_name in VALID_AI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            res = model.generate_content(full_prompt)
            # Remove bolding asterisks so it looks clean
            return res.text.replace('**', '').replace('##', '').strip()
        except:
            continue
    return "Mahina ang signal. Pakisubukan ulit."


# ============================================================
# 2. SENIOR ANALYST (MAPS & AUDIT)
# ============================================================

def analyze_project_with_facts(project_data):
    """
    Tier 2 Analysis: Compares project against Province Averages.
    """
    if not AI_AVAILABLE:
        return None
    benchmarks = load_benchmarks()

    pid = project_data.get('project_id')
    desc = project_data.get('project_description')
    cost = float(project_data.get('contract_cost') or 0)
    province = str(project_data.get('province', 'Unknown')).strip().upper()
    contractor = project_data.get('contractor', 'N/A')

    prov_stats = {'avg': 0, 'max': 0}
    type_stats = {'avg': 0}

    if benchmarks:
        prov_stats = benchmarks['provinces'].get(
            province, {'avg': 0, 'max': 0})
        p_type = determine_project_type(desc)
        type_stats = benchmarks['project_types'].get(p_type, {'avg': 0})

    prompt = f"""
    ROLE: Senior Data Analyst.
    STATS: {province} Avg: {prov_stats.get('avg', 0)}. Type Avg: {type_stats.get('avg', 0)}.
    PROJECT: {desc} | Cost: {cost}.
    TASK: Detect Overpricing.
    OUTPUT FORMAT: JSON List [...].
    """

    for model_name in VALID_AI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and hasattr(response, 'text'):
                return json.loads(clean_ai_json(response.text))
        except:
            continue
    return None


# ============================================================
# 3. EVIDENCE MODERATOR (DROPBOX FIX)
# ============================================================

def analyze_evidence(description, filenames):
    """
    Analyzes a user report to see if it's junk, troll, or credible.
    """
    if not AI_AVAILABLE:
        # Default mid-score if AI is dead
        return {"credibility_score": 50, "verdict": "REVIEW", "reason": "AI Offline"}

    # Spam filter
    if len(description) < 5:
        return {"credibility_score": 10, "verdict": "DELETE", "reason": "Too short."}

    prompt = f"""
    ROLE: Content Moderator.
    TASK: Analyze if report is CREDIBLE, SPAM, or TROLL.
    
    REPORT: "{description}"
    FILES: {filenames}
    
    RULES:
    - Gibberish = DELETE.
    - Specific details = PUBLISH.
    - Vague = REVIEW.
    
    OUTPUT JSON FORMAT (Do not use Markdown blocks):
    {{
        "credibility_score": (Integer 0-100),
        "verdict": "PUBLISH" or "REVIEW" or "DELETE",
        "reason": "Short explanation"
    }}
    """

    for model_name in VALID_AI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and hasattr(response, 'text'):
                data = json.loads(clean_ai_json(response.text))
                return data
        except Exception as e:
            print(f"Error: {e}")
            continue

    return {"credibility_score": 50, "verdict": "REVIEW", "reason": "Analysis Error"}


# ============================================================
# 4. LEGACY: PARANOID MODE (KEPT FOR SAFETY)
# ============================================================

def perform_audit_batch(batch_data):
    """
    (Legacy) Analyzes a list of projects for fraud risk without Cheat Sheet.
    Kept here so your old code doesn't break if you call it.
    """
    if not AI_AVAILABLE:
        raise Exception("AI Core is offline.")
    system_instruction = f"""
    You are HYDRA. INPUT: {json.dumps(batch_data, indent=2)}
    RULES: High scores stay high. Penalize vague names.
    OUTPUT FORMAT: Raw JSON List.
    """
    for model_name in VALID_AI_MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(system_instruction)
            if response and hasattr(response, 'text'):
                return json.loads(clean_ai_json(response.text))
        except:
            continue
    raise Exception("AI failed.")
