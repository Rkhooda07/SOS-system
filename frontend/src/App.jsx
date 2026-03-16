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

  // Prefer live WS signal; fall back to most recent from signals array
  const displaySignal = latestSignal || signals[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
      <AlertBanner signal={displaySignal} visible={newAlert} />

      {/* Header */}
      <header style={{
        padding: '12px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>🚨 Lifeline SOS Dashboard</h1>
        <ConnectionBadge isConnected={isConnected} />
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map (flexible width) */}
        <div style={{ flex: 1, position: 'relative', background: '#222' }}>
          <MapView signal={displaySignal} />
          {displaySignal && (
            <DeviceStatus signal={displaySignal} style={{
              position: 'absolute', bottom: 20, left: 20, zIndex: 1000
            }} />
          )}
        </div>

        {/* Side panel (fixed width) */}
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
