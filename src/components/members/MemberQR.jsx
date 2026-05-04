/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Member QR Code Modal  (Task 4)
   Shows unique QR for attendance check-in. Downloadable.
   ═══════════════════════════════════════════════════════════════════ */
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal  from '../shared/Modal';
import Button from '../shared/Button';
import { Avatar, Badge } from '../shared/index';
import { getInitials, formatDate } from '../../utils/index';

const VP_COLOR = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

export default function MemberQR({ isOpen, member, onClose }) {
  const qrRef = useRef(null);

  // Unique QR payload — encodes member identity
  const qrData = JSON.stringify({
    id:       member.id,
    name:     member.fullName,
    voice:    member.voicePart,
    choir:    'INHERITANCE',
    ts:       Date.now(),
  });

  const handleDownload = () => {
    const svg   = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const data  = new XMLSerializer().serializeToString(svg);
    const blob  = new Blob([data], { type: 'image/svg+xml' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `qr-${member.fullName.replace(/\s+/g,'-').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title="Member QR Code"
      subtitle="For attendance check-in scanning"
      accent={VP_COLOR[member.voicePart] || 'var(--gold)'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" icon="⬇️" onClick={handleDownload}>Download QR</Button>
        </>
      }
    >
      {/* Member identity card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 20,
      }}>
        <Avatar
          initials={getInitials(member.fullName)}
          size={52} online={member.online}
          color={VP_COLOR[member.voicePart]}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>
            {member.fullName}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge color={VP_COLOR[member.voicePart] || 'var(--gold)'}>{member.voicePart}</Badge>
            <Badge color="var(--text-muted)" size="xs">{member.role?.toUpperCase()}</Badge>
            <Badge color="var(--text-muted)" size="xs">ID #{member.id}</Badge>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div
        ref={qrRef}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', borderRadius: 'var(--radius-xl)',
          padding: 20, marginBottom: 16,
        }}
      >
        <QRCodeSVG
          value={qrData}
          size={180}
          level="H"
          fgColor="#080C14"
          bgColor="#ffffff"
          imageSettings={{
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="12" font-size="16">♪</text></svg>',
            height: 24, width: 24,
            excavate: true,
          }}
        />
      </div>

      {/* Instructions */}
      <div style={{
        background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)', padding: '12px 14px',
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>How to use:</strong><br />
        During events, the attendance marker can scan this QR code to automatically mark {member.fullName.split(' ')[0]} as present. Print and laminate for regular use.
      </div>

      {/* Member details */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Email',    value: member.email    },
          { label: 'Phone',    value: member.phone || '—' },
          { label: 'Joined',   value: formatDate(member.joinDate) },
          { label: 'Status',   value: member.status?.toUpperCase() },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
