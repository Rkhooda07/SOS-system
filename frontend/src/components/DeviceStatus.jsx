import React from 'react';

export default function DeviceStatus({ signal, style }) {
  if (!signal) return null;

  return (
    <div style={{
      ...style,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tracking Device</span>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>📡 {signal.device_id}</span>
      </div>
      
      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Battery State</span>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>🔋 {signal.battery ?? '?'}%</span>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Update</span>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>🕒 {new Date(signal.received_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
