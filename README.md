# 🚨 Lifeline — SOS IoT Real-Time Tracking System

> A FastAPI-powered backend that receives SOS signals from LoRa-based wristwatch hardware,
> stores them in a database, and streams GPS coordinates to a live map on the frontend in real time.

---

## 📁 Project Layout

```
SOS system IOT/
├── README.md                  ← You are here
├── docs/
│   ├── 01_overview.md         ← System overview & architecture
│   ├── 02_stack.md            ← Full tech stack with justifications
│   ├── 03_backend_plan.md     ← Backend implementation plan (step-by-step)
│   ├── 04_database_schema.md  ← Database design & schema
│   ├── 05_api_reference.md    ← All API endpoints + WebSocket protocol
│   ├── 06_frontend_plan.md    ← Frontend map UI implementation plan
│   └── 07_workflow.md         ← Dev workflow, run commands, testing
├── backend/                   ← FastAPI backend (to be built)
└── frontend/                  ← React + Vite frontend (to be built)
```

## 🔑 Quick Links

| Document | Purpose |
|---|---|
| [01_overview.md](docs/01_overview.md) | Big picture — how everything connects |
| [02_stack.md](docs/02_stack.md) | Tech stack choices with reasons |
| [03_backend_plan.md](docs/03_backend_plan.md) | Step-by-step backend build plan |
| [04_database_schema.md](docs/04_database_schema.md) | DB schema, models, migrations |
| [05_api_reference.md](docs/05_api_reference.md) | REST + WebSocket API reference |
| [06_frontend_plan.md](docs/06_frontend_plan.md) | Frontend map UI build plan |
| [07_workflow.md](docs/07_workflow.md) | Running everything locally |

## ⚡ TL;DR — What gets built

1. **Hardware** (already done ✅) — LoRa wristwatch presses button → sends GPS via serial/HTTP
2. **FastAPI Backend** — Receives signal, saves to DB, broadcasts via WebSocket
3. **SQLite DB** — Stores signals (device_id, lat, lng, timestamp, status)
4. **React Frontend** — Leaflet map shows live pin, updates every 5 sec via WebSocket
