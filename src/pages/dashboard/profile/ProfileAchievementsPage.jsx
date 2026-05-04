/**
 * INHERITANCE CHOIR — Profile: Achievements (Sub-page 4)
 * Badge grid, progress rings, performance history, peer comparison.
 */
import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ALL_BADGES = [
  { id:'perfect_attendance', icon:'🏆', label:'Perfect Attendance',   color:'#C9A84C', desc:'100% attendance for a full calendar month', earned:true,  earnedDate:'2026-02-28', category:'attendance', rarity:3 },
  { id:'attendance_3mo',     icon:'🔥', label:'Streak: 3 months',     color:'#F59E0B', desc:'Attend 3 consecutive months',              earned:true,  earnedDate:'2026-02-01', category:'attendance', rarity:8 },
  { id:'attendance_6mo',     icon:'🔥', label:'Streak: 6 months',     color:'#F59E0B', desc:'Attend 6 consecutive months',              earned:false, progress:4, target:6,   category:'attendance', rarity:5 },
  { id:'attendance_12mo',    icon:'🔥', label:'Streak: 12 months',    color:'#C9A84C', desc:'Attend 12 consecutive months',             earned:false, progress:4, target:12,  category:'attendance', rarity:2 },
  { id:'faithful_tither',    icon:'💎', label:'Faithful Tither',      color:'#3B82F6', desc:'12 consecutive months of tithe',           earned:false, progress:8, target:12,  category:'finance',    rarity:4 },
  { id:'generous_giver',     icon:'💝', label:'Generous Giver',       color:'#EC4899', desc:'Cumulative contributions ≥ RWF 100,000',   earned:false, progress:34, target:100, category:'finance',   rarity:3 },
  { id:'voice_champion',     icon:'🎵', label:'Voice Champion',       color:'#8B5CF6', desc:'Top ranked in voice part for the month',   earned:true,  earnedDate:'2026-01-31', category:'performance', rarity:2 },
  { id:'long_service_1y',    icon:'⭐', label:'1 Year Service',       color:'#F59E0B', desc:'Member for 1 full year',                   earned:true,  earnedDate:'2023-02-15', category:'loyalty',    rarity:15 },
  { id:'long_service_3y',    icon:'⭐', label:'3 Year Service',       color:'#C9A84C', desc:'Member for 3 full years',                  earned:false, progress:3.1, target:3,   category:'loyalty',   rarity:7 },
  { id:'complete_profile',   icon:'✨', label:'Complete Profile',     color:'#22C55E', desc:'Profile completeness reaches 100%',        earned:false, progress:80, target:100, category:'profile',    rarity:10 },
  { id:'community_pillar',   icon:'🤝', label:'Community Pillar',     color:'#06B6D4', desc:'50 prayers + 200 choir messages',           earned:false, progress:28, target:50,  category:'community',  rarity:3 },
  { id:'worship_warrior',    icon:'🙏', label:'Worship Warrior',      color:'#EC4899', desc:'All mandatory services in a quarter',      earned:true,  earnedDate:'2026-03-31', category:'attendance', rarity:6 },
];

const PERF_HISTORY = [
  { month:'Oct', overall:74, attendance:78, contribution:65, engagement:72 },
  { month:'Nov', overall:79, attendance:82, contribution:72, engagement:74 },
  { month:'Dec', overall:82, attendance:88, contribution:75, engagement:70 },
  { month:'Jan', overall:85, attendance:92, contribution:80, engagement:72 },
  { month:'Feb', overall:88, attendance:98, contribution:84, engagement:74 },
  { month:'Mar', overall:87, attendance:95, contribution:82, engagement:76 },
];

function ProgressRing({ pct, color, size = 52 }) {
  const r = size/2 - 5, cx = size/2, cy = size/2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (Math.min(1,pct/100)) * circumference;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2D4A" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.8s ease' }} />
      <text x={cx} y={cy} fill={color} textAnchor="middle" dominantBaseline="central"
        style={{ transform:`rotate(90deg)`, transformOrigin:`${cx}px ${cy}px`, fontSize:10, fontWeight:800, fontFamily:'DM Mono, monospace' }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function ProfileAchievementsPage() {
  const { session } = useOutletContext();
  const [catFilter, setCatFilter] = useState('all');
  const [hoveredBadge, setHoveredBadge] = useState(null);

  const cats = ['all', ...new Set(ALL_BADGES.map(b=>b.category))];
  const filtered = catFilter==='all' ? ALL_BADGES : ALL_BADGES.filter(b=>b.category===catFilter);
  const earned   = ALL_BADGES.filter(b=>b.earned);

  const latest = PERF_HISTORY[PERF_HISTORY.length-1];
  const grade = latest.overall>=90?'A+':latest.overall>=80?'A':latest.overall>=70?'B':latest.overall>=60?'C':'D';
  const gradeColor = { 'A+':'#C9A84C', A:'#22C55E', B:'#3B82F6', C:'#F59E0B', D:'#EF4444' }[grade];

  const radarData = [
    { subject:'Attendance', value:latest.attendance },
    { subject:'Contributions', value:latest.contribution },
    { subject:'Engagement', value:latest.engagement },
  ];

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, marginBottom:24 }}>
        {/* Score card */}
        <div style={{ background:'linear-gradient(135deg,#0F172A,#141E33)', border:'1px solid #1E2D4A', borderRadius:20, padding:'24px 28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h3 style={{ margin:0, fontSize:16, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>Performance Score</h3>
              <p style={{ margin:'4px 0 0', fontSize:12, color:'#64748B' }}>This month vs last 6 months</p>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:`${gradeColor}11`, border:`3px solid ${gradeColor}`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                <span style={{ fontSize:20, fontWeight:900, color:gradeColor, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{latest.overall}</span>
                <span style={{ fontSize:11, color:gradeColor, fontWeight:700 }}>{grade}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={PERF_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="month" stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} />
              <YAxis domain={[60,100]} stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} />
              <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:6, fontSize:10 }} />
              <Line type="monotone" dataKey="overall" stroke="#C9A84C" strokeWidth={2} dot={{ fill:'#C9A84C', r:3 }} name="Overall" />
              <Line type="monotone" dataKey="attendance" stroke="#22C55E" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Attendance" />
              <Line type="monotone" dataKey="contribution" stroke="#3B82F6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Contribution" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar + earned count */}
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:'20px 22px' }}>
          <h4 style={{ margin:'0 0 4px', fontSize:14, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>Skill Radar</h4>
          <p style={{ margin:'0 0 12px', fontSize:11, color:'#64748B' }}>This month</p>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1E2D4A" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#64748B', fontSize:10 }} />
              <Radar dataKey="value" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.15} dot={{ fill:'#C9A84C', r:3 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
            {[{l:'Badges Earned',v:earned.length,c:'#C9A84C'},{l:'Total Badges',v:ALL_BADGES.length,c:'#94A3B8'}].map(s=>(
              <div key={s.l} style={{ background:'#141E33', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:s.c, fontFamily:'DM Mono, monospace' }}>{s.v}</div>
                <div style={{ fontSize:10, color:'#64748B', marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap' }}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ padding:'4px 12px', borderRadius:20, border:'none', background:catFilter===c?'rgba(201,168,76,0.2)':'#141E33', color:catFilter===c?'#C9A84C':'#64748B', fontSize:11, cursor:'pointer', fontWeight:catFilter===c?700:400, textTransform:'capitalize', boxShadow:catFilter===c?'0 0 0 1px rgba(201,168,76,0.3)':'none' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
        {filtered.map(badge => {
          const progress = badge.earned ? 100 : badge.progress && badge.target ? Math.round(badge.progress/badge.target*100) : 0;
          return (
            <div
              key={badge.id}
              onMouseEnter={()=>setHoveredBadge(badge.id)}
              onMouseLeave={()=>setHoveredBadge(null)}
              style={{
                background: badge.earned ? `${badge.color}08` : '#0F172A',
                border:`1px solid ${badge.earned ? badge.color+'33' : '#1E2D4A'}`,
                borderRadius:14, padding:'18px 16px', textAlign:'center',
                filter: badge.earned ? 'none' : 'grayscale(0.7)',
                opacity: badge.earned ? 1 : 0.65,
                transition:'all 0.2s', cursor:'default', position:'relative',
                transform: hoveredBadge===badge.id ? 'translateY(-3px) scale(1.02)' : 'none',
                boxShadow: hoveredBadge===badge.id && badge.earned ? `0 8px 24px ${badge.color}33` : 'none',
              }}
            >
              {badge.earned && (
                <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:'#22C55E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#fff' }}>✓</div>
              )}
              <div style={{ fontSize:32, marginBottom:8 }}>{badge.icon}</div>
              <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:700, color: badge.earned ? badge.color : '#94A3B8' }}>
                {badge.label}
              </p>
              <p style={{ margin:'0 0 10px', fontSize:10, color:'#64748B', lineHeight:1.4 }}>{badge.desc}</p>

              {badge.earned ? (
                <p style={{ margin:0, fontSize:10, color:'#22C55E' }}>Earned {badge.earnedDate}</p>
              ) : badge.progress && badge.target ? (
                <div>
                  <div style={{ height:4, background:'#1E2D4A', borderRadius:2, overflow:'hidden', margin:'0 0 4px' }}>
                    <div style={{ height:'100%', width:`${progress}%`, background:badge.color, borderRadius:2, transition:'width 0.6s ease' }} />
                  </div>
                  <p style={{ margin:0, fontSize:10, color:'#64748B' }}>{badge.progress} / {badge.target}</p>
                </div>
              ) : (
                <p style={{ margin:0, fontSize:10, color:'#374151' }}>Not yet earned</p>
              )}

              <p style={{ margin:'6px 0 0', fontSize:9, color:'#374151' }}>{badge.rarity}/24 members</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
