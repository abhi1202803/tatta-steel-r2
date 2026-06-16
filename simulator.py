import time
import requests
import random
import datetime

EQUIPMENT_IDS = ["COMP-056", "MOTOR-050", "ROLL-048", "PUMP-028", "FAN-040"]

print("Starting real-time data simulator...")
while True:
    eq_id = random.choice(EQUIPMENT_IDS)
    payload = {
        "equipment_id": eq_id,
        "payload": {
            "sensor_data": {
                "temperature": round(random.uniform(40, 95), 2),
                "vibration": round(random.uniform(1.5, 6.0), 2),
                "pressure": round(random.uniform(4.5, 5.5), 2),
                "current": round(random.uniform(10, 15), 2),
                "rpm": round(random.uniform(1450, 1550), 2),
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        }
    }
    try:
        res = requests.post("http://127.0.0.1:8000/api/v1/ingest/sensor", json=payload, timeout=2)
        print(f"[{datetime.datetime.now().time()}] Ingested {eq_id}: {res.status_code}")
    except Exception as e:
        print(f"[{datetime.datetime.now().time()}] Error ingesting {eq_id}: {e}")
    
    time.sleep(3)
