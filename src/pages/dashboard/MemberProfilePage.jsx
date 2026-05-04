/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Member Profile Page  (Task 4)
   
   Tabs: Overview · Attendance History · Contribution History · Timeline
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  membersService, attendanceService,
  contributionsService, eventsService,
} from '../../services/index';
import { ROLES, VOICE_PARTS } from '../../config/constants';
import {
  Avatar, Badge, ProgressBar, StatCard, Tabs, InfoBox, ConfirmDialog,
} from '../../components/shared/index';
import Button     from '../../components/shared/Button';
import MemberModal from '../../components/members/MemberModal';
import MemberQR    from '../../components/members/MemberQR';
import {
  formatDate, formatCurrency, getInitials, attendanceColor,
} from '../../utils/index';

const VP_COLOR   = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
const ATT_COLOR  = { present:'var(--color-success)', late:'var(--color-warning)', excused:'var(--color-violet)', absent:'var(--color-error)' };
const ATT_ICON   = { present:'✅', late:'⏰', excused:'📝', absent:'❌' };

export default function MemberProfilePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { success: toastOK, info: toastInfo, error: toastErr } = useToast();

  const [member, setMember] = useState(() => membersService.getById(Number(id)));
  const [tab,    setTab]    = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen,   setQrOpen]   = useState(false);
  const [confirmDeact, setConfirmDeact] = useState(false);

  if (!member) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Member Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', margin: '10px 0 20px' }}>The member with ID #{id} doesn't exist.</p>
      <Button variant="primary" onClick={() => navigate('/dashboard/members')}>← Back to Directory</Button>
    </div>
  );

  /* ── Related data ────────────────────────────────────────── */
  const { attRecords, events, contributions } = useMemo(() => {
    const mid    = Number(id);
    const attRec = attendanceService.getForMember(mid);
    const evts   = eventsService.getAll();
    const contribs = contributionsService.getForMember(mid);
    return { attRecords: attRec, events: evts, contributions: contribs };
  }, [id]);

  const attendanceRate = useMemo(() => {
    if (!attRecords.length) return member.attendance || 0;
    const ok = attRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((ok / attRecords.length) * 100);
  }, [attRecords, member.attendance]);

  const totalContribs = useMemo(
    () => contributions.reduce((s, c) => s + parseFloat(c.amount || 0), 0),
    [contributions]
  );

  /* ── Attendance history with event names ────────────────── */
  const attHistory = useMemo(() =>
    [...attRecords]
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 30)
      .map(r => ({
        ...r,
        eventTitle: events.find(e => e.id === r.eventId)?.title || `Event #${r.eventId}`,
        eventDate:  events.find(e => e.id === r.eventId)?.date,
      })),
    [attRecords, events]
  );

  /* ── Save after edit ────────────────────────────────────── */
  const handleSave = (data) => {
    membersService.update(member.id, data);
    setMember(membersService.getById(member.id));
    toastOK(`${data.fullName} updated successfully`);
    setEditOpen(false);
  };

  const handleDeactivate = () => {
    membersService.update(member.id, { status: 'inactive' });
    setMember(membersService.getById(member.id));
    toastInfo(`${member.fullName} deactivated`);
    setConfirmDeact(false);
  };

  const role = ROLES.find(r => r.id === member.role);

  const tabs = [
    { id: 'overview',     label: 'Overview',            icon: '👤' },
    { id: 'attendance',   label: 'Attendance History',  icon: '✅', count: attRecords.length  },
    { id: 'contributions',label: 'Contributions',       icon: '💰', count: contributions.length },
    { id: 'timeline',     label: 'Timeline',            icon: '📋' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.35s ease both' }}>

      {/* ── Back link ────────────────────────────────────── */}
      <button
        onClick={() => navigate('/dashboard/members')}
        style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        ← Back to Member Directory
      </button>

      {/* ══════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: 24,
      }}>
        {/* Accent band */}
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${VP_COLOR[member.voicePart] || 'var(--gold)'}, transparent)` }} />

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Large avatar */}
            <Avatar
              initials={getInitials(member.fullName)}
              size={80} online={member.online}
              color={VP_COLOR[member.voicePart]}
            />

            {/* Identity */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                {member.fullName}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Badge color={VP_COLOR[member.voicePart] || 'var(--gold)'}>{member.voicePart}</Badge>
                {role && <Badge color={role.color || 'var(--gold)'}>{role.icon} {role.label}</Badge>}
                <Badge color={member.status === 'active' ? 'var(--color-success)' : member.status === 'pending' ? 'var(--color-warning)' : 'var(--color-error)'}>
                  {member.status?.toUpperCase()}
                </Badge>
                {member.isAdmin && <Badge color="var(--gold)">🏆 ADMIN</Badge>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { icon: '✉️', val: member.email },
                  member.phone && { icon: '📱', val: member.phone },
                  member.dateOfBirth && { icon: '🎂', val: `Born ${formatDate(member.dateOfBirth)}` },
                  { icon: '📅', val: `Joined ${formatDate(member.joinDate)}` },
                ].filter(Boolean).map(({ icon, val }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, width: 20 }}>{icon}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: '✅', val: `${attendanceRate}%`,        label: 'Attendance', color: attendanceColor(attendanceRate) },
                { icon: '💰', val: formatCurrency(totalContribs, 'RWF').replace('RWF ', ''), label: 'Total Contributions', color: 'var(--color-emerald)' },
                { icon: '🎵', val: attRecords.length,            label: 'Events Tracked', color: 'var(--color-violet)' },
              ].map(({ icon, val, label, color }) => (
                <div key={label} style={{
                  background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 16px', textAlign: 'center',
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color }}>{val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 'auto' }}>
              <Button variant="primary" size="sm" icon="✏️" onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant="secondary" size="sm" icon="📱" onClick={() => setQrOpen(true)}>QR Code</Button>
              {member.status === 'active' && !member.isAdmin && (
                <Button variant="danger" size="sm" onClick={() => setConfirmDeact(true)}>Deactivate</Button>
              )}
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${VP_COLOR[member.voicePart] || 'var(--gold)'}`,
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
                "{member.bio}"
              </p>
            </div>
          )}

          {/* Attendance progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Attendance Rate</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: attendanceColor(attendanceRate), fontWeight: 700 }}>{attendanceRate}%</span>
            </div>
            <ProgressBar value={attendanceRate} max={100} color={attendanceColor(attendanceRate)} height={6} animate />
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════
          OVERVIEW TAB
         ══════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 18 }}>

          {/* Personal info */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ height: 3, background: `linear-gradient(90deg,transparent,var(--gold),transparent)` }} />
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
                👤 PERSONAL INFORMATION
              </div>
              {[
                { label: 'Full Name',      value: member.fullName    },
                { label: 'Email',          value: member.email       },
                { label: 'Phone',          value: member.phone || '—' },
                { label: 'Gender',         value: member.gender || '—' },
                { label: 'Marital Status', value: member.maritalStatus || '—' },
                { label: 'Date of Birth',  value: member.dateOfBirth ? formatDate(member.dateOfBirth) : '—' },
                { label: 'Voice Part',     value: member.voicePart   },
                { label: 'Role',           value: role?.label || member.role },
                { label: 'Status',         value: member.status?.toUpperCase() },
                { label: 'Member ID',      value: `#${member.id}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <StatCard icon="✅" value={`${attendanceRate}%`}                    label="Attendance Rate"    color={attendanceColor(attendanceRate)} />
            <StatCard icon="💰" value={formatCurrency(totalContribs, 'RWF')}   label="Total Contributed"  color="var(--color-emerald)" />
            <StatCard icon="🎵" value={attRecords.filter(r=>r.status==='present').length} label="Events Attended" color="var(--color-violet)" />
            <StatCard icon="📅" value={formatDate(member.joinDate)}            label="Join Date"           color="var(--gold)" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ATTENDANCE HISTORY TAB
         ══════════════════════════════════════════════════ */}
      {tab === 'attendance' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--color-violet),transparent)' }} />
          <div style={{ padding: 20 }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: 10, marginBottom: 20 }}>
              {['present','late','excused','absent'].map(s => {
                const count = attRecords.filter(r => r.status === s).length;
                return (
                  <div key={s} style={{ background: 'var(--bg-raised)', border: `1px solid ${ATT_COLOR[s]}25`, borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{ATT_ICON[s]}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: ATT_COLOR[s] }}>{count}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s}</div>
                  </div>
                );
              })}
            </div>
            {attHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                No attendance records yet
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)' }}>
                      {['Event', 'Date', 'Status', 'Marked'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attHistory.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)' }}>{r.eventTitle}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{r.eventDate ? formatDate(r.eventDate) : '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <Badge color={ATT_COLOR[r.status] || 'var(--text-muted)'} size="xs">
                            {ATT_ICON[r.status]} {r.status?.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{r.timestamp ? formatDate(r.timestamp, 'relative') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CONTRIBUTIONS TAB
         ══════════════════════════════════════════════════ */}
      {tab === 'contributions' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--color-emerald),transparent)' }} />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--color-emerald)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                💰 CONTRIBUTION HISTORY
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 900, color: 'var(--color-emerald)' }}>
                Total: {formatCurrency(totalContribs, 'RWF')}
              </div>
            </div>
            {contributions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13 }}>No contributions recorded</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)' }}>
                      {['Date','Type','Amount','Method','Receipt','Verified'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...contributions].sort((a,b) => (b.date||'').localeCompare(a.date||'')).map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(c.date)}</td>
                        <td style={{ padding: '9px 12px' }}><Badge color="var(--gold)" size="xs">{c.type?.replace('_',' ').toUpperCase()}</Badge></td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-emerald)', fontWeight: 700 }}>{formatCurrency(c.amount, c.currency)}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>{c.method?.replace('_',' ')}</td>
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{c.receiptNo || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <Badge color={c.verified ? 'var(--color-success)' : 'var(--color-warning)'} size="xs">
                            {c.verified ? '✓ VERIFIED' : '⏳ PENDING'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TIMELINE TAB
         ══════════════════════════════════════════════════ */}
      {tab === 'timeline' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--color-cyan),transparent)' }} />
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--color-cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 20 }}>
              📋 MEMBER TIMELINE
            </div>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'var(--border-subtle)' }} />
              {[
                { icon:'🎉', color:'var(--color-success)', title:'Joined INHERITANCE CHOIR', date: member.joinDate, detail:`Voice part: ${member.voicePart}` },
                ...[...contributions].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,3).map(c => ({
                  icon:'💰', color:'var(--color-emerald)', title:`Contributed ${formatCurrency(c.amount, c.currency)}`, date:c.date, detail:`Type: ${c.type} · ${c.method}`,
                })),
                ...[...attRecords].filter(r=>r.status!=='absent').sort((a,b)=>(b.timestamp||'').localeCompare(a.timestamp||'')).slice(0,3).map(r => ({
                  icon: ATT_ICON[r.status], color: ATT_COLOR[r.status],
                  title: `Marked ${r.status} at event`, date: r.timestamp,
                  detail: events.find(e=>e.id===r.eventId)?.title || 'Unknown event',
                })),
              ].sort((a,b) => (b.date||'').localeCompare(a.date||'')).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, position: 'relative' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `${item.color}18`, border: `2px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0, zIndex: 1,
                    marginLeft: -25, marginTop: 2,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', padding: '10px 14px', flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.detail}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(item.date, 'relative')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {editOpen && (
        <MemberModal isOpen onClose={() => setEditOpen(false)}
          onSave={handleSave} member={member}
          existingEmails={[]}
        />
      )}
      {qrOpen && <MemberQR isOpen member={member} onClose={() => setQrOpen(false)} />}
      <ConfirmDialog
        isOpen={confirmDeact}
        onClose={() => setConfirmDeact(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Member"
        message={`Deactivate ${member.fullName}? Their data will be preserved.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
}
