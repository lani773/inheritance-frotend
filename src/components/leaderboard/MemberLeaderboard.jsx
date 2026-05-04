/**
 * INHERITANCE CHOIR — Member Leaderboard
 * Performance rankings, voice-part competitions, streaks, badges.
 */
import React, { useState, useMemo } from 'react';

const VP_COLORS = {
  Soprano: '#EC4899', Alto: '#8B5CF6', Tenor: '#3B82F6', Bass: '#10B981',
};

const BADGES = {
  perfect_attendance: { icon: '🏆', label: 'Perfect Attendance', color: '#C9A84C' },
  top_contributor:    { icon: '💎', label: 'Top Contributor',    color: '#3B82F6' },
  faithful_tither:    { icon: '🙏', label: 'Faithful Tither',    color: '#22C55E' },
  voice_champion:     { icon: '🎵', label: 'Voice Champion',     color: '#8B5CF6' },
  long_service:       { icon: '⭐', label: 'Long Service',       color: '#F59E0B' },
  most_improved:      { icon: '📈', label: 'Most Improved',      color: '#06B6D4' },
};

// ── Mock members data ──────────────────────────────────────────
const MOCK_MEMBERS = [
  { id:1, name:'Marie Claire Uwimana', voicePart:'Soprano', attendance:98, contributions:52000, streak:12, badges:['perfect_attendance','faithful_tither'], joinYear:2022, avatar:null },
  { id:2, name:'Erica Ingabire',       voicePart:'Soprano', attendance:94, contributions:48000, streak:8,  badges:['top_contributor','voice_champion'],     joinYear:2022, avatar:null },
  { id:3, name:'Jean Baptiste',        voicePart:'Tenor',   attendance:97, contributions:65000, streak:24, badges:['perfect_attendance','long_service','top_contributor'], joinYear:2021, avatar:null },
  { id:4, name:'Diane Mukamana',       voicePart:'Alto',    attendance:92, contributions:41000, streak:6,  badges:['faithful_tither'],                      joinYear:2022, avatar:null },
  { id:5, name:'Patrick Nzabahimana',  voicePart:'Tenor',   attendance:85, contributions:28000, streak:4,  badges:['most_improved'],                        joinYear:2023, avatar:null },
  { id:6, name:'Olivier Rukundo',      voicePart:'Bass',    attendance:88, contributions:31000, streak:5,  badges:['voice_champion'],                       joinYear:2023, avatar:null },
  { id:7, name:'Solange Nkurunziza',   voicePart:'Alto',    attendance:79, contributions:22000, streak:2,  badges:[],                                       joinYear:2024, avatar:null },
  { id:8, name:'Emmanuel Ndayishimiye',voicePart:'Bass',    attendance:71, contributions:18000, streak:1,  badges:[],                                       joinYear:2023, avatar:null },
];

function scoreOf(m, metric) {
  const attScore    = m.attendance;
  const contribNorm = Math.min(100, (m.contributions / 70000) * 100);
  const streakScore = Math.min(100, (m.streak / 24) * 100);
  const overall     = attScore * 0.45 + contribNorm * 0.35 + streakScore * 0.2;

  switch (metric) {
    case 'overall':      return Math.round(overall);
    case 'attendance':   return m.attendance;
    case 'contributions':return Math.round(contribNorm);
    case 'streak':       return m.streak;
    default:             return Math.round(overall);
  }
}

function MedalIcon({ rank }) {
  const medals = { 1: { icon:'🥇', bg:'rgba(201,168,76,0.2)', border:'rgba(201,168,76,0.5)' },
                   2: { icon:'🥈', bg:'rgba(148,163,184,0.15)', border:'rgba(148,163,184,0.4)' },
                   3: { icon:'🥉', bg:'rgba(180,115,50,0.15)',  border:'rgba(180,115,50,0.4)' } };
  const m = medals[rank];
  if (!m) return (
    <div style={{ width:36, height:36, borderRadius:'50%', background:'#1E2D4A',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:12, fontWeight:700, color:'#64748B', fontFamily:'DM Mono, monospace', flexShrink:0 }}>
      {rank}
    </div>
  );
  return (
    <div style={{ width:36, height:36, borderRadius:'50%', background:m.bg, border:`2px solid ${m.border}`,
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
      {m.icon}
    </div>
  );
}

function MemberAvatar({ member, size = 40 }) {
  const color = VP_COLORS[member.voicePart] || '#94A3B8';
  const init  = member.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`${color}22`, border:`2px solid ${color}44`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.3, fontWeight:700, color, fontFamily:'Cinzel, serif' }}>
      {init}
    </div>
  );
}

function StreakBadge({ streak }) {
  if (streak === 0) return null;
  const color = streak >= 12 ? '#C9A84C' : streak >= 6 ? '#F59E0B' : '#94A3B8';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 8px',
      background:`${color}11`, border:`1px solid ${color}33`, borderRadius:20 }}>
      <span style={{ fontSize:12 }}>🔥</span>
      <span style={{ fontSize:11, color, fontWeight:700, fontFamily:'DM Mono, monospace' }}>
        {streak}mo
      </span>
    </div>
  );
}

export default function MemberLeaderboard() {
  const [metric,   setMetric]   = useState('overall');
  const [timespan, setTimespan] = useState('alltime');
  const [vpFilter, setVPFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [view,     setView]     = useState('list'); // list | grid | voice_parts

  const ranked = useMemo(() => {
    return MOCK_MEMBERS
      .filter(m => vpFilter === 'all' || m.voicePart === vpFilter)
      .map(m => ({ ...m, score: scoreOf(m, metric) }))
      .sort((a, b) => b.score - a.score);
  }, [metric, vpFilter]);

  // Voice part rankings
  const vpRankings = useMemo(() => {
    const groups = {};
    Object.keys(VP_COLORS).forEach(vp => {
      groups[vp] = MOCK_MEMBERS
        .filter(m => m.voicePart === vp)
        .map(m => ({ ...m, score: scoreOf(m, metric) }))
        .sort((a, b) => b.score - a.score);
    });
    return groups;
  }, [metric]);

  const METRICS = [
    { id:'overall',       label:'Overall Score',   icon:'🏆' },
    { id:'attendance',    label:'Attendance',      icon:'✅' },
    { id:'contributions', label:'Contributions',   icon:'💰' },
    { id:'streak',        label:'Current Streak',  icon:'🔥' },
  ];

  const topPerformer = ranked[0];

  return (
    <div style={{ fontFamily:'Crimson Pro, serif', color:'#F0F4FF' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>🏆 Leaderboard</h2>
          <p style={{ margin:'3px 0 0', fontSize:13, color:'#64748B' }}>Member performance rankings</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* View switcher */}
          {['list','voice_parts'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'6px 14px', borderRadius:8, border:'none',
              background: view===v ? 'rgba(201,168,76,0.2)' : '#141E33',
              color: view===v ? '#C9A84C' : '#64748B',
              fontSize:12, cursor:'pointer', fontWeight: view===v ? 700 : 400,
              transition:'all 0.15s',
            }}>
              {{ list:'☰ List', voice_parts:'🎵 By Voice Part' }[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {METRICS.map(m => (
          <button key={m.id} onClick={() => setMetric(m.id)} style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'7px 14px', borderRadius:10, border:'none',
            background: metric===m.id ? 'rgba(201,168,76,0.15)' : '#141E33',
            color: metric===m.id ? '#C9A84C' : '#64748B',
            fontSize:12, cursor:'pointer', fontWeight: metric===m.id ? 700 : 400,
            boxShadow: metric===m.id ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
            transition:'all 0.15s',
          }}>
            <span>{m.icon}</span> {m.label}
          </button>
        ))}

        {/* VP filter */}
        <div style={{ marginLeft:'auto' }}>
          <select value={vpFilter} onChange={e => setVPFilter(e.target.value)} style={{
            background:'#141E33', border:'1px solid #1E2D4A', borderRadius:10,
            padding:'7px 12px', color:'#F0F4FF', fontSize:12, cursor:'pointer',
          }}>
            <option value="all">All Voice Parts</option>
            {Object.keys(VP_COLORS).map(vp => <option key={vp} value={vp}>{vp}</option>)}
          </select>
        </div>
      </div>

      {/* ── Top 3 podium ── */}
      {view === 'list' && ranked.length >= 3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:12, marginBottom:24, alignItems:'end' }}>
          {[ranked[1], ranked[0], ranked[2]].map((m, podPos) => {
            const rank     = podPos === 1 ? 1 : podPos === 0 ? 2 : 3;
            const vpColor  = VP_COLORS[m.voicePart] || '#94A3B8';
            const heights  = [180, 220, 170];
            const podColors= ['rgba(148,163,184,0.08)', 'rgba(201,168,76,0.1)', 'rgba(180,115,50,0.08)'];

            return (
              <div key={m.id} style={{
                background: podColors[podPos],
                border:`1px solid ${['#94A3B844','#C9A84C44','#B4733244'][podPos]}`,
                borderRadius:16, padding:'20px 16px',
                textAlign:'center', height:heights[podPos],
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end',
                transition:'transform 0.2s',
                cursor:'pointer',
              }}
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                <MemberAvatar member={m} size={48} />
                <div style={{ marginTop:10, fontSize:18 }}>
                  {['🥈','🥇','🥉'][podPos]}
                </div>
                <p style={{ margin:'6px 0 2px', fontSize:13, fontWeight:700, color:'#F0F4FF' }}>
                  {m.name.split(' ')[0]}
                </p>
                <p style={{ margin:0, fontSize:11, color:vpColor }}>{m.voicePart}</p>
                <div style={{
                  marginTop:8, fontSize:20, fontWeight:900,
                  color:['#94A3B8','#C9A84C','#B47332'][podPos],
                  fontFamily:'DM Mono, monospace',
                }}>
                  {m.score}
                  {metric === 'attendance' && '%'}
                  {metric === 'streak' && <span style={{ fontSize:12 }}>mo</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #1E2D4A' }}>
            <h4 style={{ margin:0, fontSize:14, fontFamily:'Cinzel, serif' }}>
              Full Rankings — {METRICS.find(m=>m.id===metric)?.label}
            </h4>
          </div>

          {ranked.map((m, i) => {
            const vpColor = VP_COLORS[m.voicePart] || '#94A3B8';
            const isExp   = expanded === m.id;
            const pct     = metric === 'streak' ? Math.min(100, (m.score/24)*100) : m.score;

            return (
              <div key={m.id}>
                <div
                  onClick={() => setExpanded(isExp ? null : m.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:14, padding:'14px 20px',
                    borderBottom:'1px solid #0A1628', cursor:'pointer',
                    background: isExp ? 'rgba(201,168,76,0.04)' : 'transparent',
                    transition:'background 0.15s',
                    borderLeft: i < 3 ? `3px solid ${['#C9A84C','#94A3B8','#B47332'][i]}` : '3px solid transparent',
                  }}
                >
                  <MedalIcon rank={i+1} />
                  <MemberAvatar member={m} size={40} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#F0F4FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.name}
                      </p>
                      {m.badges.slice(0,2).map(b => (
                        <span key={b} title={BADGES[b]?.label} style={{ fontSize:14 }}>
                          {BADGES[b]?.icon}
                        </span>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, color:vpColor }}>{m.voicePart}</span>
                      <StreakBadge streak={m.streak} />
                    </div>
                  </div>

                  {/* Score + bar */}
                  <div style={{ minWidth:160 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11, color:'#64748B' }}>{METRICS.find(x=>x.id===metric)?.label}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:'#C9A84C', fontFamily:'DM Mono, monospace' }}>
                        {m.score}{metric==='attendance'?'%':''}{metric==='streak'?' mo':''}
                      </span>
                    </div>
                    <div style={{ height:6, background:'#1E2D4A', borderRadius:3, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', width:`${pct}%`,
                        background: i===0 ? 'linear-gradient(90deg, #A07820, #C9A84C)'
                                  : i===1 ? 'linear-gradient(90deg, #64748B, #94A3B8)'
                                  : `linear-gradient(90deg, ${vpColor}88, ${vpColor})`,
                        borderRadius:3, transition:'width 0.8s ease',
                      }} />
                    </div>
                  </div>

                  <span style={{ fontSize:16, color:'#374151', marginLeft:4 }}>{isExp ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div style={{
                    padding:'16px 20px 20px',
                    background:'rgba(201,168,76,0.03)',
                    borderBottom:'1px solid #1E2D4A',
                    animation:'slideDown 0.2s ease',
                  }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:14 }}>
                      {[
                        { label:'Attendance',    value:`${m.attendance}%`,                    color:'#22C55E' },
                        { label:'Contributions', value:`RWF ${m.contributions.toLocaleString()}`, color:'#C9A84C' },
                        { label:'Streak',        value:`${m.streak} months`,                  color:'#F59E0B' },
                        { label:'Since',         value:m.joinYear,                            color:'#94A3B8' },
                      ].map(s => (
                        <div key={s.label} style={{ background:'#141E33', border:'1px solid #1E2D4A', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:800, color:s.color, fontFamily:'DM Mono, monospace' }}>{s.value}</div>
                          <div style={{ fontSize:10, color:'#64748B', marginTop:3 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {m.badges.length > 0 && (
                      <div>
                        <p style={{ margin:'0 0 8px', fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>Badges</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {m.badges.map(b => {
                            const badge = BADGES[b];
                            if (!badge) return null;
                            return (
                              <div key={b} style={{
                                display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
                                background:`${badge.color}11`, border:`1px solid ${badge.color}33`,
                                borderRadius:20, fontSize:12,
                              }}>
                                <span>{badge.icon}</span>
                                <span style={{ color:badge.color, fontWeight:600 }}>{badge.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Voice Part view ── */}
      {view === 'voice_parts' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 }}>
          {Object.entries(vpRankings).map(([vp, members]) => {
            const color = VP_COLORS[vp];
            return (
              <div key={vp} style={{ background:'#0F172A', border:`1px solid ${color}22`, borderRadius:20, overflow:'hidden' }}>
                <div style={{
                  padding:'14px 18px', borderBottom:`1px solid ${color}22`,
                  background:`${color}08`,
                  display:'flex', alignItems:'center', gap:10,
                }}>
                  <span style={{ fontSize:20 }}>🎵</span>
                  <h4 style={{ margin:0, fontSize:15, color, fontFamily:'Cinzel, serif' }}>{vp}</h4>
                  <span style={{ marginLeft:'auto', fontSize:11, color:'#64748B' }}>{members.length} members</span>
                </div>
                {members.map((m, i) => (
                  <div key={m.id} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
                    borderBottom:'1px solid #0A1628',
                    borderLeft: i===0 ? `3px solid ${color}` : '3px solid transparent',
                  }}>
                    <div style={{ fontSize:20, flexShrink:0 }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':''}
                    </div>
                    <MemberAvatar member={m} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#F0F4FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.name}
                      </p>
                      <StreakBadge streak={m.streak} />
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color, fontFamily:'DM Mono, monospace' }}>
                      {m.score}{metric==='attendance'?'%':''}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
