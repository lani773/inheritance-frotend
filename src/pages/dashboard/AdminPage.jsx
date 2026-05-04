/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Admin Panel  (Task 9)
   Admin-only: registrations, audit log, reminders, system health
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useToast }  from '../../context/ToastContext';
import { useAuth }   from '../../context/AuthContext';
import {
  membersService, notificationsService, auditService, messagesService,
} from '../../services/index';
import { ROLES }  from '../../config/constants';
import {
  Avatar, Badge, PageHeader, Tabs, EmptyState, InfoBox, StatCard,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { Select } from '../../components/shared/index';
import { formatDate, getInitials } from '../../utils/index';
import Storage from '../../storage/engine';

export default function AdminPage() {
  const { session }   = useAuth();
  const { success: toastOK, info: toastInfo, error: toastErr } = useToast();

  const [tab, setTab] = useState('registrations');

  const tabs = [
    { id:'registrations', label:'Registrations', icon:'📋' },
    { id:'reminders',     label:'Reminders',     icon:'📧' },
    { id:'audit',         label:'Audit Log',     icon:'📜' },
    { id:'health',        label:'System Health', icon:'💚' },
  ];

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>
      <PageHeader title="Admin Panel" subtitle="System administration and management" icon="⚙️" />
      <InfoBox type="warning" style={{ marginBottom:20 }}>
        🔐 Admin-only area. Actions here affect all choir members and the entire system.
      </InfoBox>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'registrations' && <RegistrationsTab toastOK={toastOK} toastInfo={toastInfo} />}
      {tab === 'reminders'     && <RemindersTab toastOK={toastOK} session={session} />}
      {tab === 'audit'         && <AuditTab />}
      {tab === 'health'        && <HealthTab />}
    </div>
  );
}

/* ── Registrations sub-tab ───────────────────────────────────── */
function RegistrationsTab({ toastOK, toastInfo }) {
  const [pending, setPending] = useState(() => membersService.getPending());
  const [approving, setApproving] = useState(null);
  const reload = () => setPending(membersService.getPending());

  const handleApprove = async (member) => {
    setApproving(member.id);
    await new Promise(r => setTimeout(r, 350));
    membersService.approve(member.id);
    notificationsService.add({ type:'success', title:`${member.fullName} approved`, message:'New member joined the choir!', actionUrl:'/dashboard/members' });
    toastOK(`${member.fullName} approved and added to the choir!`);
    setApproving(null);
    reload();
  };

  const handleReject = (member) => {
    membersService.reject(member.id);
    toastInfo(`${member.fullName}'s registration rejected`);
    reload();
  };

  return (
    <div>
      {pending.length === 0 ? (
        <EmptyState icon="✅" title="All caught up!" description="No pending registration requests." />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pending.map(m => (
            <div key={m.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-warning),transparent)' }} />
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <Avatar initials={getInitials(m.fullName)} size={50} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:5 }}>{m.fullName}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <Badge color="var(--color-warning)" size="xs">{m.voicePart}</Badge>
                    <Badge color="var(--text-muted)" size="xs">{m.email}</Badge>
                    {m.phone && <Badge color="var(--text-muted)" size="xs">{m.phone}</Badge>}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', marginTop:5 }}>Applied {formatDate(m.joinDate, 'relative')}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <Button variant="success" size="sm" icon="✅" loading={approving===m.id} onClick={() => handleApprove(m)}>Approve</Button>
                  <Button variant="danger"  size="sm" icon="❌" onClick={() => handleReject(m)}>Reject</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Reminders sub-tab ───────────────────────────────────────── */
function RemindersTab({ toastOK, session }) {
  const members = useMemo(() => membersService.getActive(), []);
  const [form, setForm] = useState({ target:'all', voicePart:'', subject:'', body:'' });
  const [sending, setSending] = useState(false);

  const set = f => v => setForm(p => ({ ...p, [f]: v }));

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) { return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 400));

    let recipients = members;
    if (form.target === 'voice' && form.voicePart) {
      recipients = members.filter(m => m.voicePart === form.voicePart);
    }

    messagesService.send({
      senderId:    session?.userId,
      recipientId: null,
      isBroadcast: true,
      toVoicePart: form.voicePart || null,
      subject:     form.subject,
      body:        form.body,
      sentAt:      new Date().toISOString(),
      readBy:      [session?.userId],
    });

    notificationsService.add({
      type:'success',
      title:`Reminder sent to ${recipients.length} members`,
      message: form.subject,
      actionUrl:'/dashboard/messages',
    });

    toastOK(`Reminder sent to ${recipients.length} member${recipients.length!==1?'s':''}!`);
    setForm({ target:'all', voicePart:'', subject:'', body:'' });
    setSending(false);
  };

  return (
    <div style={{ maxWidth:600 }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>
        Send a broadcast message or reminder to all members or a specific voice part.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <Select label="Recipients" value={form.target} onChange={set('target')}
          options={[{value:'all',label:'All Active Members'},{value:'voice',label:'Specific Voice Part'}]}
        />
        {form.target === 'voice' && (
          <Select label="Voice Part" value={form.voicePart} onChange={set('voicePart')}
            options={[{value:'',label:'Select…'},{value:'Soprano',label:'Soprano'},{value:'Alto',label:'Alto'},{value:'Tenor',label:'Tenor'},{value:'Bass',label:'Bass'}]}
          />
        )}
      </div>
      <Input label="Subject" value={form.subject} onChange={set('subject')} placeholder="Reminder: Sunday Rehearsal…" required style={{ marginBottom:12 }} />
      <Input label="Message Body" multiline rows={5} value={form.body} onChange={set('body')} placeholder="Write your reminder message…" required maxLength={1000} style={{ marginBottom:18 }} />

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Button variant="primary" loading={sending} icon="📧" onClick={handleSend} disabled={!form.subject.trim() || !form.body.trim()}>
          Send Reminder
        </Button>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>
          {form.target==='voice'&&form.voicePart
            ? `${members.filter(m=>m.voicePart===form.voicePart).length} recipients`
            : `${members.length} recipients`
          }
        </span>
      </div>
    </div>
  );
}

/* ── Audit Log sub-tab ───────────────────────────────────────── */
function AuditTab() {
  const auditLog = useMemo(() => auditService.getAll().slice(0, 50), []);

  const ACTION_ICONS = {
    'member.created':        '👤',
    'member.updated':        '✏️',
    'member.deleted':        '🗑',
    'event.created':         '📅',
    'contribution.recorded': '💰',
    'attendance.saved':      '✅',
    'auth.login':            '🔐',
    'auth.logout':           '🚪',
  };

  return (
    <div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:14 }}>
        SHOWING LAST {auditLog.length} ACTIONS
      </div>
      {auditLog.length === 0 ? (
        <EmptyState icon="📜" title="No audit entries" description="System actions will appear here." />
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
              <thead>
                <tr style={{ background:'var(--bg-raised)' }}>
                  {['Action','User','Resource','Details','Time'].map(h => (
                    <th key={h} style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'left', borderBottom:'2px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry, i) => (
                  <tr key={entry.id||i} style={{ borderBottom:'1px solid var(--border-subtle)', transition:'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:14 }}>{ACTION_ICONS[entry.action] || '⬡'}</span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-secondary)' }}>{entry.action}</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)' }}>{entry.userEmail}</td>
                    <td style={{ padding:'9px 12px' }}><Badge color="var(--text-muted)" size="xs">{entry.resource}</Badge></td>
                    <td style={{ padding:'9px 12px', fontFamily:'var(--font-body)', fontSize:11, color:'var(--text-secondary)' }}>
                      {entry.newValues ? Object.entries(entry.newValues).slice(0,1).map(([k,v]) => `${k}: ${String(v).slice(0,20)}`).join('') : '—'}
                    </td>
                    <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{formatDate(entry.timestamp,'relative')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── System Health sub-tab ───────────────────────────────────── */
function HealthTab() {
  const storageKeys = Object.keys(localStorage).filter(k => k.startsWith('choir_'));
  const storageSize = storageKeys.reduce((s, k) => s + ((localStorage.getItem(k)||'').length * 2), 0);
  const sizeMB = (storageSize / (1024 * 1024)).toFixed(2);
  const members   = membersService.getAll();
  const sessions  = Storage.get('choir_session') ? 1 : 0;

  const handleClearData = () => {
    if (window.confirm('⚠️ This will clear ALL choir data and re-seed demo data. Continue?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard icon="💾" value={`${sizeMB} MB`}   label="Storage Used"    color="var(--color-info)"    />
        <StatCard icon="🔑" value={storageKeys.length} label="Storage Keys"   color="var(--gold)"          />
        <StatCard icon="👥" value={members.length}     label="Total Members"  color="var(--color-success)" />
        <StatCard icon="🔐" value={sessions}           label="Active Session" color="var(--color-violet)"  />
      </div>

      {/* Storage breakdown */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-xl)', overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-info),transparent)' }} />
        <div style={{ padding:20 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-info)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
            💾 STORAGE BREAKDOWN
          </div>
          {storageKeys.map(key => {
            const val  = localStorage.getItem(key) || '';
            const kb   = (val.length * 2 / 1024).toFixed(1);
            const pct  = Math.round((val.length * 2 / storageSize) * 100) || 0;
            return (
              <div key={key} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.06em' }}>{key.replace('choir_','')}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-secondary)' }}>{kb} KB</span>
                </div>
                <div style={{ height:4, background:'var(--border-subtle)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:'var(--color-info)', borderRadius:2, transition:'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background:'var(--bg-card)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,transparent,var(--color-error),transparent)' }} />
        <div style={{ padding:20 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:11, color:'var(--color-error)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>⚠️ DANGER ZONE</div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:16 }}>
            Clear all data and reset to the default demo state. This cannot be undone and will log you out.
          </p>
          <Button variant="danger" icon="🗑" onClick={handleClearData}>Reset All Data</Button>
        </div>
      </div>
    </div>
  );
}
