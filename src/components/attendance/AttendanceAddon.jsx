/**
 * INHERITANCE CHOIR — QR-Powered Attendance Page Addon
 * Drop-in component that adds QR scanner tab to the existing AttendancePage.
 * Import and render inside AttendancePage's tab panel.
 */
import React, { useState } from 'react';
import QRScanner        from '../../components/qr-scanner/QRScanner';
import { LiveAttendanceBoard } from '../../components/realtime/LivePresence';
import { useAuth }      from '../../context/AuthContext';

export function AttendanceTabsAddon({ event, members = [] }) {
  const [tab, setTab] = useState('scanner');
  const { session } = useAuth();
  const isAdmin = session?.isAdmin;

  if (!isAdmin) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1E2D4A', marginBottom: 20 }}>
        {[
          { id: 'scanner', label: '📷 QR Scanner' },
          { id: 'live',    label: '🔴 Live Board'  },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? '#C9A84C' : 'transparent'}`,
              padding: '10px 20px', cursor: 'pointer',
              color: tab === t.id ? '#C9A84C' : '#64748B',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'scanner' && (
        <QRScanner
          eventId={event?.id}
          eventTitle={event?.title || 'Current Event'}
          onCheckIn={(data) => console.log('Check-in:', data)}
        />
      )}
      {tab === 'live' && (
        <LiveAttendanceBoard
          eventId={event?.id}
          members={members}
        />
      )}
    </div>
  );
}

export default AttendanceTabsAddon;
