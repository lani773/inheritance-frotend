/**
 * INHERITANCE CHOIR — Profile: Overview (Sub-page 1)
 * Hero stats, sparklines, quick actions, completeness checklist.
 */
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../../../context/NotificationsContext';

const VP_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };

// Mock sparkline data
function genMonths(base, variance) {
  return Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-5+i);
    return { month:d.toLocaleDateString('en-US',{month:'short'}), value: Math.max(0,base+(Math.random()-0.4)*variance) };
  });
}

const COMPLETENESS_FIELDS = [
  { key:'fullName',          label:'Full Name',         required:true  },
  { key:'email',             label:'Email Address',     required:true  },
  { key:'phone',             label:'Phone Number',      required:false },
  { key:'dateOfBirth',       label:'Date of Birth',     required:false },
  { key:'gender',            label:'Gender',            required:false },
  { key:'maritalStatus',     label:'Marital Status',    required:false },
  { key:'bio',               label:'Bio / About Me',    required:false },
  { key:'avatarUrl',         label:'Profile Photo',     required:false },
  { key:'voicePart',         label:'Voice Part',        required:true  },
  { key:'emergencyContact',  label:'Emergency Contact', required:false },
];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background:'#0F172A', border:`1px solid ${color}22`,
      borderRadius:14, padding:'18px 20px',
      borderLeft:`3px solid ${color}`,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <span style={{ fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:800, color, fontFamily:'DM Mono, monospace', lineHeight:1, marginBottom:4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:11, color:'#64748B' }}>{sub}</div>}
    </div>
  );
}

function SparkCard({ title, data, color, type = 'area', unit = '' }) {
  const Chart = type === 'bar' ? BarChart : LineChart;
  const DataEl = type === 'bar' ? Bar : Line;
  return (
    <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:14, padding:'16px 18px' }}>
      <p style={{ margin:'0 0 12px', fontSize:12, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</p>
      <ResponsiveContainer width="100%" height={70}>
        {type === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`sg_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#sg_${color.replace('#','')})`} strokeWidth={2} dot={false} />
            <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:6, fontSize:11 }}
                     formatter={v=>[`${v.toFixed(0)}${unit}`,title]} labelFormatter={l=>l} />
          </AreaChart>
        ) : (
          <BarChart data={data}>
            <Bar dataKey="value" fill={color} radius={[3,3,0,0]} />
            <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:6, fontSize:11 }}
                     formatter={v=>[`${v.toFixed(0)}${unit}`,title]} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        {data.map(d => <span key={d.month} style={{ fontSize:9, color:'#374151' }}>{d.month}</span>)}
      </div>
    </div>
  );
}

export default function ProfileOverviewPage() {
  const { session, completeness } = useOutletContext();
  const { toast }    = useNotifications();
  const navigate     = useNavigate();
  const vpColor      = VP_COLORS[session?.voicePart] || '#C9A84C';

  const [attData]    = useState(() => genMonths(82, 18));
  const [contribData]= useState(() => genMonths(12000, 6000));
  const [showFields, setShowFields] = useState(false);

  const missingFields = COMPLETENESS_FIELDS.filter(f => !session?.[f.key]);

  const QUICK_ACTIONS = [
    { icon:'✏️',  label:'Edit Profile',       action:()=> navigate('/dashboard/my-profile/activity'), color:'#3B82F6' },
    { icon:'💰',  label:'My Contributions',   action:()=> navigate('/dashboard/my-profile/contributions'), color:'#C9A84C' },
    { icon:'🏆',  label:'My Achievements',    action:()=> navigate('/dashboard/my-profile/achievements'), color:'#F59E0B' },
    { icon:'🔐',  label:'Security Settings',  action:()=> navigate('/dashboard/my-profile/security'), color:'#22C55E' },
    { icon:'📊',  label:'Full Activity Log',  action:()=> navigate('/dashboard/my-profile/activity'), color:'#8B5CF6' },
    { icon:'📄',  label:'Export My Data',     action:()=> toast('Preparing data export…', { type:'info' }), color:'#94A3B8' },
  ];

  const currentRate = attData[attData.length-1]?.value.toFixed(0) || 0;
  const currentMonthContrib = contribData[contribData.length-1]?.value || 0;

  return (
    <div style={{ padding:'28px 32px' }}>
      {/* Top stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14, marginBottom:24 }}>
        <StatCard label="Attendance Rate"  value={`${currentRate}%`}
          sub={currentRate >= 80 ? '✓ Above target' : '⚠ Below 80% target'}
          color={currentRate >= 80 ? '#22C55E' : '#F59E0B'} icon="✅" />
        <StatCard label="This Month"
          value={`RWF ${(currentMonthContrib/1000).toFixed(0)}K`}
          sub="Contribution" color="#C9A84C" icon="💰" />
        <StatCard label="Streak"  value={`${session?.attendanceStreak || 4}mo`}
          sub="Consecutive months" color="#F59E0B" icon="🔥" />
        <StatCard label="Total Given"
          value={`RWF ${((session?.contributionTotal||34000)/1000).toFixed(0)}K`}
          sub="All-time" color="#3B82F6" icon="🎵" />
      </div>

      {/* Sparklines row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14, marginBottom:24 }}>
        <SparkCard title="Attendance Rate %" data={attData.map(d=>({...d,value:d.value}))} color={vpColor} type="area" unit="%" />
        <SparkCard title="Monthly Contributions" data={contribData} color="#C9A84C" type="bar" unit="" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        {/* Quick actions */}
        <div>
          <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
            Quick Actions
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:24 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={a.action} style={{
                background:`${a.color}08`, border:`1px solid ${a.color}22`,
                borderRadius:14, padding:'16px 14px', cursor:'pointer',
                textAlign:'center', transition:'all 0.2s',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${a.color}22`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ fontSize:24, marginBottom:8 }}>{a.icon}</div>
                <div style={{ fontSize:12, color:a.color, fontWeight:600 }}>{a.label}</div>
              </button>
            ))}
          </div>

          {/* Recent Notifications preview */}
          <h3 style={{ margin:'0 0 12px', fontSize:15, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
            Recent Notifications
          </h3>
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:14, overflow:'hidden' }}>
            {[
              { icon:'✅', text:'Attendance marked for Sunday Service', time:'2h ago', color:'#22C55E' },
              { icon:'💰', text:'Contribution RWF 10,000 verified by treasurer', time:'1d ago', color:'#C9A84C' },
              { icon:'🔔', text:'Rehearsal reminder: Friday 6PM at Main Church', time:'2d ago', color:'#3B82F6' },
              { icon:'🏆', text:'You earned the "Faithful Tither" badge!', time:'1w ago', color:'#F59E0B' },
            ].map((n, i, arr) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i<arr.length-1 ? '1px solid #0A1628' : 'none' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:`${n.color}11`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                  {n.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:12, color:'#F0F4FF' }}>{n.text}</p>
                </div>
                <span style={{ fontSize:10, color:'#374151', flexShrink:0 }}>{n.time}</span>
              </div>
            ))}
            <div style={{ padding:'10px 16px', borderTop:'1px solid #1E2D4A' }}>
              <button onClick={()=>navigate('/dashboard/my-profile/activity')} style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                View all notifications →
              </button>
            </div>
          </div>
        </div>

        {/* Profile completeness card */}
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, overflow:'hidden', position:'sticky', top:20 }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid #1E2D4A', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h4 style={{ margin:0, fontSize:14, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>Profile Completeness</h4>
            <button onClick={()=>setShowFields(s=>!s)} style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:12 }}>
              {showFields ? 'Hide' : 'Details'}
            </button>
          </div>

          <div style={{ padding:'20px 18px' }}>
            {/* Big progress bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#94A3B8' }}>Your score</span>
                <span style={{ fontSize:16, fontWeight:800, color: completeness>=80?'#22C55E':completeness>=60?'#F59E0B':'#EF4444', fontFamily:'DM Mono, monospace' }}>
                  {completeness}%
                </span>
              </div>
              <div style={{ height:10, background:'#1E2D4A', borderRadius:5, overflow:'hidden' }}>
                <div style={{
                  height:'100%', width:`${completeness}%`,
                  background: completeness>=80 ? 'linear-gradient(90deg,#22C55E,#4ADE80)' : completeness>=60 ? 'linear-gradient(90deg,#F59E0B,#FBBF24)' : 'linear-gradient(90deg,#EF4444,#F87171)',
                  transition:'width 0.8s ease', borderRadius:5,
                }} />
              </div>
            </div>

            {showFields && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {COMPLETENESS_FIELDS.map(f => {
                  const filled = !!session?.[f.key];
                  return (
                    <div key={f.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, color: filled ? '#22C55E' : '#EF4444' }}>{filled ? '✓' : '○'}</span>
                      <span style={{ flex:1, fontSize:12, color: filled ? '#94A3B8' : '#F0F4FF' }}>{f.label}</span>
                      {f.required && !filled && (
                        <span style={{ fontSize:9, color:'#EF4444', background:'#EF444411', borderRadius:4, padding:'1px 4px' }}>Required</span>
                      )}
                      {!filled && (
                        <button onClick={()=>navigate('/dashboard/my-profile/activity')} style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:11 }}>
                          Add →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {completeness === 100 ? (
              <div style={{ textAlign:'center', marginTop:16 }}>
                <span style={{ fontSize:32 }}>🏆</span>
                <p style={{ margin:'6px 0 0', fontSize:12, color:'#22C55E', fontWeight:700 }}>Profile Complete!</p>
              </div>
            ) : (
              <div style={{ marginTop:14, background:'rgba(201,168,76,0.06)', borderRadius:10, padding:'10px 12px' }}>
                <p style={{ margin:0, fontSize:12, color:'#94A3B8', lineHeight:1.5 }}>
                  Complete <strong style={{ color:'#C9A84C' }}>{missingFields.length} more field{missingFields.length!==1?'s':''}</strong> to reach 100% and unlock the Complete Profile badge.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
