import React from 'react';

export default function AlertBanner({ signal, visible }) {
  if (!visible || !signal) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--accent-red)', color: 'white',
      padding: '12px 24px', textAlign: 'center',
      fontWeight: 700, fontSize: '16px',
      boxShadow: '0 4px 20px rgba(248, 81, 73, 0.4)',
      animation: 'pulse 0.5s ease-in-out infinite alternate',
    }}>
      🚨 SOS SIGNAL RECEIVED — Device: {signal.device_id} | 
      📍 {signal.latitude.toFixed(5)}, {signal.longitude.toFixed(5)} | 
      🔋 {signal.battery ?? '?'}%
    </div>
  );
}
