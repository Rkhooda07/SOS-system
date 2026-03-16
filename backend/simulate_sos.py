"""
Run this to fake a hardware SOS signal. Useful for testing without real hardware.
Usage: python simulate_sos.py
"""
import httpx
import time
import random

BASE_URL = "http://localhost:8000"

def simulate():
    payload = {
        "device_id": "WATCH-001",
        "latitude":  28.6139 + random.uniform(-0.01, 0.01),  # Near New Delhi
        "longitude": 77.2090 + random.uniform(-0.01, 0.01),
        "battery":   random.randint(20, 100),
    }
    try:
        response = httpx.post(f"{BASE_URL}/api/sos/signal", json=payload)
        print(f"[{response.status_code}] Signal sent: {payload}")
        return response.json()
    except Exception as e:
        print(f"Error sending signal: {e}")

if __name__ == "__main__":
    print("Simulating SOS signals every 5 seconds. Press Ctrl+C to stop.")
    while True:
        simulate()
        time.sleep(5)
