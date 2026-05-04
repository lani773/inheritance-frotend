/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — My Profile Page  (Task 9)
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { membersService, attendanceService, contributionsService } from '../../services/index';
import { ROLES, VOICE_PARTS, GENDERS, MARITAL_STATUS } from '../../config/constants';
import {
  Avatar, Badge, ProgressBar, Tabs, StatCard, InfoBox, PageHeader,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import { Select } from '../../components/shared/index';
import {
  formatDate, formatCurrency, getInitials, attendanceColor, getPasswordStrength,
} from '../../utils/index';

const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

export default function ProfilePage() {
  const { session, updateSession } = useAuth();
  const { success: toastOK, error: toastErr } = useToast();

  const myId = session?.userId;

  /* ── Load member data ────────────────────────────────────── */
  const member = useMemo(() => membersService.getById(myId), [myId]);
  const myContribs = useMemo(() => contributionsService.getForMember(myId), [myId]);
  const myAttRecs  = useMemo(() => attendanceService.getForMember(myId), [myId]);

  const totalContribs = myContribs.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const presentCount  = myAttRecs.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendRate    = myAttRecs.length ? Math.round((presentCount / myAttRecs.length) * 100) : member?.attendance || 0;

  const [tab, setTab] = useState('overview');

  /* ── Edit profile state ──────────────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName:      member?.fullName      || '',
    phone:         member?.phone         || '',
    dateOfBirth:   member?.dateOfBirth   || '',
    gender:        member?.gender        || '',
    maritalStatus: member?.maritalStatus || '',
    bio:           member?.bio           || '',
  });
  const [saving, setSaving] = useState(false);

  const set = f => v => setForm(p => ({ ...p, [f]: v }));

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    membersService.update(myId, form);
    updateSession({ name: form.fullName });
    toastOK('Profile updated successfully!');
    setSaving(false);
    setEditing(false);
  };

  /* ── Change password state ───────────────────────────────── */
  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' });
  const [pwSaving, setPwSaving] = useState(false);
  const strength = getPasswordStrength(pwForm.newPw);
  const setPw = f => v => setPwForm(p => ({ ...p, [f]: v }));

  const handleChangePassword = async () => {
    if (!pwForm.current) { toastErr('Enter your current password'); return; }
    if (pwForm.newPw.length < 8) { toastErr('New password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toastErr('Passwords do not match'); return; }
    setPwSaving(true);
    await new Promise(r => setTimeout(r, 350));
    membersService.update(myId, { password: pwForm.newPw });
    toastOK('Password changed successfully!');
    setPwForm({ current:'', newPw:'', confirm:'' });
    setPwSaving(false);
  };

  /* ── Notification prefs ──────────────────────────────────── */
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const stored = localStorage.getItem(`notif_prefs_${myId}`);
    return stored ? JSON.parse(stored) : {
      eventReminders: true, attendanceConfirm: true,
      contributions: true, messages: true,
      posts: true, excuses: true,
    };
  });

  const toggleNotif = (key) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    localStorage.setItem(`notif_prefs_${myId}`, JSON.stringify(next));
    toastOK('Preferences saved');
  };

  const tabs = [
    { id:'overview', label:'Overview',    icon:'👤' },
    { id:'edit',     label:'Edit Info',   icon:'✏️' },
    { id:'security', label:'Security',    icon:'🔒' },
    { id:'notifs',   label:'Notifications',icon:'🔔' },
    { id:'stats',    label:'My Stats',    icon:'📊' },
  ];

  if (!member) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:48, marginBottom:16, opacity:0.4 }}>👤</div>
      <p style={{ color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>Profile not found</p>
    </div>
  );

  const role = ROLES.find(r => r.id === member.role);

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader title="My Profile" subtitle="Manage your personal information and preferences" icon="👤" />

      {/* ── Hero card ────────────────────────────────────── */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-2xl)', overflow:'hidden', marginBottom:24 }}>
        <div style={{ height:4, background:`linear-gradient(90deg, transparent, ${VP_COLORS[member.voicePart]||'var(--gold)'}, transparent)` }} />
        <div style={{ padding:'24px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <Avatar initials={getInitials(member.fullName)} size={80} online={true} color={VP_COLORS[member.voicePart]} />
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(18px,3vw,26px)', fontWeight:900, color:'var(--text-primary)', margin:'0 0 8px' }}>
                {member.fullName}
              </h1>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                <Badge color={VP_COLORS[member.voicePart] || 'var(--gold)'}>{member.voicePart}</Badge>
                {role && <Badge color={role.color || 'var(--gold)'}>{role.icon} {role.label}</Badge>}
                {session?.isAdmin && <Badge color="var(--gold)">🏆 ADMIN</Badge>}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em' }}>
                {member.email} · Member since {formatDate(member.joinDate)}
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ textAlign:'center', background:'var(--bg-raised)', borderRadius:'var(--radius-lg)', padding:'12px 18px' }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:900, color:attendanceColor(attendRate) }}>{attendRate}%</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>Attendance</div>
              </div>
              <div style={{ textAlign:'center', background:'var(--bg-raised)', borderRadius:'var(--radius-lg)', padding:'12px 18px' }}>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:900, color:'var(--color-emerald)' }}>
                  {formatCurrency(totalContribs,'RWF').replace('RWF ','')}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>Contributed</div>
              </div>
            </div>
          </div>
          {member.bio && (
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', fontStyle:'italic', marginTop:16, lineHeight:1.6, borderLeft:`3px solid ${VP_COLORS[member.voicePart]||'var(--gold)'}`, paddingLeft:14 }}>
              "{member.bio}"
            </p>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Personal info */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
            <div style={{ padding:20 }}>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
                PERSONAL INFORMATION
              </div>
              {[
                { label:'Full Name',      value: member.fullName    },
                { label:'Email',          value: member.email       },
                { label:'Phone',          value: member.phone || '—' },
                { label:'Gender',         value: member.gender || '—' },
                { label:'Marital Status', value: member.maritalStatus || '—' },
                { label:'Date of Birth',  value: member.dateOfBirth ? formatDate(member.dateOfBirth) : '—' },
                { label:'Voice Part',     value: member.voicePart   },
                { label:'Role',           value: role?.label || member.role },
                { label:'Member Since',   value: formatDate(member.joinDate) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance heatmap */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-violet),transparent)' }} />
            <div style={{ padding:20 }}>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-violet)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
                ATTENDANCE OVERVIEW
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'Events Tracked', value:myAttRecs.length,  color:'var(--color-info)'   },
                  { label:'Present',        value:presentCount,       color:'var(--color-success)' },
                  { label:'Late',           value:myAttRecs.filter(r=>r.status==='late').length,  color:'var(--color-warning)' },
                  { label:'Excused',        value:myAttRecs.filter(r=>r.status==='excused').length, color:'var(--color-violet)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg-raised)', border:`1px solid ${color}20`, borderRadius:'var(--radius-md)', padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:900, color }}>{value}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>Overall rate</span>
                <span style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:900, color:attendanceColor(attendRate) }}>{attendRate}%</span>
              </div>
              <ProgressBar value={attendRate} max={100} color={attendanceColor(attendRate)} height={6} animate />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EDIT INFO TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'edit' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
          <div style={{ padding:24 }}>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:20 }}>
              ✏️ EDIT PERSONAL INFORMATION
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <Input label="Full Name" value={form.fullName} onChange={set('fullName')} required style={{ gridColumn:'1/-1' }} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+250 788 000 000" icon="📱" />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              <Select label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS.map(g=>({value:g.id,label:g.label}))} placeholder="Select…" />
              <Select label="Marital Status" value={form.maritalStatus} onChange={set('maritalStatus')} options={MARITAL_STATUS.map(m=>({value:m.id,label:m.label}))} placeholder="Select…" />
            </div>
            <Input label="Bio / About Me" multiline rows={3} value={form.bio} onChange={set('bio')} placeholder="Tell your choir family a little about yourself…" maxLength={400} style={{ marginBottom:20 }} />
            <div style={{ display:'flex', gap:10 }}>
              <Button variant="primary" loading={saving} icon="💾" onClick={handleSaveProfile}>Save Changes</Button>
              <Button variant="secondary" onClick={() => setForm({ fullName:member.fullName, phone:member.phone||'', dateOfBirth:member.dateOfBirth||'', gender:member.gender||'', maritalStatus:member.maritalStatus||'', bio:member.bio||'' })}>Reset</Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECURITY TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'security' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-error),transparent)' }} />
          <div style={{ padding:24 }}>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-error)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:20 }}>
              🔒 CHANGE PASSWORD
            </div>
            <InfoBox type="info" style={{ marginBottom:20 }}>
              Choose a strong password with 8+ characters, uppercase letters, numbers and symbols.
            </InfoBox>
            <div style={{ maxWidth:480, display:'flex', flexDirection:'column', gap:12 }}>
              <Input label="Current Password" type="password" value={pwForm.current} onChange={setPw('current')} placeholder="Enter current password" icon="🔒" />
              <Input label="New Password" type="password" value={pwForm.newPw} onChange={setPw('newPw')} placeholder="Create new password" icon="🔑" />
              {/* Strength meter */}
              {pwForm.newPw && (
                <div>
                  <div style={{ display:'flex', gap:4, marginBottom:5 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=strength.score ? strength.color : 'var(--border-subtle)', transition:'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:strength.color, letterSpacing:'0.08em', textTransform:'uppercase' }}>{strength.label}</span>
                </div>
              )}
              <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={setPw('confirm')} placeholder="Repeat new password"
                iconRight={pwForm.confirm && pwForm.newPw && pwForm.confirm===pwForm.newPw ? '✅' : pwForm.confirm ? '❌' : null}
              />
              <div style={{ marginTop:8 }}>
                <Button variant="primary" loading={pwSaving} icon="🔒" onClick={handleChangePassword}>Change Password</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          NOTIFICATIONS TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'notifs' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-info),transparent)' }} />
          <div style={{ padding:24 }}>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-info)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:20 }}>
              🔔 NOTIFICATION PREFERENCES
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:500 }}>
              {[
                { key:'eventReminders',   icon:'📅', label:'Event Reminders',     desc:'Get notified 24h before scheduled events' },
                { key:'attendanceConfirm',icon:'✅', label:'Attendance Confirmed', desc:'Notification when your attendance is marked' },
                { key:'contributions',    icon:'💰', label:'Contributions',        desc:'Receipt and payment confirmations' },
                { key:'messages',         icon:'💬', label:'New Messages',         desc:'Incoming messages and broadcasts' },
                { key:'posts',            icon:'📢', label:'Announcements',        desc:'New announcements and choir news' },
                { key:'excuses',          icon:'📝', label:'Excuse Decisions',     desc:'When your excuse requests are reviewed' },
              ].map(({ key, icon, label, desc }) => (
                <div key={key} onClick={() => toggleNotif(key)}
                  style={{
                    display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                    background: notifPrefs[key] ? 'rgba(59,130,246,0.06)' : 'var(--bg-raised)',
                    border:`1px solid ${notifPrefs[key] ? 'rgba(59,130,246,0.25)' : 'var(--border-subtle)'}`,
                    borderRadius:'var(--radius-md)', cursor:'pointer',
                    transition:'all var(--transition-fast)',
                  }}
                >
                  <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>{desc}</div>
                  </div>
                  {/* Toggle switch */}
                  <div style={{
                    width:44, height:24, borderRadius:12, padding:2, flexShrink:0,
                    background: notifPrefs[key] ? 'var(--color-info)' : 'var(--border-default)',
                    transition:'background 0.25s', position:'relative',
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:'50%', background:'white',
                      position:'absolute', top:2,
                      left: notifPrefs[key] ? 22 : 2,
                      transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MY STATS TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          <StatCard icon="✅" value={`${attendRate}%`}                    label="Attendance Rate"    color={attendanceColor(attendRate)} />
          <StatCard icon="💰" value={formatCurrency(totalContribs,'RWF')} label="Total Contributed"  color="var(--color-emerald)" />
          <StatCard icon="🎵" value={presentCount}                         label="Events Attended"    color="var(--color-violet)" />
          <StatCard icon="📅" value={formatDate(member.joinDate)}          label="Member Since"       color="var(--gold)" />
          {myContribs.length > 0 && (
            <StatCard icon="📋" value={myContribs.length}                  label="Contribution Records" color="var(--color-info)" />
          )}
        </div>
      )}
    </div>
  );
}
