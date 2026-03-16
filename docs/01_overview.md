# 📡 System Overview & Architecture

## What This System Does

The **Lifeline SOS System** is an IoT emergency alert platform.
When a user presses the button on their LoRa wristwatch:

1. The hardware captures GPS coordinates (lat/lng)
2. Sends it via LoRa radio → to a LoRa receiver (connected to a PC/Raspberry Pi)
3. The receiver pushes the data to the FastAPI backend via HTTP POST
4. The backend saves the signal to the SQLite database
5. The backend broadcasts the coordinates via WebSocket to all connected frontend clients
6. The React frontend map updates the pin position in real time (every 5 sec refresh cycle)

---

## 🔗 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYER ✅ (Done)                  │
│                                                                  │
│   [Wristwatch Button]                                            │
│         │ pressed                                               │
│         ▼                                                       │
│   [GPS Module] ──── lat/lng ────▶ [LoRa Transmitter]            │
└──────────────────────────────────────┬──────────────────────────┘
                                       │ LoRa Radio Signal
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     RECEIVER LAYER (Bridge)                      │
│                                                                  │
│   [LoRa Receiver Module] ──── Serial/USB ────▶ [Python Script]  │
│                                                      │           │
│                                              HTTP POST           │
│                                         /api/sos/signal          │
└──────────────────────────────────────────────┬───────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER (FastAPI) 🔨 (To Build)         │
│                                                                  │
│   POST /api/sos/signal  ──▶  [Signal Handler]                    │
│                                    │                             │
│                          ┌─────────┼──────────┐                 │
│                          ▼         ▼          ▼                  │
│                    [Validate]  [Save to DB] [Broadcast WS]       │
│                                    │          │                  │
│                              [SQLite DB]  [WS Manager]           │
│                                              │                   │
│                          WS: /ws/sos/live    │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │ WebSocket
                                               │ (real-time stream)
                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER (React + Vite) 🔨 (To Build)    │
│                                                                  │
│   [Leaflet Map]  ◀──── WebSocket msg ──── [WS Client Hook]       │
│        │                                                         │
│   [Live Pin]  updates every 5 sec                                │
│   [Signal History Panel]  shows past signals                     │
│   [Alert Banner]  flashes on new SOS                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Responsibilities

| Component | Role | Status |
|---|---|---|
| Wristwatch Hardware | Captures GPS + sends LoRa signal on button press | ✅ Done |
| LoRa Receiver + Bridge Script | Receives radio signal, POSTs to backend | ✅ Done |
| FastAPI Backend | Validates, stores, and broadcasts signals | 🔨 To Build |
| SQLite Database | Persists all signals with timestamps | 🔨 To Build |
| WebSocket Manager | Manages live connections to frontend clients | 🔨 To Build |
| React + Leaflet Frontend | Shows live map with real-time pin updates | 🔨 To Build |

---

## 🔄 Real-Time Update Strategy

The system uses **WebSockets** (not polling) for real-time updates:

- Frontend connects to `ws://localhost:8000/ws/sos/live` on page load
- When hardware sends a new signal, backend pushes it to all WebSocket clients instantly
- Frontend also polls for latest coordinates every **5 seconds** as a fallback via REST
- This dual approach (WS push + REST fallback) ensures no missed updates

---

## 📍 What "Signal" Means

Each SOS signal contains:

| Field | Example | Description |
|---|---|---|
| `device_id` | `"WATCH-001"` | Unique hardware identifier |
| `latitude` | `28.6139` | GPS latitude |
| `longitude` | `77.2090` | GPS longitude |
| `timestamp` | `2026-03-16T22:00:00Z` | When signal was received |
| `status` | `"active"` | `active`, `resolved`, or `dismissed` |
| `battery_level` | `87` | Optional: battery % from hardware |
