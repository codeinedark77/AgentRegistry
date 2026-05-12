import json
import subprocess
import random
from datetime import datetime

# ==========================================
# DOMAIN 1: AGRICULTURAL MARKET & INTEL
# ==========================================

def fetch_live_crop_prices(crop_name: str, location: str = "National Average") -> str:
    """Simulates hitting an agricultural APMC market API with dynamic location variance."""
    print(f"[TOOL EXECUTED] Fetching prices for {crop_name} in {location}")
    
    base_prices = {"wheat": 240, "rice": 310, "corn": 185, "soybean": 420, "cotton": 850}
    price = base_prices.get(crop_name.lower(), 100)
    
    # Simulate dynamic market variance based on location!
    if "pune" in location.lower():
        price += 15  # Transport premium for Pune
    elif "mumbai" in location.lower():
        price += 25  # High demand premium for Mumbai
    elif "punjab" in location.lower():
        price -= 20  # Supply surplus discount
        
    return json.dumps({
        "crop": crop_name, 
        "location": location,
        "current_price": f"${price}/ton", 
        "market_status": "Live APMC Data"
    })

def get_weather_forecast(location: str) -> str:
    """Simulates fetching a 3-day agronomic weather forecast."""
    print(f"[TOOL EXECUTED] Fetching weather radar for: {location}")
    temps = [random.randint(22, 35) for _ in range(3)]
    conditions = random.choice(["Clear skies, optimal for spraying.", "Heavy rain expected, delay harvest.", "High humidity, monitor for blight."])
    return json.dumps({
        "location": location,
        "forecast_3_day": f"Day 1: {temps[0]}°C, Day 2: {temps[1]}°C, Day 3: {temps[2]}°C",
        "agronomic_advisory": conditions
    })

# ==========================================
# DOMAIN 2: AGRONOMY & EARTH OBSERVATION
# ==========================================

def analyze_soil_ph(ph_level: str) -> str:
    """Simulates passing sensor data to a diagnostic algorithm."""
    print(f"[TOOL EXECUTED] Analyzing soil pH: {ph_level}")
    try:
        ph = float(ph_level)
        if ph < 6.0: return json.dumps({"status": "Acidic", "recommendation": "Apply agricultural lime at 2 tons/acre."})
        if ph > 7.5: return json.dumps({"status": "Alkaline", "recommendation": "Apply elemental sulfur."})
        return json.dumps({"status": "Optimal", "recommendation": "No pH amendments needed."})
    except ValueError:
        return json.dumps({"error": "Invalid pH sensor reading. Requires float."})

def calculate_fertilizer_requirement(crop_name: str, acres: str) -> str:
    """Calculates NPK requirements using multiple parameters (kwargs proof)."""
    print(f"[TOOL EXECUTED] Calculating NPK for {acres} acres of {crop_name}")
    try:
        acreage = float(acres)
        return json.dumps({
            "crop": crop_name,
            "acres": acreage,
            "urea_required_kg": round(acreage * random.randint(40, 60), 2),
            "dap_required_kg": round(acreage * random.randint(20, 30), 2),
            "mop_required_kg": round(acreage * random.randint(10, 15), 2),
            "note": "Calculations based on standard baseline soil depletion rates."
        })
    except ValueError:
         return json.dumps({"error": "Invalid acreage. Must be a number."})

def diagnose_crop_disease(symptom: str) -> str:
    """Simulates an ML vision/text model diagnosing a plant issue."""
    print(f"[TOOL EXECUTED] Diagnosing symptom: {symptom}")
    if "yellow" in symptom.lower() or "pale" in symptom.lower():
        return json.dumps({"diagnosis": "Nitrogen Deficiency", "confidence": "89%", "action": "Apply urea top-dressing."})
    elif "spot" in symptom.lower() or "brown" in symptom.lower():
        return json.dumps({"diagnosis": "Fungal Blight", "confidence": "75%", "action": "Apply broad-spectrum fungicide."})
    return json.dumps({"diagnosis": "Unknown", "confidence": "Low", "action": "Send physical sample to lab."})

def analyze_satellite_imagery(region: str, anomaly_type: str = "NDVI") -> str:
    """Simulates querying Copernicus or NASA FIRMS satellite data streams."""
    print(f"[TOOL EXECUTED] Querying satellite data for {anomaly_type} in {region}...")
    anomalies = {
        "fire": "Thermal anomaly detected (Confidence: 87%). Potential stubble burning.",
        "ndvi": "NDVI vegetation index is 0.42 (Below average). Significant water stress indicated.",
        "moisture": "Soil moisture index optimal at 35%."
    }
    # Default to NDVI if anomaly_type is something weird
    result = anomalies.get(anomaly_type.lower(), anomalies["ndvi"])
    return json.dumps({
        "region": region,
        "scan_type": anomaly_type.upper(),
        "satellite_status": result,
        "source": "NASA FIRMS / Copernicus SIM",
        "timestamp": datetime.now().isoformat()
    })

# ==========================================
# DOMAIN 3: OS & SYSTEM ADMINISTRATION
# ==========================================

def check_system_ram(*args, **kwargs) -> str:
    """Executes 'free -h' to get real-time OS memory stats."""
    print("[TOOL EXECUTED] Checking System RAM via host OS...")
    try:
        result = subprocess.run(["free", "-h"], capture_output=True, text=True, check=True)
        return json.dumps({
            "status": "success",
            "os_output": result.stdout,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

def execute_system_ping(target_url: str) -> str:
    """Executes an OS-level ping to check network latency."""
    print(f"[TOOL EXECUTED] Pinging target network: {target_url}")
    try:
        result = subprocess.run(["ping", "-c", "3", target_url], capture_output=True, text=True, check=True)
        return json.dumps({"status": "success", "ping_stats": result.stdout[-150:]}) 
    except Exception as e:
        return json.dumps({"status": "error", "message": f"Ping failed: {str(e)}"})

def check_docker_containers(*args, **kwargs) -> str:
    """Executes 'docker ps' to verify microservice health."""
    print("[TOOL EXECUTED] Interfacing with Docker daemon...")
    try:
        result = subprocess.run(["docker", "ps", "--format", "{{.Names}} - {{.Status}}"], capture_output=True, text=True, check=True)
        output = result.stdout.strip()
        if not output:
            output = "No containers currently running."
        return json.dumps({
            "status": "success",
            "running_services": output.split('\n')
        })
    except Exception as e:
        return json.dumps({"status": "error", "message": "Docker daemon not reachable or permission denied."})

# ==========================================
# THE REGISTRY (MUST MAP EXACTLY TO FUNCTION NAMES)
# ==========================================
AVAILABLE_TOOLS = {
    "fetch_live_crop_prices": fetch_live_crop_prices,
    "get_weather_forecast": get_weather_forecast,
    "analyze_soil_ph": analyze_soil_ph,
    "calculate_fertilizer_requirement": calculate_fertilizer_requirement,
    "diagnose_crop_disease": diagnose_crop_disease,
    "analyze_satellite_imagery": analyze_satellite_imagery,
    "check_system_ram": check_system_ram,
    "execute_system_ping": execute_system_ping,
    "check_docker_containers": check_docker_containers
}