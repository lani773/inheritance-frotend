/**
 * INHERITANCE CHOIR — Volunteer Sign-Up System
 * Members claim service roles for events (sound, ushers, projector, etc.)
 */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ROLE_DEFINITIONS = [
  { id: 'sound',      icon: '🎛',  label: 'Sound Engineer',   slots: 2, description: 'Manage microphones and mixing' },
  { id: 'projector',  icon: '📽',  label: 'Projector',        slots: 1, description: 'Display lyrics and slides' },
  { id: 'usher',      icon: '🤝',  label: 'Usher',            slots: 4, description: 'Welcome and seat guests' },
  { id: 'camera',     icon: '📹',  label: 'Camera Operator',  slots: 2, description: 'Record and livestream' },
  { id: 'worship',    icon: '🎹',  label: 'Worship Leader',   slots: 1, description: 'Lead congregation in worship' },
  { id: 'offering',   icon: '🙏',  label: 'Offering',         slots: 3, description: 'Collect and count offerings' },
  { id: 'decoration', icon: '🌸',  label: 'Decoration',       slots: 3, description: 'Setup and decor arrangements' },
  { id: 'prayer',     icon: '✝',   label: 'Prayer Team',      slots: 5, description: 'Pre-service prayer circle' },
];

export function VolunteerSignup({ eventId, eventTitle }) {
  const { session } = useAuth();
  const [volunteers, setVolunteers] = useState({
    sound:      [{ id: 'v1', name: 'Jean-Paul H.', memberId: '2' }],
    usher:      [{ id: 'v2', name: 'Marie Claire U.', memberId: '3' }],
    prayer:     [{ id: 'v3', name: 'Diane M.', memberId: '4' }],
  });
  const [signingUp, setSigningUp] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const myId = session?.id?.toString();
  const myName = session?.fullName || 'You';

  const isSignedUp = (roleId) =>
    (volunteers[roleId] || []).some(v => v.memberId === myId);

  const hasAnyRole = Object.values(volunteers).some(vs => vs.some(v => v.memberId === myId));

  const signup = (roleId) => {
    const role = ROLE_DEFINITIONS.find(r => r.id === roleId);
    const current = volunteers[roleId] || [];
    if (current.length >= role.slots) return;
    if (isSignedUp(roleId)) return;

    setVolunteers(prev => ({
      ...prev,
      [roleId]: [...current, { id: `v_${Date.now()}`, name: myName, memberId: myId }],
    }));
    setConfirmed(roleId);
    setSigningUp(null);
    setTimeout(() => setConfirmed(null), 3000);
  };

  const withdraw = (roleId) => {
    setVolunteers(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(v => v.memberId !== myId),
    }));
  };

  const totalVols = Object.values(volunteers).reduce((s, vs) => s + vs.length, 0);
  const totalSlots = ROLE_DEFINITIONS.reduce((s, r) => s + r.slots, 0);

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            🙋 Volunteer Roles
          </h3>
          <div style={{
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 20, padding: '5px 14px',
          }}>
            <span style={{ fontSize: 12, color: '#C9A84C', fontFamily: 'DM Mono, monospace' }}>
              {totalVols}/{totalSlots} filled
            </span>
          </div>
        </div>
        {/* Progress */}
        <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(totalVols / totalSlots) * 100}%`,
            background: 'linear-gradient(90deg, #A07820, #C9A84C)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {confirmed && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideDown 0.3s ease',
        }}>
          <span>✅</span>
          <span style={{ fontSize: 13, color: '#22C55E' }}>
            You signed up as <strong>{ROLE_DEFINITIONS.find(r => r.id === confirmed)?.label}</strong>!
          </span>
        </div>
      )}

      {hasAnyRole && (
        <div style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          fontSize: 12, color: '#94A3B8',
        }}>
          ℹ You are volunteering for this event. Click your role below to withdraw.
        </div>
      )}

      {/* Role grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {ROLE_DEFINITIONS.map(role => {
          const filled   = (volunteers[role.id] || []).length;
          const isFull   = filled >= role.slots;
          const myRole   = isSignedUp(role.id);
          const isTarget = signingUp === role.id;

          return (
            <div
              key={role.id}
              style={{
                background: myRole ? 'rgba(201,168,76,0.06)' : '#0F172A',
                border: `1px solid ${myRole ? '#C9A84C44' : isFull ? '#22C55E22' : '#1E2D4A'}`,
                borderRadius: 14, padding: '16px 18px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{role.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>{role.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{role.description}</p>
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700,
                  color: isFull ? '#22C55E' : '#94A3B8',
                  background: isFull ? '#22C55E11' : '#1E2D4A',
                  border: `1px solid ${isFull ? '#22C55E33' : '#1E2D4A'}`,
                  borderRadius: 6, padding: '2px 7px', flexShrink: 0,
                }}>
                  {filled}/{role.slots}
                </div>
              </div>

              {/* Volunteer list */}
              {(volunteers[role.id] || []).map(v => (
                <div key={v.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 8px', marginBottom: 4,
                  background: v.memberId === myId ? 'rgba(201,168,76,0.08)' : '#141E33',
                  borderRadius: 7, border: v.memberId === myId ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#1E2D4A', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: '#94A3B8', fontWeight: 700,
                  }}>
                    {v.name[0]}
                  </div>
                  <span style={{ fontSize: 12, color: v.memberId === myId ? '#C9A84C' : '#94A3B8' }}>
                    {v.memberId === myId ? `${v.name} (You)` : v.name}
                  </span>
                </div>
              ))}

              {/* Open slots */}
              {Array.from({ length: role.slots - filled }).map((_, i) => (
                <div key={i} style={{
                  padding: '5px 8px', marginBottom: 4,
                  background: 'transparent',
                  border: '1px dashed #1E2D4A', borderRadius: 7,
                  fontSize: 11, color: '#374151', textAlign: 'center',
                }}>
                  open slot
                </div>
              ))}

              {/* Action */}
              <div style={{ marginTop: 12 }}>
                {myRole ? (
                  <button
                    onClick={() => withdraw(role.id)}
                    style={{
                      width: '100%', padding: '8px',
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8, color: '#EF4444', fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Withdraw
                  </button>
                ) : isFull ? (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#22C55E', padding: '6px' }}>
                    ✓ Fully staffed
                  </div>
                ) : (
                  <button
                    onClick={() => signup(role.id)}
                    style={{
                      width: '100%', padding: '8px',
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 8, color: '#C9A84C', fontSize: 12,
                      fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    + Volunteer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
