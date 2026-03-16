# ⚛️ Frontend Implementation Plan — Lifeline SOS Map UI

## What Gets Built

A React + Vite web app with:
- 🗺️ **Live Leaflet map** — shows GPS pin that moves in real time
- 🔴 **SOS Alert Banner** — flashes red when a new signal arrives
- 📋 **Signal History Panel** — scrollable list of past signals
- 🔋 **Device Status Bar** — shows device ID, battery, last seen
- 📡 **Connection Status** — shows if WebSocket is live or reconnecting

---

## Project Structure to Create

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              ← React entry point
    ├── App.jsx               ← Root component, layout
    ├── index.css             ← Global styles (dark theme)
    ├── hooks/
    │   ├── useSOSWebSocket.js  ← WebSocket hook (connect, parse, reconnect)
    │   └── useSignalHistory.js ← REST polling hook (fallback every 5s)
    ├── components/
    │   ├── MapView.jsx         ← Leaflet map with live pin
    │   ├── AlertBanner.jsx     ← Flashing red SOS alert bar
    │   ├── SignalHistory.jsx   ← Side panel with signal list
    │   ├── DeviceStatus.jsx    ← Device info bar (ID, battery, time)
    │   └── ConnectionBadge.jsx ← WS live/reconnecting indicator
    └── utils/
        └── formatTime.js       ← Format ISO timestamps for display
```

---

## Step 1 — Create Vite + React Project

```bash
# From the root (SOS system IOT/) folder
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-leaflet leaflet axios date-fns
```

---

## Step 2 — Configure Vite Proxy (`vite.config.js`)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // accessible from local network
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',      // forward REST calls to FastAPI
      '/ws': {
        target: 'ws://localhost:8000',      // forward WS to FastAPI
        ws: true,
      },
    },
  },
})
```

---

## Step 3 — Global Styles (`src/index.css`)

Dark, premium theme with emergency red accents:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary:    #0d1117;
  --bg-secondary:  #161b22;
  --bg-card:       #1c2128;
  --border:        #30363d;
  --text-primary:  #e6edf3;
  --text-muted:    #8b949e;
  --accent-red:    #f85149;
  --accent-orange: #f0883e;
  --accent-green:  #3fb950;
  --accent-blue:   #58a6ff;
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
}
```

---

## Step 4 — WebSocket Hook (`src/hooks/useSOSWebSocket.js`)

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

export function useSOSWebSocket() {
  const [latestSignal, setLatestSignal]     = useState(null);
  const [isConnected, setIsConnected]       = useState(false);
  const [newAlert, setNewAlert]             = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/sos/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'sos_signal') {
        setLatestSignal(data);
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 5000); // clear alert after 5s
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.warn('⚠️ WebSocket disconnected — retrying in 5s...');
      setTimeout(connect, 5000);  // auto-reconnect
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { latestSignal, isConnected, newAlert };
}
```

---

## Step 5 — REST Fallback Hook (`src/hooks/useSignalHistory.js`)

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useSignalHistory(deviceId = 'WATCH-001', pollInterval = 5000) {
  const [signals, setSignals]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/sos/signals?limit=20');
      setSignals(res.data);
    } catch (err) {
      console.error('Failed to fetch signal history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, pollInterval);
    return () => clearInterval(interval);
  }, [deviceId, pollInterval]);

  return { signals, loading, refetch: fetchHistory };
}
```

---

## Step 6 — Map Component (`src/components/MapView.jsx`)

```jsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom red SOS pin icon
const sosIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Helper: auto-pan map to new signal
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
}

export default function MapView({ signal }) {
  const defaultCenter = [28.6139, 77.2090]; // New Delhi fallback
  const position = signal ? [signal.latitude, signal.longitude] : null;

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && (
        <Marker position={position} icon={sosIcon}>
          <Popup>
            <strong>🚨 SOS Signal</strong><br />
            Device: {signal.device_id}<br />
            Lat: {signal.latitude.toFixed(6)}<br />
            Lng: {signal.longitude.toFixed(6)}<br />
            Battery: {signal.battery ?? 'N/A'}%<br />
            At: {new Date(signal.received_at).toLocaleTimeString()}
          </Popup>
        </Marker>
      )}
      {position && <MapUpdater position={position} />}
    </MapContainer>
  );
}
```

---

## Step 7 — Alert Banner (`src/components/AlertBanner.jsx`)

```jsx
export default function AlertBanner({ signal, visible }) {
  if (!visible || !signal) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#f85149', color: 'white',
      padding: '12px 24px', textAlign: 'center',
      fontWeight: 700, fontSize: '16px',
      animation: 'pulse 0.5s ease-in-out infinite alternate',
    }}>
      🚨 SOS SIGNAL RECEIVED — Device: {signal.device_id} |
      📍 {signal.latitude.toFixed(5)}, {signal.longitude.toFixed(5)} |
      🔋 {signal.battery ?? '?'}%
    </div>
  );
}
```

---

## Step 8 — Root App (`src/App.jsx`)

```jsx
import { useSOSWebSocket }    from './hooks/useSOSWebSocket';
import { useSignalHistory }   from './hooks/useSignalHistory';
import MapView                from './components/MapView';
import AlertBanner            from './components/AlertBanner';
import SignalHistory          from './components/SignalHistory';
import DeviceStatus           from './components/DeviceStatus';
import ConnectionBadge        from './components/ConnectionBadge';
import './index.css';

export default function App() {
  const { latestSignal, isConnected, newAlert } = useSOSWebSocket();
  const { signals, loading }                    = useSignalHistory();

  // Prefer live WS signal; fall back to most recent from REST
  const displaySignal = latestSignal || signals[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AlertBanner signal={displaySignal} visible={newAlert} />

      {/* Header */}
      <header style={{
        padding: '12px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700 }}>🚨 Lifeline SOS Dashboard</h1>
        <ConnectionBadge isConnected={isConnected} />
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map (70% width) */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapView signal={displaySignal} />
          {displaySignal && (
            <DeviceStatus signal={displaySignal} style={{
              position: 'absolute', bottom: 16, left: 16, zIndex: 1000
            }} />
          )}
        </div>

        {/* Side panel (30% width) */}
        <aside style={{
          width: '320px', background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}>
          <SignalHistory signals={signals} loading={loading} latestId={displaySignal?.id} />
        </aside>
      </div>
    </div>
  );
}
```

---

## UI Layout Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ 🚨 Lifeline SOS Dashboard                          ● LIVE        │  ← Header
├────────────────────────────────────────┬─────────────────────────┤
│                                        │  📋 Signal History       │  ← Side panel
│                                        │  ─────────────────────  │
│          🗺️  LEAFLET MAP               │  [🔴 22:00:10] WATCH-001│
│                                        │  📍 28.6145, 77.2096    │
│          📍 Red pin = SOS location     │  🔋 85%                 │
│                                        │  ─────────────────────  │
│          (map auto-pans on             │  [🔴 22:00:05] WATCH-001│
│           new signal)                  │  📍 28.6142, 77.2093    │
│                                        │  🔋 86%                 │
│                                        │  ─────────────────────  │
│  ┌─────────────────────────────────┐   │  ...                    │
│  │ 📡 WATCH-001  🔋 85%  22:00:10 │   │                         │
│  └─────────────────────────────────┘   │                         │
└────────────────────────────────────────┴─────────────────────────┘
   ↑ Device status card (floating)
```

---

## Key Frontend Behaviors

| Event | What Happens |
|---|---|
| Page loads | WebSocket connects, REST fetches last 20 signals, map shows last position |
| New SOS signal (WS) | Map pin flies to new coords, alert banner flashes for 5 seconds |
| WS disconnects | Badge shows "Reconnecting...", auto-retries every 5 seconds |
| WS down (REST fallback) | Every 5 sec, REST poll fetches latest — map still updates |
| Multiple signals | History panel grows, most recent always at top |
