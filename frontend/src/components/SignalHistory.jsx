import React from 'react';
import axios from 'axios';

export default function SignalHistory({ signals, loading, latestId }) {
  const handleResolve = async (id) => {
    try {
      await axios.patch(`/api/sos/signal/${id}`, { status: 'resolved' });
    } catch (err) {
      console.error('Failed to resolve signal:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        fontWeight: 700 
      }}>
        📋 Signal History
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            Loading history...
          </div>
        ) : signals.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            No signals recorded yet.
          </div>
        ) : (
          signals.map((s) => (
            <div 
              key={s.id} 
              style={{
                background: s.id === latestId ? 'rgba(248, 81, 73, 0.1)' : 'var(--bg-card)',
                border: `1px solid ${s.id === latestId ? 'var(--accent-red)' : 'var(--border)'}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>🔴 {s.device_id}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {new Date(s.received_at).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                📍 {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', alignItems: 'center' }}>
                <span>🔋 {s.battery ?? '?'}%</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                        color: s.status === 'active' ? 'var(--accent-red)' : 'var(--accent-green)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        fontSize: '10px'
                    }}>
                        {s.status}
                    </span>
                    {s.status === 'active' && (
                        <button 
                            onClick={() => handleResolve(s.id)}
                            style={{
                                background: 'var(--accent-green)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                padding: '2px 8px',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            RESOLVE
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
