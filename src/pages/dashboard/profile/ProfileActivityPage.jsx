/**
 * INHERITANCE CHOIR — Profile: Activity (Sub-page 2)
 * Infinite-scroll activity timeline, leave management, event history, attendance heatmap.
 */
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationsContext';

const ACTIVITY_TYPES = {
  attendance:   { icon:'✅', color:'#22C55E', label:'Attendance'    },
  contribution: { icon:'💰', color:'#C9A84C', label:'Contribution'  },
  message:      { icon:'💬', color:'#3B82F6', label:'Message'       },
  post:         { icon:'📰', color:'#8B5CF6', label:'Post'          },
  login:        { icon:'🔑', color:'#64748B', label:'Login'         },
  badge:        { icon:'🏆', color:'#F59E0B', label:'Badge Earned'  },
  leave:        { icon:'📋', color:'#06B6D4', label:'Leave Request' },
  profile:      { icon:'👤', color:'#94A3B8', label:'Profile Update'},
};

function genTimeline(count = 60) {
  const types = Object.keys(ACTIVITY_TYPES);
  const templates = {
    attendance:   (i)=>({ title:'Attendance marked', detail:`Sunday Service — ${['Present','Present','Late','Present'][i%4]}` }),
    contribution: (i)=>({ title:'Contribution recorded', detail:`Tithe RWF ${(8000+i*1200).toLocaleString()} — ${['Verified','Pending'][i%2]}` }),
    message:      ()=>({ title:'Message sent', detail:'Message sent in #general channel' }),
    post:         ()=>({ title:'Post created', detail:'Posted announcement to choir board' }),
    login:        ()=>({ title:'Signed in', detail:'Login from Chrome on Windows · Kigali, Rwanda' }),
    badge:        ()=>({ title:'Badge earned', detail:'🔥 Attendance Streak — 3 consecutive months' }),
    leave:        ()=>({ title:'Leave request', detail:'Annual Leave 15–18 April 2026 — Approved' }),
    profile:      ()=>({ title:'Profile updated', detail:'Phone number and bio updated' }),
  };
  return Array.from({length:count}, (_, i) => {
    const type = types[i % types.length];
    const ts   = Date.now() - i * 3 * 86400000 / count * 24 * 3600 * 1000 - Math.random() * 7200000;
    return { id:`act_${i}`, type, ...templates[type](i), timestamp: ts };
  }).sort((a,b)=>b.timestamp-a.timestamp);
}

function fmtTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 7*86400) return `${Math.floor(diff/86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function groupByDate(events) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now()-86400000).toDateString();
  const groups = {};
  events.forEach(e => {
    const d = new Date(e.timestamp).toDateString();
    const key = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(e.timestamp).toLocaleDateString('en-GB',{weekday:'long',month:'long',day:'numeric'});
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

const LEAVE_TYPES = ['annual','medical','family','travel','other'];
const LEAVE_SEED = [
  { id:'l1', type:'annual',  startDate:'2026-04-15', endDate:'2026-04-18', reason:'Family vacation',  status:'approved', reviewerNote:'Approved — enjoy!', submittedAt:'2026-04-01' },
  { id:'l2', type:'medical', startDate:'2026-02-10', endDate:'2026-02-11', reason:'Doctor appointment',status:'approved', reviewerNote:'Approved', submittedAt:'2026-02-08' },
  { id:'l3', type:'travel',  startDate:'2026-06-20', endDate:'2026-06-25', reason:'Travel to Nairobi', status:'pending',  reviewerNote:'', submittedAt:'2026-04-05' },
];

export default function ProfileActivityPage() {
  const { session }  = useOutletContext();
  const { toast }    = useNotifications();
  const [tab,        setTab]        = useState('timeline');
  const [all]                       = useState(genTimeline(60));
  const [shown,      setShown]      = useState(20);
  const [typeFilter, setTypeFilter] = useState('all');
  const [leaves,     setLeaves]     = useState(LEAVE_SEED);
  const [showForm,   setShowForm]   = useState(false);
  const [leaveForm,  setLeaveForm]  = useState({ type:'annual', startDate:'', endDate:'', reason:'', notify:true });
  const loaderRef = useRef(null);

  const filtered = useMemo(()=>
    all.filter(a => typeFilter==='all' || a.type===typeFilter)
  , [all, typeFilter]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setShown(s => Math.min(s+20, filtered.length));
    }, { threshold:0.5 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [filtered.length]);

  const visible   = filtered.slice(0, shown);
  const grouped   = groupByDate(visible);

  const submitLeave = () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast('Fill all required fields', { type:'warning' }); return;
    }
    setLeaves(l => [{ ...leaveForm, id:`l_${Date.now()}`, status:'pending', reviewerNote:'', submittedAt:new Date().toISOString().split('T')[0] }, ...l]);
    setLeaveForm({ type:'annual', startDate:'', endDate:'', reason:'', notify:true });
    setShowForm(false);
    toast('Leave request submitted', { type:'success' });
  };

  const STATUS = { approved:{ color:'#22C55E', label:'Approved' }, pending:{ color:'#F59E0B', label:'Pending' }, rejected:{ color:'#EF4444', label:'Rejected' } };

  return (
    <div style={{ padding:'28px 32px' }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {[
          { id:'timeline',  label:'Activity Timeline', icon:'📋' },
          { id:'leave',     label:'Leave Requests',    icon:'📅' },
          { id:'events',    label:'Event History',     icon:'🎵' },
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 18px',
            borderRadius:10, border:'none',
            background: tab===t.id ? 'rgba(201,168,76,0.15)' : '#141E33',
            color: tab===t.id ? '#C9A84C' : '#64748B',
            fontSize:13, fontWeight: tab===t.id ? 700 : 400, cursor:'pointer',
            boxShadow: tab===t.id ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
            transition:'all 0.15s',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Activity Timeline ── */}
      {tab === 'timeline' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
            <button onClick={()=>setTypeFilter('all')} style={{ padding:'4px 12px', borderRadius:20, border:'none', background:typeFilter==='all'?'rgba(201,168,76,0.15)':'#141E33', color:typeFilter==='all'?'#C9A84C':'#64748B', fontSize:11, cursor:'pointer', fontWeight:typeFilter==='all'?700:400 }}>All</button>
            {Object.entries(ACTIVITY_TYPES).map(([type, cfg])=>(
              <button key={type} onClick={()=>setTypeFilter(typeFilter===type?'all':type)} style={{ padding:'4px 10px', borderRadius:20, border:'none', background:typeFilter===type?`${cfg.color}15`:'transparent', color:typeFilter===type?cfg.color:'#374151', fontSize:11, cursor:'pointer' }}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ position:'relative' }}>
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ height:1, background:'#1E2D4A', flex:1 }} />
                  <span style={{ fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>{date}</span>
                  <div style={{ height:1, background:'#1E2D4A', flex:1 }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {events.map((event, i) => {
                    const cfg = ACTIVITY_TYPES[event.type] || ACTIVITY_TYPES.login;
                    return (
                      <div key={event.id} style={{
                        display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
                        background:'#0F172A', border:`1px solid ${cfg.color}11`,
                        borderRadius:12, borderLeft:`2px solid ${cfg.color}`,
                        animation:`slideDown 0.3s ease ${i*0.03}s both`,
                      }}>
                        <div style={{
                          width:32, height:32, borderRadius:8, flexShrink:0,
                          background:`${cfg.color}11`, border:`1px solid ${cfg.color}22`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
                        }}>
                          {cfg.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:500 }}>{event.title}</p>
                          <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.detail}</p>
                        </div>
                        <span style={{ fontSize:10, color:'#374151', flexShrink:0 }}>{fmtTime(event.timestamp)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Infinite scroll loader */}
            {shown < filtered.length && (
              <div ref={loaderRef} style={{ textAlign:'center', padding:'16px', color:'#374151', fontSize:12 }}>
                Loading more…
              </div>
            )}
            {shown >= filtered.length && filtered.length > 0 && (
              <div style={{ textAlign:'center', padding:'16px', color:'#374151', fontSize:11 }}>
                — {filtered.length} activities shown —
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Leave Requests ── */}
      {tab === 'leave' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ margin:0, fontSize:16, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>Leave Requests</h3>
            <button onClick={()=>setShowForm(s=>!s)} style={{ padding:'8px 16px', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, color:'#C9A84C', fontSize:13, cursor:'pointer', fontWeight:600 }}>
              + Request Leave
            </button>
          </div>

          {showForm && (
            <div style={{ background:'#0F172A', border:'1px solid rgba(201,168,76,0.3)', borderRadius:16, padding:22, marginBottom:20 }}>
              <h4 style={{ margin:'0 0 16px', fontFamily:'Cinzel, serif', color:'#C9A84C', fontSize:14 }}>New Leave Request</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Leave Type</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {LEAVE_TYPES.map(t=>(
                      <label key={t} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 12px', background:leaveForm.type===t?'rgba(201,168,76,0.1)':'#141E33', border:`1px solid ${leaveForm.type===t?'#C9A84C44':'#1E2D4A'}`, borderRadius:8, cursor:'pointer' }}>
                        <input type="radio" name="ltype" value={t} checked={leaveForm.type===t} onChange={()=>setLeaveForm(f=>({...f,type:t}))} style={{ accentColor:'#C9A84C' }} />
                        <span style={{ fontSize:12, color:leaveForm.type===t?'#C9A84C':'#94A3B8', textTransform:'capitalize' }}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[{k:'startDate',l:'Start Date'},{k:'endDate',l:'End Date'}].map(f=>(
                    <div key={f.k}>
                      <label style={{ display:'block', fontSize:11, color:'#64748B', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{f.l}</label>
                      <input type="date" value={leaveForm[f.k]} min={new Date().toISOString().split('T')[0]} onChange={e=>setLeaveForm(x=>({...x,[f.k]:e.target.value}))} style={{ width:'100%', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'9px 12px', color:'#F0F4FF', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                    </div>
                  ))}
                </div>
                <textarea value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))} placeholder="Reason for leave…" rows={3} style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, padding:'9px 12px', color:'#F0F4FF', fontSize:13, outline:'none', resize:'vertical', fontFamily:'Crimson Pro, serif' }} />
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={leaveForm.notify} onChange={e=>setLeaveForm(f=>({...f,notify:e.target.checked}))} style={{ accentColor:'#C9A84C' }} />
                  <span style={{ fontSize:12, color:'#94A3B8' }}>Notify section lead and choir director</span>
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:'9px', background:'#141E33', border:'1px solid #1E2D4A', borderRadius:8, color:'#64748B', cursor:'pointer', fontSize:12 }}>Cancel</button>
                  <button onClick={submitLeave} disabled={!leaveForm.startDate||!leaveForm.endDate||!leaveForm.reason} style={{ flex:2, padding:'9px', background:leaveForm.startDate&&leaveForm.endDate&&leaveForm.reason?'linear-gradient(135deg,#A07820,#C9A84C)':'#1E2D4A', border:'none', borderRadius:8, color:'#080C14', fontWeight:700, cursor:'pointer', fontSize:12 }}>Submit Request</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {leaves.map(leave => {
              const s = STATUS[leave.status] || STATUS.pending;
              const days = Math.ceil((new Date(leave.endDate)-new Date(leave.startDate))/86400000)+1;
              return (
                <div key={leave.id} style={{ background:'#0F172A', border:`1px solid ${s.color}22`, borderRadius:14, padding:'16px 18px', borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#F0F4FF', textTransform:'capitalize' }}>{leave.type} Leave</span>
                      <span style={{ marginLeft:10, fontSize:11, color:'#64748B' }}>{days} day{days!==1?'s':''}</span>
                    </div>
                    <span style={{ fontSize:11, color:s.color, background:`${s.color}11`, border:`1px solid ${s.color}33`, borderRadius:6, padding:'2px 8px', fontWeight:700 }}>{s.label}</span>
                  </div>
                  <p style={{ margin:'0 0 6px', fontSize:12, color:'#94A3B8' }}>{leave.startDate} → {leave.endDate}</p>
                  <p style={{ margin:'0 0 6px', fontSize:12, color:'#94A3B8' }}>{leave.reason}</p>
                  {leave.reviewerNote && <p style={{ margin:0, fontSize:11, color: s.color, fontStyle:'italic' }}>"{leave.reviewerNote}"</p>}
                  <p style={{ margin:'6px 0 0', fontSize:10, color:'#374151' }}>Submitted {leave.submittedAt}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Event History ── */}
      {tab === 'events' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Total Events', value:24, color:'#C9A84C' },
              { label:'Attended',     value:21, color:'#22C55E' },
              { label:'Rate',         value:'87.5%', color:'#3B82F6' },
            ].map(s=>(
              <div key={s.label} style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:14, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:'DM Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize:11, color:'#64748B', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, overflow:'hidden' }}>
            {[
              { event:'Weekly Rehearsal', date:'2026-03-28', status:'present', type:'rehearsal', time:'09:08 AM' },
              { event:'Sunday Service',   date:'2026-03-24', status:'present', type:'service',   time:'07:55 AM' },
              { event:'Directors Mtg',    date:'2026-03-20', status:'late',    type:'meeting',   time:'17:24 PM' },
              { event:'Voice Workshop',   date:'2026-03-15', status:'excused', type:'workshop',  time:'' },
              { event:'Sunday Service',   date:'2026-03-10', status:'absent',  type:'service',   time:'' },
            ].map((r,i,arr)=>{
              const STATUS_CFG = { present:{color:'#22C55E',l:'Present'}, late:{color:'#F59E0B',l:'Late'}, excused:{color:'#3B82F6',l:'Excused'}, absent:{color:'#EF4444',l:'Absent'} };
              const sc = STATUS_CFG[r.status];
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 18px', borderBottom:i<arr.length-1?'1px solid #0A1628':'none', borderLeft:`2px solid ${sc.color}` }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:13, color:'#F0F4FF', fontWeight:500 }}>{r.event}</p>
                    <p style={{ margin:'2px 0 0', fontSize:11, color:'#64748B' }}>{r.date}{r.time&&` · Check-in: ${r.time}`}</p>
                  </div>
                  <span style={{ fontSize:11, color:sc.color, background:`${sc.color}11`, border:`1px solid ${sc.color}33`, borderRadius:6, padding:'2px 8px', fontWeight:700 }}>{sc.l}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
