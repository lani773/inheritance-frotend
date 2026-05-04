/**
 * INHERITANCE CHOIR — Profile: Privacy & Security (Sub-page 5)
 * Password, 2FA setup, active sessions, privacy controls, security log, data export.
 */
import React, { useState, useCallback } from 'react';
import { useAuth }          from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { MFASetup, SecurityLog, SessionsPanel } from '../../../components/session/SessionManager';

// ── Password strength ──────────────────────────────────────────
function passwordStrength(pwd) {
  if (!pwd) return { score:0, label:'', color:'#1E2D4A' };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label:'Too short', color:'#EF4444' },
    { label:'Weak',      color:'#EF4444' },
    { label:'Fair',      color:'#F59E0B' },
    { label:'Good',      color:'#3B82F6' },
    { label:'Strong',    color:'#22C55E' },
    { label:'Very Strong',color:'#22C55E'},
  ];
  return { score, ...levels[score] };
}

function PasswordSection() {
  const { toast } = useNotifications();
  const [form, setForm] = useState({ current:'', newPwd:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [showPwds, setShowPwds] = useState({ current:false, new:false, confirm:false });

  const strength = passwordStrength(form.newPwd);
  const match    = form.newPwd && form.confirm && form.newPwd === form.confirm;
  const noMatch  = form.confirm && form.newPwd !== form.confirm;

  const handleSave = async () => {
    if (!form.current || !form.newPwd || form.newPwd !== form.confirm) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,800));
    setSaving(false);
    setForm({ current:'', newPwd:'', confirm:'' });
    toast('Password changed successfully', { type:'success' });
  };

  const EyeBtn = ({ field }) => (
    <button onClick={()=>setShowPwds(s=>({...s,[field]:!s[field]}))} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:16, padding:4 }}>
      {showPwds[field] ? '🙈' : '👁'}
    </button>
  );

  return (
    <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:24, marginBottom:20 }}>
      <h3 style={{ margin:'0 0 20px', fontSize:15, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>🔒 Change Password</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:400 }}>
        {[
          { key:'current', label:'Current Password' },
          { key:'newPwd',  label:'New Password' },
          { key:'confirm', label:'Confirm New Password' },
        ].map(f=>(
          <div key={f.key}>
            <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{f.label}</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPwds[f.key] ? 'text' : 'password'}
                value={form[f.key]}
                onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                style={{
                  width:'100%', background:'#141E33',
                  border:`1px solid ${f.key==='confirm'&&noMatch?'#EF4444':f.key==='confirm'&&match?'#22C55E':'#1E2D4A'}`,
                  borderRadius:10, padding:'10px 40px 10px 14px', color:'#F0F4FF',
                  fontSize:14, outline:'none', boxSizing:'border-box',
                }}
              />
              <EyeBtn field={f.key} />
            </div>
            {f.key==='newPwd' && form.newPwd && (
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                  {[1,2,3,4,5].map(i=>(
                    <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=strength.score ? strength.color : '#1E2D4A', transition:'background 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontSize:11, color:strength.color }}>{strength.label}</span>
              </div>
            )}
            {f.key==='confirm' && form.confirm && (
              <p style={{ margin:'4px 0 0', fontSize:11, color:noMatch?'#EF4444':'#22C55E' }}>
                {noMatch ? '✗ Passwords do not match' : '✓ Passwords match'}
              </p>
            )}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={!form.current || !form.newPwd || form.newPwd!==form.confirm || saving}
          style={{
            padding:'11px', borderRadius:10, border:'none',
            background: form.current&&form.newPwd===form.confirm&&form.confirm ? 'linear-gradient(135deg,#A07820,#C9A84C)' : '#1E2D4A',
            color:'#080C14', fontSize:13, fontWeight:700,
            cursor: form.current&&form.newPwd===form.confirm&&form.confirm ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? '⏳ Saving…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

function PrivacyControls() {
  const { toast } = useNotifications();
  const [prefs, setPrefs] = useState({
    profileVisibility: 'all_members',
    phoneVisibility:   'admins_only',
    attendanceVisible: true,
    onlineStatus:      true,
    lastSeen:          'exact',
    activityFeed:      true,
  });

  const toggle = (key, value) => {
    setPrefs(p=>({...p,[key]:value}));
    toast('Privacy setting updated', { type:'success' });
  };

  const Select = ({ field, options }) => (
    <select
      value={prefs[field]}
      onChange={e=>toggle(field,e.target.value)}
      style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'6px 10px', color:'#F0F4FF', fontSize:12 }}
    >
      {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  const Toggle = ({ field }) => (
    <div onClick={()=>toggle(field,!prefs[field])} style={{ width:44, height:24, borderRadius:12, cursor:'pointer', position:'relative', background:prefs[field]?'linear-gradient(135deg,#A07820,#C9A84C)':'#1E2D4A', transition:'all 0.3s', boxShadow:prefs[field]?'0 0 12px rgba(201,168,76,0.3)':'none' }}>
      <div style={{ position:'absolute', top:3, left:prefs[field]?23:3, width:18, height:18, borderRadius:'50%', background:prefs[field]?'#fff':'#475569', transition:'left 0.3s' }} />
    </div>
  );

  const rows = [
    { label:'Profile Visibility',  desc:'Who can see your profile in the member directory', control:<Select field="profileVisibility" options={[{v:'all_members',l:'All Members'},{v:'admins_only',l:'Admins Only'},{v:'private',l:'Private'}]} /> },
    { label:'Phone Number',        desc:'Visibility of your phone number',                  control:<Select field="phoneVisibility"   options={[{v:'all_members',l:'All Members'},{v:'admins_only',l:'Admins Only'},{v:'hidden',l:'Hidden'}]} /> },
    { label:'Attendance Record',   desc:'Let others see your attendance history',           control:<Toggle field="attendanceVisible" /> },
    { label:'Online Status',       desc:'Show green dot when you are active',               control:<Toggle field="onlineStatus" /> },
    { label:'Last Seen',           desc:'How your last active time is displayed',           control:<Select field="lastSeen" options={[{v:'exact',l:'Exact time'},{v:'recently',l:'Show "Recently"'},{v:'hidden',l:'Hidden'}]} /> },
    { label:'Activity Feed',       desc:'Allow your posts and activity to appear in feeds', control:<Toggle field="activityFeed" /> },
  ];

  return (
    <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:24, marginBottom:20 }}>
      <h3 style={{ margin:'0 0 20px', fontSize:15, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>👁 Privacy Controls</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {rows.map((r,i)=>(
          <div key={r.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:i<rows.length-1?'1px solid #1E2D4A':'none' }}>
            <div>
              <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:500 }}>{r.label}</p>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>{r.desc}</p>
            </div>
            {r.control}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataManagement() {
  const { toast } = useNotifications();
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const exportData = async () => {
    setExporting(true);
    await new Promise(r=>setTimeout(r,1500));
    setExporting(false);
    toast('Data export prepared — check your email within 5 minutes', { type:'success' });
  };

  return (
    <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:24, marginBottom:20 }}>
      <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>📦 Data Management</h3>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:12 }}>
          <div>
            <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:600 }}>Export My Data</p>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>Download everything: profile, attendance, contributions, messages, posts</p>
          </div>
          <button onClick={exportData} disabled={exporting} style={{ padding:'8px 16px', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, color:'#3B82F6', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {exporting ? '⏳ Preparing…' : '📤 Export'}
          </button>
        </div>

        <div style={{ padding:'14px 18px', background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:showDeleteConfirm?12:0 }}>
            <div>
              <p style={{ margin:0, fontSize:14, color:'#F0F4FF', fontWeight:600 }}>Delete Account</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748B' }}>Permanently delete your account. Admin approval required within 14 days.</p>
            </div>
            <button onClick={()=>setShowDeleteConfirm(s=>!s)} style={{ padding:'7px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#EF4444', fontSize:12, cursor:'pointer' }}>
              {showDeleteConfirm ? 'Cancel' : 'Request Deletion'}
            </button>
          </div>
          {showDeleteConfirm && (
            <div>
              <p style={{ margin:'0 0 8px', fontSize:12, color:'#EF4444' }}>Type <strong>DELETE</strong> to confirm:</p>
              <div style={{ display:'flex', gap:8 }}>
                <input value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="Type DELETE" style={{ flex:1, background:'#141E33', border:`1px solid ${deleteInput==='DELETE'?'#EF4444':'#1E2D4A'}`, borderRadius:8, padding:'8px 12px', color:'#F0F4FF', fontSize:13, outline:'none' }} />
                <button disabled={deleteInput!=='DELETE'} onClick={()=>{toast('Deletion request submitted. Admin will be notified.',{type:'warning'});setShowDeleteConfirm(false);setDeleteInput('');}}
                  style={{ padding:'8px 14px', background:deleteInput==='DELETE'?'#EF4444':'#1E2D4A', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:deleteInput==='DELETE'?'pointer':'not-allowed' }}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 18px', background:'#141E33', borderRadius:10 }}>
          <p style={{ margin:0, fontSize:12, color:'#64748B', lineHeight:1.6 }}>
            <strong style={{ color:'#94A3B8' }}>Data Retention: </strong>Profile and activity data kept for account lifetime. Financial records (contributions) retained for 7 years per legal requirements. All data handled in accordance with applicable data protection law.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSecurityPage() {
  const [tab, setTab] = useState('auth');

  const TABS = [
    { id:'auth',     label:'Authentication',   icon:'🔑' },
    { id:'sessions', label:'Active Sessions',  icon:'💻' },
    { id:'privacy',  label:'Privacy',          icon:'👁' },
    { id:'log',      label:'Security Log',     icon:'📋' },
    { id:'data',     label:'My Data',          icon:'📦' },
  ];

  return (
    <div style={{ padding:'28px 32px' }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 16px',
            borderRadius:10, border:'none',
            background: tab===t.id ? 'rgba(201,168,76,0.15)' : '#141E33',
            color: tab===t.id ? '#C9A84C' : '#64748B',
            fontSize:12, fontWeight: tab===t.id ? 700 : 400, cursor:'pointer',
            boxShadow: tab===t.id ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
            transition:'all 0.15s',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === 'auth' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
          <PasswordSection />
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:24 }}>
            <MFASetup />
          </div>
        </div>
      )}
      {tab === 'sessions' && (
        <div style={{ maxWidth:680 }}>
          <SessionsPanel />
        </div>
      )}
      {tab === 'privacy' && <PrivacyControls />}
      {tab === 'log' && (
        <div style={{ maxWidth:680 }}>
          <SecurityLog />
        </div>
      )}
      {tab === 'data' && (
        <div style={{ maxWidth:680 }}>
          <DataManagement />
        </div>
      )}
    </div>
  );
}
