/**
 * INHERITANCE CHOIR — Live Presence Components
 * Online indicators, live attendance board, typing indicators.
 */
import React, { useState, useEffect } from 'react';
import { useRealtime, useRealtimeEvent, WS_EVENTS } from '../../context/RealtimeContext';

// ── Online Dot ─────────────────────────────────────────────────
export function OnlineDot({ memberId, size = 10 }) {
  const { isOnline } = useRealtime();
  const online = isOnline(memberId);

  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      borderRadius: '50%',
      background: online ? '#22C55E' : '#475569',
      boxShadow: online ? `0 0 ${size}px #22C55E88` : 'none',
      transition: 'all 0.4s ease',
      flexShrink: 0,
      animation: online ? 'pulse-green 2s infinite' : 'none',
    }} />
  );
}

// ── Online Members Sidebar Widget ──────────────────────────────
export function OnlineMembersWidget({ members = [] }) {
  const { onlineMembers } = useRealtime();
  const online = members.filter(m => onlineMembers.has(m.id || m._id));
  const offline = members.filter(m => !onlineMembers.has(m.id || m._id));

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0F172A, #141E33)',
      border: '1px solid #1E2D4A',
      borderRadius: 16, padding: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>
          Choir Presence
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
          <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>{online.length} online</span>
        </div>
      </div>

      {online.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Online Now
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {online.map(m => (
              <MemberPresenceRow key={m.id || m._id} member={m} online />
            ))}
          </div>
        </div>
      )}

      {offline.slice(0, 5).length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Offline
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {offline.slice(0, 5).map(m => (
              <MemberPresenceRow key={m.id || m._id} member={m} online={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberPresenceRow({ member, online }) {
  const initials = member.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const VP_COLORS = { Soprano: '#EC4899', Alto: '#8B5CF6', Tenor: '#3B82F6', Bass: '#10B981' };
  const vpColor = VP_COLORS[member.voicePart] || '#94A3B8';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${vpColor}44, ${vpColor}22)`,
          border: `1.5px solid ${vpColor}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: vpColor,
        }}>
          {initials}
        </div>
        <OnlineDot memberId={member.id || member._id} size={9} />
        {online && (
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 9, height: 9, borderRadius: '50%',
            background: '#22C55E', border: '1.5px solid #0F172A',
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, color: online ? '#F0F4FF' : '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {member.fullName}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: online ? vpColor : '#374151' }}>
          {member.voicePart}
          {member.lastSeen && !online && (
            <span style={{ marginLeft: 4, color: '#374151' }}>
              · {formatLastSeen(member.lastSeen)}
            </span>
          )}
        </p>
      </div>
      {online && (
        <div style={{
          fontSize: 9, color: '#22C55E', background: '#22C55E11',
          border: '1px solid #22C55E33', borderRadius: 4,
          padding: '2px 5px', letterSpacing: '0.05em',
        }}>
          LIVE
        </div>
      )}
    </div>
  );
}

// ── Live Attendance Board ──────────────────────────────────────
export function LiveAttendanceBoard({ eventId, members = [] }) {
  const { getEventAttendance } = useRealtime();
  const [liveRecords, setLiveRecords] = useState([]);
  const [recentMark, setRecentMark]   = useState(null);

  useRealtimeEvent(WS_EVENTS.ATTENDANCE_MARKED, (data) => {
    if (data.eventId !== eventId) return;
    setRecentMark(data);
    setTimeout(() => setRecentMark(null), 3000);
  }, [eventId]);

  useEffect(() => {
    setLiveRecords(getEventAttendance(eventId));
  }, [eventId, getEventAttendance]);

  const STATUS_CONFIG = {
    present: { color: '#22C55E', label: 'Present', icon: '✓' },
    late:    { color: '#F59E0B', label: 'Late',    icon: '⏰' },
    excused: { color: '#3B82F6', label: 'Excused', icon: '📋' },
    absent:  { color: '#EF4444', label: 'Absent',  icon: '✗' },
  };

  const statusMap = {};
  liveRecords.forEach(r => { statusMap[r.memberId] = r; });

  const byStatus = {
    present: members.filter(m => statusMap[m.id]?.status === 'present').length,
    late:    members.filter(m => statusMap[m.id]?.status === 'late').length,
    excused: members.filter(m => statusMap[m.id]?.status === 'excused').length,
    absent:  members.filter(m => statusMap[m.id]?.status === 'absent').length,
    pending: members.filter(m => !statusMap[m.id]).length,
  };

  return (
    <div style={{
      background: '#0F172A', border: '1px solid #1E2D4A',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #141E33, #1A2540)',
        borderBottom: '1px solid #1E2D4A',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#22C55E', boxShadow: '0 0 8px #22C55E',
          animation: 'pulse-green 2s infinite',
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>
          Live Attendance
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B' }}>
          {liveRecords.length}/{members.length} marked
        </span>
      </div>

      {/* Flash notification */}
      {recentMark && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(34,197,94,0.1)',
          borderBottom: '1px solid rgba(34,197,94,0.2)',
          fontSize: 12, color: '#22C55E',
          animation: 'slideDown 0.3s ease',
        }}>
          ✓ {recentMark.memberName || 'Member'} marked as {recentMark.status}
        </div>
      )}

      {/* Status summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #1E2D4A',
      }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{
            padding: '14px 10px', textAlign: 'center',
            borderRight: '1px solid #1E2D4A',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, fontFamily: 'DM Mono, monospace' }}>
              {byStatus[key] || 0}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {cfg.label}
            </div>
          </div>
        ))}
      </div>

      {/* Member rows */}
      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
        {members.map(m => {
          const rec = statusMap[m.id || m._id];
          const cfg = rec ? STATUS_CONFIG[rec.status] : null;
          return (
            <div key={m.id || m._id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 20px',
              background: rec ? `${cfg?.color}08` : 'transparent',
              borderLeft: rec ? `2px solid ${cfg?.color}` : '2px solid transparent',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#141E33', border: `1px solid ${cfg?.color || '#1E2D4A'}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: cfg?.color || '#475569',
              }}>
                {m.fullName?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: rec ? '#F0F4FF' : '#64748B', fontWeight: 500 }}>
                  {m.fullName}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{m.voicePart}</p>
              </div>
              {cfg ? (
                <span style={{
                  fontSize: 11, color: cfg.color,
                  background: `${cfg.color}11`, border: `1px solid ${cfg.color}33`,
                  borderRadius: 6, padding: '2px 8px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {cfg.icon} {cfg.label}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: '#374151' }}>Pending</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Connection Status Bar ──────────────────────────────────────
export function ConnectionStatus() {
  const { connected } = useRealtime();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => setShow(connected ? false : true), 3000);
    return () => clearTimeout(t);
  }, [connected]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      background: connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${connected ? '#22C55E' : '#EF4444'}44`,
      borderRadius: 20, padding: '8px 18px',
      display: 'flex', alignItems: 'center', gap: 8,
      backdropFilter: 'blur(20px)',
      fontSize: 12, color: connected ? '#22C55E' : '#EF4444',
      zIndex: 9000,
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: connected ? '#22C55E' : '#EF4444',
      }} />
      {connected ? '🎵 Live — Real-time connected' : '⚠ Reconnecting…'}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function formatLastSeen(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}
