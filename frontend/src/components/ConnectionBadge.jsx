import React from 'react';

export default function ConnectionBadge({ isConnected }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: isConnected ? 'rgba(63, 185, 80, 0.1)' : 'rgba(240, 136, 62, 0.1)',
      border: `1px solid ${isConnected ? 'var(--accent-green)' : 'var(--accent-orange)'}`,
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      color: isConnected ? 'var(--accent-green)' : 'var(--accent-orange)',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: isConnected ? 'var(--accent-green)' : 'var(--accent-orange)',
        boxShadow: `0 0 8px ${isConnected ? 'var(--accent-green)' : 'var(--accent-orange)'}`,
      }} />
      {isConnected ? 'LIVE' : 'RECONNECTING...'}
    </div>
  );
}
