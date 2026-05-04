/**
 * INHERITANCE CHOIR — WebSocket Connection Status Badge
 * Shows live/offline state and online member count.
 * Plugs into AuthContext's WS state.
 */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function WsStatusBadge({ className = '' }) {
  const { wsConnected, onlineMembers, session } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`ws-status ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'default' }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: wsConnected ? '#4ade80' : '#f87171',
        boxShadow: wsConnected ? '0 0 6px #4ade80' : '0 0 4px #f87171',
        flexShrink: 0,
        animation: wsConnected ? 'ws-pulse 2s infinite' : 'none',
      }} />
      <span style={{ fontSize: 12, color: wsConnected ? '#4ade80' : '#f87171', fontWeight: 600 }}>
        {wsConnected ? `Live · ${onlineMembers.length} online` : 'Connecting…'}
      </span>

      {showTooltip && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)', marginBottom: 8,
          background: '#1E2D4A', border: '1px solid #2D3F5A',
          borderRadius: 8, padding: '8px 12px', whiteSpace: 'nowrap',
          fontSize: 12, color: '#CBD5E1', zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <strong style={{ color: '#C9A84C' }}>Real-Time Connection</strong><br />
          Status: <span style={{ color: wsConnected ? '#4ade80' : '#f87171' }}>
            {wsConnected ? '● Connected' : '○ Reconnecting…'}
          </span><br />
          Members online: <strong>{onlineMembers.length}</strong><br />
          Your ID: <span style={{ color: '#94A3B8', fontSize: 11 }}>{session?.id?.slice(-8)}</span>
        </div>
      )}

      <style>{`
        @keyframes ws-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
