# 🔨 Backend Implementation Plan — Step by Step

## Project Structure to Create

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              ← FastAPI app entry point, CORS, startup
│   ├── config.py            ← Pydantic settings from .env
│   ├── database.py          ← SQLAlchemy async engine + session
│   ├── models/
│   │   ├── __init__.py
│   │   └── signal.py        ← SQLAlchemy Signal ORM model
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── signal.py        ← Pydantic schemas (request/response)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── signals.py       ← REST endpoints (POST signal, GET history)
│   │   └── websocket.py     ← WebSocket endpoint
│   ├── services/
│   │   ├── __init__.py
│   │   └── signal_service.py ← Business logic (save, fetch, broadcast)
│   └── core/
│       ├── __init__.py
│       └── ws_manager.py    ← WebSocket connection manager
├── .env                     ← Environment variables
├── .env.example             ← Template for .env
├── requirements.txt         ← Python dependencies
└── simulate_sos.py          ← Test script to fake hardware signals
```

---

## Step 1 — Set Up Python Virtual Environment

```bash
# Inside the SOS system IOT folder
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

cd backend
pip install fastapi "uvicorn[standard]" sqlalchemy aiosqlite pydantic pydantic-settings python-dotenv websockets httpx pytest pytest-asyncio
pip freeze > requirements.txt
```

---

## Step 2 — Config & Environment (`app/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    database_url: str = "sqlite+aiosqlite:///./sos.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Step 3 — Database Engine (`app/database.py`)

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.database_url, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

---

## Step 4 — Database Model (`app/models/signal.py`)

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base

class Signal(Base):
    __tablename__ = "signals"

    id          = Column(Integer, primary_key=True, index=True)
    device_id   = Column(String, index=True, nullable=False)
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)
    status      = Column(String, default="active")   # active | resolved | dismissed
    battery     = Column(Integer, nullable=True)     # battery % from device
    received_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## Step 5 — Pydantic Schemas (`app/schemas/signal.py`)

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# What the hardware/bridge sends to POST /api/sos/signal
class SignalCreate(BaseModel):
    device_id:  str
    latitude:   float = Field(..., ge=-90,  le=90)
    longitude:  float = Field(..., ge=-180, le=180)
    battery:    Optional[int] = Field(None, ge=0, le=100)

# What we send back in responses
class SignalResponse(BaseModel):
    id:          int
    device_id:   str
    latitude:    float
    longitude:   float
    status:      str
    battery:     Optional[int]
    received_at: datetime

    model_config = {"from_attributes": True}

# Minimal payload pushed over WebSocket
class SignalWSPayload(BaseModel):
    id:          int
    device_id:   str
    latitude:    float
    longitude:   float
    status:      str
    received_at: str   # ISO string for JSON serialization
```

---

## Step 6 — WebSocket Manager (`app/core/ws_manager.py`)

```python
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Push JSON payload to ALL connected frontend clients."""
        message = json.dumps(data)
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

ws_manager = ConnectionManager()   # singleton
```

---

## Step 7 — Signal Service (`app/services/signal_service.py`)

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.signal import Signal
from app.schemas.signal import SignalCreate
from app.core.ws_manager import ws_manager

async def save_signal(db: AsyncSession, payload: SignalCreate) -> Signal:
    signal = Signal(**payload.model_dump())
    db.add(signal)
    await db.commit()
    await db.refresh(signal)
    return signal

async def broadcast_signal(signal: Signal):
    """After saving, push to all WebSocket clients."""
    await ws_manager.broadcast({
        "event":      "sos_signal",
        "id":         signal.id,
        "device_id":  signal.device_id,
        "latitude":   signal.latitude,
        "longitude":  signal.longitude,
        "status":     signal.status,
        "battery":    signal.battery,
        "received_at": signal.received_at.isoformat(),
    })

async def get_signals(db: AsyncSession, limit: int = 50) -> list[Signal]:
    result = await db.execute(
        select(Signal).order_by(desc(Signal.received_at)).limit(limit)
    )
    return result.scalars().all()

async def get_latest_signal(db: AsyncSession, device_id: str) -> Signal | None:
    result = await db.execute(
        select(Signal)
        .where(Signal.device_id == device_id)
        .order_by(desc(Signal.received_at))
        .limit(1)
    )
    return result.scalar_one_or_none()
```

---

## Step 8 — REST Routes (`app/routes/signals.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.signal import SignalCreate, SignalResponse
from app.services.signal_service import save_signal, broadcast_signal, get_signals, get_latest_signal

router = APIRouter(prefix="/api/sos", tags=["SOS Signals"])

@router.post("/signal", response_model=SignalResponse, status_code=201)
async def receive_signal(payload: SignalCreate, db: AsyncSession = Depends(get_db)):
    """
    Called by the LoRa bridge script whenever the hardware button is pressed.
    Saves the GPS coordinates and broadcasts to all WebSocket clients.
    """
    signal = await save_signal(db, payload)
    await broadcast_signal(signal)       # ← real-time push to frontend
    return signal

@router.get("/signals", response_model=list[SignalResponse])
async def list_signals(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Return the last N signals (for history panel in the frontend)."""
    return await get_signals(db, limit)

@router.get("/latest/{device_id}", response_model=SignalResponse)
async def latest_signal(device_id: str, db: AsyncSession = Depends(get_db)):
    """Return the most recent signal for a specific device."""
    signal = await get_latest_signal(db, device_id)
    if not signal:
        raise HTTPException(status_code=404, detail="No signal found for device")
    return signal
```

---

## Step 9 — WebSocket Route (`app/routes/websocket.py`)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.ws_manager import ws_manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/sos/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    Frontend connects here. Backend pushes every SOS signal as JSON.
    Connection stays alive until browser closes or disconnects.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive — we don't expect messages FROM the client
            # but we listen so we detect disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
```

---

## Step 10 — Main App Entry Point (`app/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routes.signals import router as signals_router
from app.routes.websocket import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables if they don't exist
    await init_db()
    yield
    # Shutdown: clean up if needed

app = FastAPI(
    title="Lifeline SOS API",
    description="Real-time SOS signal tracking backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow frontend (Vite dev server) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals_router)
app.include_router(ws_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Lifeline SOS Backend"}
```

---

## Step 11 — Test/Simulate Hardware (`simulate_sos.py`)

```python
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
    response = httpx.post(f"{BASE_URL}/api/sos/signal", json=payload)
    print(f"[{response.status_code}] Signal sent: {payload}")
    return response.json()

if __name__ == "__main__":
    print("Simulating SOS signals every 5 seconds. Press Ctrl+C to stop.")
    while True:
        simulate()
        time.sleep(5)
```

---

## Build Order Summary

| Step | Task | File(s) |
|---|---|---|
| 1 | Set up venv + install deps | `requirements.txt` |
| 2 | Config from `.env` | `app/config.py` |
| 3 | DB engine + session | `app/database.py` |
| 4 | ORM model | `app/models/signal.py` |
| 5 | Pydantic schemas | `app/schemas/signal.py` |
| 6 | WebSocket manager | `app/core/ws_manager.py` |
| 7 | Business logic | `app/services/signal_service.py` |
| 8 | REST API routes | `app/routes/signals.py` |
| 9 | WebSocket route | `app/routes/websocket.py` |
| 10 | App entry point | `app/main.py` |
| 11 | Test simulator | `simulate_sos.py` |
