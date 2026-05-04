/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Registrations Page  (Task 4)
   Admin view: approve or reject pending member registrations.
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useCallback } from 'react';
import { useToast }      from '../../context/ToastContext';
import { membersService, notificationsService } from '../../services/index';
import { Avatar, Badge, PageHeader, EmptyState, InfoBox, ConfirmDialog } from '../../components/shared/index';
import Button  from '../../components/shared/Button';
import Modal   from '../../components/shared/Modal';
import Input   from '../../components/shared/Input';
import { ROLES, VOICE_PARTS } from '../../config/constants';
import { formatDate, getInitials } from '../../utils/index';

const VP_COLOR = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

export default function RegistrationsPage() {
  const { success: toastOK, info: toastInfo } = useToast();
  const [pending, setPending] = useState(() => membersService.getPending());
  const [rejectModal, setRejectModal] = useState(null); // member to reject
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);

  const reload = useCallback(() => setPending(membersService.getPending()), []);

  const handleApprove = async (member) => {
    setApproving(member.id);
    await new Promise(r => setTimeout(r, 400));
    membersService.approve(member.id);
    notificationsService.add({
      type: 'success',
      title: `${member.fullName} approved`,
      message: `Registration for ${member.voicePart} voice approved.`,
      actionUrl: `/dashboard/members`,
    });
    toastOK(`${member.fullName} approved and added to the choir!`);
    setApproving(null);
    reload();
  };

  const handleReject = () => {
    membersService.reject(confirmReject.id);
    toastInfo(`Registration for ${confirmReject.fullName} rejected`);
    setRejectModal(null);
    setConfirmReject(null);
    setRejectReason('');
    reload();
  };

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>
      <PageHeader
        title="Pending Registrations"
        subtitle={`${pending.length} member${pending.length !== 1 ? 's' : ''} awaiting approval`}
        icon="📋"
      />

      {pending.length === 0 ? (
        <EmptyState
          icon="✅" title="All caught up!"
          description="There are no pending registration requests at this time."
        />
      ) : (
        <>
          <InfoBox type="info" style={{ marginBottom: 20 }}>
            Review each registration carefully before approving. Approved members will receive an email and gain access to log in.
          </InfoBox>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pending.map(m => (
              <div key={m.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                animation: 'fadeUp 0.3s ease both',
              }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${VP_COLOR[m.voicePart]||'var(--gold)'},transparent)` }} />
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <Avatar initials={getInitials(m.fullName)} size={52} color={VP_COLOR[m.voicePart]} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {m.fullName}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Badge color={VP_COLOR[m.voicePart] || 'var(--gold)'}>{m.voicePart}</Badge>
                        <Badge color="var(--color-warning)">PENDING</Badge>
                        {m.gender && <Badge color="var(--text-muted)" size="xs">{m.gender}</Badge>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '4px 16px' }}>
                        {[
                          { l: 'Email',    v: m.email           },
                          { l: 'Phone',    v: m.phone || '—'    },
                          { l: 'Role',     v: ROLES.find(r=>r.id===m.role)?.label || m.role },
                          { l: 'Applied',  v: formatDate(m.joinDate, 'relative') },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 50 }}>{l}:</span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                      <Button
                        variant="success" size="sm" icon="✅"
                        loading={approving === m.id}
                        onClick={() => handleApprove(m)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger" size="sm" icon="❌"
                        onClick={() => setConfirmReject(m)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reject confirmation */}
      <ConfirmDialog
        isOpen={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        onConfirm={handleReject}
        title="Reject Registration"
        message={`Reject the registration for ${confirmReject?.fullName}? This cannot be undone.`}
        confirmLabel="Reject"
        confirmVariant="danger"
      />
    </div>
  );
}
