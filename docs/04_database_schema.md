# 🗄️ Database Schema — Lifeline SOS System

## Why SQLite?

- **Zero setup**: No database server to install or run — it's just a `.db` file
- **Already in repo**: `sql_app.db` exists in the original codebase
- **Fast enough**: For a single-device SOS wristwatch, SQLite handles thousands of records effortlessly
- **Async support**: `aiosqlite` driver lets us use it with FastAPI's async perfectly
- **Easy migration**: SQLAlchemy abstraction means swapping to PostgreSQL later is a 1-line change in `.env`

---

## Table: `signals`

This is the **only table** needed. Keeps it simple — one table, one purpose.

```sql
CREATE TABLE signals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id   TEXT    NOT NULL,          -- e.g. "WATCH-001"
    latitude    REAL    NOT NULL,          -- GPS latitude  (-90 to 90)
    longitude   REAL    NOT NULL,          -- GPS longitude (-180 to 180)
    status      TEXT    DEFAULT 'active',  -- active | resolved | dismissed
    battery     INTEGER,                  -- Battery % (0-100), optional
    received_at DATETIME DEFAULT (datetime('now'))
);

-- Index for fast lookup by device
CREATE INDEX idx_signals_device_id ON signals(device_id);

-- Index for time-based queries (latest signal, history)
CREATE INDEX idx_signals_received_at ON signals(received_at DESC);
```

---

## Field Definitions

| Column | Type | Required | Description |
|---|---|---|---|
| `id` | INTEGER | Auto | Primary key, auto-incremented |
| `device_id` | TEXT | ✅ Yes | Hardware identifier (e.g., `WATCH-001`) |
| `latitude` | REAL | ✅ Yes | GPS latitude from hardware |
| `longitude` | REAL | ✅ Yes | GPS longitude from hardware |
| `status` | TEXT | Default: `active` | Signal lifecycle state |
| `battery` | INTEGER | ❌ Optional | Battery % sent by hardware |
| `received_at` | DATETIME | Auto | UTC timestamp when backend received it |

---

## Signal Status Lifecycle

```
Hardware pressed button
        │
        ▼
    [ active ]  ──── default when signal received
        │
        ├──── operator sees it ────▶ [ resolved ]  (manually marked)
        │
        └──── operator dismisses ──▶ [ dismissed ] (false alarm, etc.)
```

> **For now, keep it simple**: just store `active`. You can add a PATCH endpoint later to update status from the frontend.

---

## Example Records

```sql
-- After 3 button presses from the wristwatch
SELECT * FROM signals;

id | device_id  | latitude  | longitude  | status   | battery | received_at
---|------------|-----------|------------|----------|---------|--------------------
1  | WATCH-001  | 28.6139   | 77.2090    | active   | 87      | 2026-03-16 22:00:00
2  | WATCH-001  | 28.6142   | 77.2093    | active   | 86      | 2026-03-16 22:00:05
3  | WATCH-001  | 28.6145   | 77.2096    | resolved | 85      | 2026-03-16 22:00:10
```

---

## SQLAlchemy ORM Model (Python)

```python
# app/models/signal.py
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base

class Signal(Base):
    __tablename__ = "signals"

    id          = Column(Integer, primary_key=True, index=True)
    device_id   = Column(String, index=True, nullable=False)
    latitude    = Column(Float, nullable=False)
    longitude   = Column(Float, nullable=False)
    status      = Column(String, default="active")
    battery     = Column(Integer, nullable=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## Queries Used by the Backend

```python
# 1. Save a new incoming signal
INSERT INTO signals (device_id, latitude, longitude, battery)
VALUES ('WATCH-001', 28.6139, 77.2090, 87);

# 2. Get last 50 signals (for history panel)
SELECT * FROM signals
ORDER BY received_at DESC
LIMIT 50;

# 3. Get latest signal for a specific device (for REST fallback polling)
SELECT * FROM signals
WHERE device_id = 'WATCH-001'
ORDER BY received_at DESC
LIMIT 1;
```

---

## Data Volume Estimate

| Scenario | Freq | Records/day | DB size/year |
|---|---|---|---|
| Normal use | 5-sec updates during SOS | ~1,000 | ~5MB |
| Heavy use | Continuous tracking | ~17,000 | ~50MB |
| Emergency | 1 press every hour | ~24 | < 1MB |

SQLite easily handles all these. No need for PostgreSQL unless you add multiple devices or cloud sync.

---

## Optional: Future Tables (not needed now)

```sql
-- If you add user accounts later
CREATE TABLE devices (
    id          INTEGER PRIMARY KEY,
    device_id   TEXT UNIQUE NOT NULL,
    owner_name  TEXT,
    phone       TEXT,
    registered_at DATETIME DEFAULT (datetime('now'))
);

-- If you add alert acknowledgement
CREATE TABLE alerts (
    id          INTEGER PRIMARY KEY,
    signal_id   INTEGER REFERENCES signals(id),
    ack_by      TEXT,
    ack_at      DATETIME
);
```
