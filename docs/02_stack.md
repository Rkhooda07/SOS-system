# 🛠️ Tech Stack — Lifeline SOS System

## Why FastAPI over Node/Express?

| Feature | FastAPI (Python) | Node/Express |
|---|---|---|
| Speed | Async, ASGI — comparable to Node | Event-loop based |
| Type Safety | Pydantic validation built-in | Manual or use Zod/Joi |
| Docs | Auto Swagger UI at `/docs` | Manual setup |
| WebSocket | Native support via Starlette | `ws` or `socket.io` |
| IoT/Hardware | Python ecosystem (serial, pyserial, etc.) | Limited |
| Familiarity | ✅ Already in the repo | Would be a switch |

**Decision: FastAPI** — already in the existing repo, Python is the natural fit for IoT/hardware interfacing, and async/ASGI gives real-time WebSocket performance.

---

## Full Stack

### 🐍 Backend

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | `>=0.110` | Web framework |
| `uvicorn[standard]` | `>=0.29` | ASGI server (runs FastAPI) |
| `sqlalchemy` | `>=2.0` | ORM for database |
| `aiosqlite` | `>=0.20` | Async SQLite driver |
| `pydantic` | `>=2.0` | Request/response validation |
| `pydantic-settings` | `>=2.0` | `.env` config management |
| `python-dotenv` | `>=1.0` | Load `.env` file |
| `websockets` | `>=12.0` | WebSocket protocol support |
| `httpx` | `>=0.27` | For testing HTTP endpoints |
| `pytest` | `>=8.0` | Test runner |
| `pytest-asyncio` | `>=0.23` | Async test support |

### 🗄️ Database

| Choice | Why |
|---|---|
| **SQLite** (primary) | Zero setup, file-based, perfect for a single-device SOS system. Already in the repo (`sql_app.db`). |
| **PostgreSQL** (optional upgrade) | If you scale to multiple devices or cloud deploy later, swap easily due to SQLAlchemy abstraction |

> SQLite is the right call here. No Docker, no DB server, no config — just a file. You can always migrate later.

### ⚛️ Frontend

| Package | Version | Purpose |
|---|---|---|
| `react` | `>=18` | UI framework |
| `vite` | `>=5` | Dev server + bundler |
| `react-leaflet` | `>=4` | Map component wrapper |
| `leaflet` | `>=1.9` | Actual map library (OpenStreetMap tiles — free) |
| `axios` | `>=1.6` | HTTP client for REST fallback |
| `date-fns` | `>=3` | Timestamp formatting |

> **Why Leaflet over Google Maps?** — Leaflet + OpenStreetMap is 100% free, no API key needed, and fully open source. Perfect for an IoT project.

### 🧰 Dev Tools

| Tool | Purpose |
|---|---|
| `python-venv` | Python virtual environment isolation |
| `.env` file | Environment config (port, DB path, etc.) |
| `uvicorn --reload` | Hot-reload during development |
| FastAPI `/docs` | Built-in Swagger UI for testing endpoints |
| `simulate_sos.py` | Script to fake hardware signals for testing (already in repo) |

---

## Environment Variables (`.env`)

```env
# Backend
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./sos.db
CORS_ORIGINS=http://localhost:5173

# Optional
DEBUG=true
LOG_LEVEL=info
```

---

## Port Map

| Service | Port | URL |
|---|---|---|
| FastAPI Backend | `8000` | `http://localhost:8000` |
| Swagger UI | `8000` | `http://localhost:8000/docs` |
| WebSocket | `8000` | `ws://localhost:8000/ws/sos/live` |
| React Frontend | `5173` | `http://localhost:5173` |
