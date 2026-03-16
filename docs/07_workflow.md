# 🔧 Development Workflow — Lifeline SOS System

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | >= 3.11 | `brew install python@3.11` |
| Node.js | >= 20 | `brew install node` |
| npm | >= 10 | Comes with Node |
| Git | Any | `brew install git` |

---

## 🚀 First-Time Setup

### 1. Clone / Open the Project

```bash
cd "SOS system IOT"
```

### 2. Set Up Backend

```bash
# Create virtual environment (one time only)
python3 -m venv .venv
source .venv/bin/activate

# Install all dependencies
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the template
cp .env.example .env

# .env contents (edit if needed)
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./sos.db
CORS_ORIGINS=http://localhost:5173
DEBUG=true
```

### 4. Set Up Frontend

```bash
# From project root
cd frontend
npm install
```

---

## ▶️ Running Locally (Every Session)

You'll need **two terminal windows** open simultaneously:

### Terminal 1 — Backend

```bash
# From project root
source .venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Frontend

```bash
# From project root
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.x.x.x:5173/
```

---

## 🌐 Access Points

| Service | URL | Notes |
|---|---|---|
| Frontend UI | `http://localhost:5173` | React app with live map |
| Backend API | `http://localhost:8000` | FastAPI server |
| Swagger Docs | `http://localhost:8000/docs` | Interactive API testing |
| ReDoc | `http://localhost:8000/redoc` | Alternative API docs |
| WebSocket | `ws://localhost:8000/ws/sos/live` | Real-time stream |
| From LAN devices | `http://YOUR_LOCAL_IP:5173` | Replace with `ipconfig getifaddr en0` |

---

## 🧪 Testing Without Hardware

### Option A — Swagger UI (easiest)

1. Open `http://localhost:8000/docs`
2. Click `POST /api/sos/signal` → **Try it out**
3. Paste this in the request body:
```json
{
  "device_id": "WATCH-001",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "battery": 87
}
```
4. Click **Execute**
5. Switch to frontend tab — map pin should update instantly!

### Option B — simulate_sos.py (continuous)

```bash
# Open a third terminal
source .venv/bin/activate
cd backend
python simulate_sos.py
```

This sends a new signal every 5 seconds with slight GPS coordinate drift.
Watch the map pin move in real time.

### Option C — curl (command line)

```bash
curl -X POST http://localhost:8000/api/sos/signal \
  -H "Content-Type: application/json" \
  -d '{"device_id": "WATCH-001", "latitude": 28.6139, "longitude": 77.2090, "battery": 87}'
```

---

## 🔌 Hardware Integration

When your real hardware is ready, the **LoRa bridge script** on the receiver side should POST to:

```
POST http://<YOUR_LOCAL_IP>:8000/api/sos/signal
Content-Type: application/json

{
  "device_id":  "WATCH-001",
  "latitude":   <gps_lat>,
  "longitude":  <gps_lng>,
  "battery":    <battery_percent>
}
```

The bridge script (Python, runs on the LoRa receiver PC) should look like:

```python
import serial
import httpx
import json

SERIAL_PORT = "/dev/tty.usbserial-0001"  # adjust for your system
BACKEND_URL = "http://192.168.1.100:8000"  # your backend machine's LAN IP

def parse_lora_message(raw: str) -> dict:
    """Parse GPS data from LoRa serial message.
    Adjust this parsing logic to match your hardware's output format."""
    parts = raw.strip().split(",")
    return {
        "device_id": "WATCH-001",
        "latitude":  float(parts[0]),
        "longitude": float(parts[1]),
        "battery":   int(parts[2]) if len(parts) > 2 else None,
    }

def main():
    with serial.Serial(SERIAL_PORT, 9600, timeout=1) as ser:
        print(f"Listening on {SERIAL_PORT}...")
        while True:
            line = ser.readline().decode("utf-8", errors="ignore")
            if line:
                try:
                    payload = parse_lora_message(line)
                    response = httpx.post(f"{BACKEND_URL}/api/sos/signal", json=payload)
                    print(f"[{response.status_code}] Sent: {payload}")
                except Exception as e:
                    print(f"Error: {e}")

if __name__ == "__main__":
    main()
```

> 📦 Install: `pip install pyserial httpx`

---

## 🗑️ Resetting the Database

```bash
# Delete SQLite DB and let the backend recreate it on next start
rm backend/sos.db
```

---

## 📊 Check Database Contents

```bash
# Quick view of all stored signals
sqlite3 backend/sos.db "SELECT * FROM signals ORDER BY received_at DESC LIMIT 10;"
```

---

## 🏗️ Build Order (When Building from Scratch)

Follow this sequence to avoid confusion:

```
Phase 1 — Backend Core
  □ Step 1:  venv + requirements.txt
  □ Step 2:  app/config.py
  □ Step 3:  app/database.py
  □ Step 4:  app/models/signal.py
  □ Step 5:  app/schemas/signal.py
  □ Step 6:  app/core/ws_manager.py
  □ Step 7:  app/services/signal_service.py
  □ Step 8:  app/routes/signals.py
  □ Step 9:  app/routes/websocket.py
  □ Step 10: app/main.py
  □ Step 11: .env + .env.example

Phase 2 — Frontend
  □ npm create vite frontend
  □ npm install react-leaflet leaflet axios date-fns
  □ vite.config.js (proxy)
  □ index.css (dark theme)
  □ hooks/useSOSWebSocket.js
  □ hooks/useSignalHistory.js
  □ components/MapView.jsx
  □ components/AlertBanner.jsx
  □ components/SignalHistory.jsx
  □ components/DeviceStatus.jsx
  □ components/ConnectionBadge.jsx
  □ App.jsx

Phase 3 — Testing
  □ Run backend: uvicorn app.main:app --reload
  □ Run frontend: npm run dev
  □ Test via Swagger UI or simulate_sos.py
  □ Verify map updates in real time
  □ Verify WS reconnect on backend restart

Phase 4 — Hardware Integration
  □ Find your LoRa bridge script format
  □ Update parse_lora_message() to match output
  □ Point BACKEND_URL to backend machine's LAN IP
  □ Test end-to-end with real button press
```

---

## 🔥 Common Issues & Fixes

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'app'` | Run uvicorn from the `backend/` folder, not `app/` |
| CORS error in browser | Check `CORS_ORIGINS` in `.env` matches Vite port |
| Map not showing | Check if `leaflet/dist/leaflet.css` is imported in MapView |
| WebSocket not connecting | Make sure backend is running on port 8000 |
| Pin not updating | Open browser console — check for WS messages |
| SQLite `no such table` | DB not initialized — restart backend to trigger `init_db()` |
