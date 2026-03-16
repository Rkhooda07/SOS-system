# 📡 API Reference — Lifeline SOS Backend

Base URL: `http://localhost:8000`
Interactive Docs: `http://localhost:8000/docs` (Swagger UI, auto-generated)

---

## REST Endpoints

### `GET /health`
Health check — confirms the backend is running.

**Response:**
```json
{ "status": "ok", "service": "Lifeline SOS Backend" }
```

---

### `POST /api/sos/signal` ⭐ Core Endpoint

Called by the **LoRa bridge script** when the wristwatch button is pressed.
Saves the signal to the database and **immediately broadcasts to all WebSocket clients**.

**Request Body:**
```json
{
  "device_id":  "WATCH-001",
  "latitude":   28.6139,
  "longitude":  77.2090,
  "battery":    87
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `device_id` | string | ✅ | Any string identifier |
| `latitude` | float | ✅ | -90 to 90 |
| `longitude` | float | ✅ | -180 to 180 |
| `battery` | integer | ❌ | 0 to 100 |

**Success Response (201 Created):**
```json
{
  "id":          1,
  "device_id":   "WATCH-001",
  "latitude":    28.6139,
  "longitude":   77.2090,
  "status":      "active",
  "battery":     87,
  "received_at": "2026-03-16T22:00:00.000Z"
}
```

**Error Responses:**
```json
// 422 Unprocessable Entity — bad coordinates
{
  "detail": [
    { "loc": ["body", "latitude"], "msg": "Input should be less than or equal to 90" }
  ]
}
```

---

### `GET /api/sos/signals`

Returns the last N signals — used by the frontend history panel.

**Query Params:**

| Param | Default | Description |
|---|---|---|
| `limit` | 50 | Number of signals to return |

**Example:** `GET /api/sos/signals?limit=20`

**Response (200 OK):**
```json
[
  {
    "id": 3,
    "device_id": "WATCH-001",
    "latitude": 28.6145,
    "longitude": 77.2096,
    "status": "active",
    "battery": 85,
    "received_at": "2026-03-16T22:00:10Z"
  },
  {
    "id": 2,
    "device_id": "WATCH-001",
    "latitude": 28.6142,
    "longitude": 77.2093,
    "status": "active",
    "battery": 86,
    "received_at": "2026-03-16T22:00:05Z"
  }
]
```

---

### `GET /api/sos/latest/{device_id}`

Returns the **most recent signal** for a device.
Used by the frontend as a **REST fallback** (polls every 5 seconds).

**Example:** `GET /api/sos/latest/WATCH-001`

**Response (200 OK):**
```json
{
  "id": 3,
  "device_id": "WATCH-001",
  "latitude": 28.6145,
  "longitude": 77.2096,
  "status": "active",
  "battery": 85,
  "received_at": "2026-03-16T22:00:10Z"
}
```

**Response (404 Not Found):**
```json
{ "detail": "No signal found for device" }
```

---

## WebSocket

### `WS /ws/sos/live` ⭐ Real-Time Stream

The frontend connects here on page load. The backend **pushes** JSON whenever a new signal arrives.
No messages need to be sent from the client — just connect and listen.

**Connection URL:**
```
ws://localhost:8000/ws/sos/live
```

**Message pushed on each new SOS signal:**
```json
{
  "event":      "sos_signal",
  "id":          4,
  "device_id":  "WATCH-001",
  "latitude":   28.6148,
  "longitude":  77.2099,
  "status":     "active",
  "battery":    84,
  "received_at": "2026-03-16T22:00:15.000Z"
}
```

**Frontend JavaScript to consume:**
```javascript
const ws = new WebSocket("ws://localhost:8000/ws/sos/live");

ws.onopen = () => console.log("Connected to SOS stream");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === "sos_signal") {
    // Update map pin with data.latitude, data.longitude
    updateMapPin(data.latitude, data.longitude);
  }
};

ws.onclose = () => {
  console.warn("WebSocket closed — will retry in 5s");
  setTimeout(connectWebSocket, 5000);  // auto-reconnect
};
```

---

## Data Flow: Hardware → API → Frontend

```
[Hardware Button Press]
       │
       ▼ HTTP POST
POST /api/sos/signal
  { device_id, latitude, longitude, battery }
       │
       ├──── Save to SQLite (signals table)
       │
       └──── Broadcast via WebSocket to ALL connected clients
                  │
                  ▼ ws://localhost:8000/ws/sos/live
             { event: "sos_signal", latitude, longitude, ... }
                  │
                  ▼
           [React Frontend]
           Updates map pin instantly
```

---

## Testing Endpoints with Swagger

1. Start backend: `uvicorn app.main:app --reload`
2. Open: `http://localhost:8000/docs`
3. Click `POST /api/sos/signal` → **Try it out** → paste sample JSON → Execute
4. Watch the frontend map update in real time
