/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Dashboard Overview Page  (Enhanced v2)

   Design: Holographic glassmorphism · Neon glow · Luxury command center

   Sections:
   ① Hero greeting + Health Score gauge
   ② 5 animated KPI glass cards with sparklines
   ③ Quick-action shortcut rail
   ④ Contribution 12-mo area chart | Attendance neon line chart
   ⑤ Voice distribution radial | Top contributors leaderboard
   ⑥ Upcoming events timeline strip | At-risk member alerts
   ⑦ Live activity feed with neon nodes
   ⑧ Year-over-year bars | Member growth area

   NEW vs v1:
   ✦ Holographic glassmorphism panels with animated iridescent rims
   ✦ Inject-once CSS keyframes
   ✦ Hero section: time-aware greeting, animated music waveform bg
   ✦ Finance Health Score circular gauge with animated arc
   ✦ KPI cards: animated count-up number, neon glow on hover, sparklines
   ✦ Quick-action shortcut rail (6 buttons → navigate to pages)
   ✦ Custom SVG holographic area charts (gold gradient fill)
   ✦ Neon smooth-curve line chart (attendance by section)
   ✦ Radial voice donut with hover expand + neon glow
   ✦ Neon leaderboard with gradient bars
   ✦ Upcoming events: countdown rings + urgency color
   ✦ At-risk panel with pulsing red border
   ✦ Activity feed: glowing type-colored nodes + live dot
   ✦ "Today at a glance" stat summary row
   ═══════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../../context/AuthContext';
import {
  getContributionTrend, getAttendanceTrend, getVoiceDistribution,
  getTopContributors, getYoYContributions, getMemberGrowth,
  getMemberAttendanceRates, getSummaryStats,
} from '../../utils/analytics';
import { eventsService, auditService } from '../../services/index';
import { Avatar } from '../../components/shared/index';
import { formatDate, formatCurrency, daysUntil, attendanceColor, getInitials } from '../../utils/index';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

/* ── Inject keyframes once ───────────────────────────────────── */
const STYLES = `
@keyframes dbFadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes dbSlideR    { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes dbRimSweep  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes dbOrbFloat  { 0%,100%{transform:scale(1) translateY(0);opacity:.5} 50%{transform:scale(1.08) translateY(-8px);opacity:.8} }
@keyframes dbWavePulse { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
@keyframes dbGaugeArc  { from{stroke-dasharray:0 314} }
@keyframes dbNodePop   { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes dbLiveDot   { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} 70%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }
@keyframes dbRiskPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)} 70%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
@keyframes dbGoldGlow  { 0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.2)} 50%{box-shadow:0 0 40px rgba(201,168,76,0.5)} }
@keyframes dbCountUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes dbShimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes dbWaveScroll{ from{stroke-dashoffset:0} to{stroke-dashoffset:-400} }
`;
function injectStyles() {
  if (document.getElementById('ic-db-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-db-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Constants ───────────────────────────────────────────────── */
const VP_COLOR = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
const EV_COLOR = {
  rehearsal:'#8B5CF6', performance:'#C9A84C', service:'#EC4899',
  meeting:'#22C55E', workshop:'#06B6D4', special:'#3B82F6',
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Count-up hook ───────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
    let n = 0, step = target / (duration / 16);
    const t = setInterval(() => {
      n += step;
      if (n >= targetRef.current) { setVal(targetRef.current); clearInterval(t); }
      else setVal(Math.floor(n));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

/* ── Glass Panel ─────────────────────────────────────────────── */
function GlassPanel({ children, color='var(--gold)', accentRight, style={}, noPad }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(20,30,51,0.92),rgba(15,23,42,0.97))',
      backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:20, overflow:'hidden',
      boxShadow:'0 8px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)',
      ...style,
    }}>
      <div style={{ height:2,
        background:`linear-gradient(90deg,transparent,${color}90 30%,${accentRight||'#8B5CF6'}80 70%,transparent)`,
        animation:'dbRimSweep 5s linear infinite', backgroundSize:'200% 100%', flexShrink:0 }}/>
      {noPad ? children : <div style={{ padding:20 }}>{children}</div>}
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────── */
function SecHead({ icon, title, color='var(--gold)', onAction, actionLabel='View all →' }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
      <span style={{ fontFamily:'var(--font-heading)',fontSize:11,color,
        letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700 }}>
        {icon} {title}
      </span>
      {onAction && (
        <button onClick={onAction}
          style={{ background:'none',border:'none',color:'var(--gold)',cursor:'pointer',
            fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.08em',
            transition:'opacity 0.2s ease' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.6'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ── Animated KPI card ───────────────────────────────────────── */
function KpiCard({ icon, label, value, color, trend, sparkData, sub, delay=0, onClick }) {
  const [hov, setHov] = useState(false);
  // Extract numeric for countup
  const numericStr = String(value).replace(/[^0-9.]/g,'');
  const numeric = parseFloat(numericStr) || 0;
  const counted = useCountUp(numeric, 800);
  const displayVal = String(value).replace(/[\d.]+/, n => {
    const replaced = Math.min(counted, parseFloat(n));
    return Number.isInteger(parseFloat(n)) ? Math.floor(replaced) : replaced.toFixed(1);
  });
  const maxBar = sparkData ? Math.max(...sparkData, 1) : 1;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClick} style={{
        position:'relative',overflow:'hidden',
        background: hov
          ? `linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))`
          : `linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))`,
        backdropFilter:'blur(20px)',
        border: hov ? `1px solid ${color}65` : '1px solid rgba(255,255,255,0.08)',
        borderRadius:18, padding:'18px 20px',
        transition:'all 0.3s ease',
        cursor:onClick?'pointer':'default',
        boxShadow: hov
          ? `0 0 30px ${color}25,0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)`
          : '0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)',
        animation:`dbFadeUp 0.4s ease ${delay*0.1}s both`,
      }}>
      {/* Glow orb */}
      <div style={{ position:'absolute',top:-20,right:-20,width:90,height:90,borderRadius:'50%',
        background:`radial-gradient(circle,${color}25 0%,transparent 70%)`,
        opacity:hov?1:0.4,transition:'opacity 0.3s',pointerEvents:'none' }}/>
      {/* Top accent */}
      <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,
        background:`linear-gradient(90deg,transparent,${color}80,transparent)` }}/>

      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8 }}>
        <div style={{ width:36,height:36,borderRadius:11,flexShrink:0,
          background:`linear-gradient(135deg,${color}30,${color}15)`,
          border:`1px solid ${color}40`,display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:17,boxShadow:`0 0 12px ${color}30` }}>{icon}</div>
        {/* Sparkline bars */}
        {sparkData && (
          <div style={{ display:'flex',alignItems:'flex-end',gap:2,height:22 }}>
            {sparkData.map((b,i)=>(
              <div key={i} style={{ width:3,height:`${Math.max((b/maxBar)*22,2)}px`,
                borderRadius:2,background:`${color}${60+i*5}`,
                transition:'height 0.5s ease' }}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:26,
        color:'#F0F4FF',lineHeight:1,marginBottom:4,
        textShadow:`0 0 20px ${color}40`,
        animation:'dbCountUp 0.6s ease both' }}>{displayVal}</div>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(148,163,184,0.7)',
        letterSpacing:'0.12em',textTransform:'uppercase' }}>{label}</div>

      {sub&&<div style={{ marginTop:4,fontFamily:'var(--font-body)',fontSize:11,
        color:'rgba(148,163,184,0.5)',lineHeight:1.4 }}>{sub}</div>}

      {trend!==undefined&&(
        <div style={{ marginTop:7,fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
          color:trend>0?'#22C55E':trend<0?'#EF4444':'rgba(148,163,184,0.4)' }}>
          {trend>0?'▲':trend<0?'▼':'—'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

/* ── Health Score gauge ──────────────────────────────────────── */
function HealthGauge({ score=0, size=110 }) {
  const r=size*0.36, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  const [animated, setAnimated] = useState(0);
  useEffect(()=>{
    let n=0; const step=score/50;
    const t=setInterval(()=>{
      n+=step; if(n>=score){setAnimated(score);clearInterval(t);}
      else setAnimated(Math.floor(n));
    },20);
    return ()=>clearInterval(t);
  },[score]);
  const dash=(animated/100)*circ;
  const c=score>=75?'#22C55E':score>=50?'#C9A84C':'#F59E0B';
  const label=score>=75?'STRONG':score>=50?'STABLE':'GROWING';
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={size*0.07}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter:`drop-shadow(0 0 5px ${c}80)`, transition:'stroke-dasharray 0.4s ease',
            animation:'dbGaugeArc 0.8s ease both' }}/>
        <text x={cx} y={cy-6} textAnchor="middle" fill={c}
          style={{ fontFamily:'var(--font-heading)',fontSize:size*0.18,fontWeight:900 }}>{animated}</text>
        <text x={cx} y={cy+9} textAnchor="middle" fill={c}
          style={{ fontFamily:'var(--font-mono)',fontSize:size*0.085,letterSpacing:'0.04em' }}>SCORE</text>
      </svg>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:c,
        letterSpacing:'0.12em',fontWeight:700,marginTop:4 }}>FINANCIAL HEALTH: {label}</div>
    </div>
  );
}

/* ── SVG holographic area chart (contributions) ──────────────── */
function HoloAreaChart({ data=[], lines=[], height=180 }) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  if(!data.length||!lines.length) return null;
  const W=100,H=100, PAD={top:8,right:4,bottom:18,left:8};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const allVals=data.flatMap(d=>lines.map(l=>parseFloat(d[l.key]||0)));
  const maxV=Math.max(...allVals,1);
  const px=i=>PAD.left+(i/Math.max(data.length-1,1))*cW;
  const py=v=>PAD.top+cH-(v/maxV)*cH;
  const buildPath=key=>data.map((d,i)=>`${i===0?'M':'L'}${px(i).toFixed(2)},${py(parseFloat(d[key]||0)).toFixed(2)}`).join(' ');
  const buildArea=key=>{
    const line=buildPath(key);
    return `${line} L${px(data.length-1).toFixed(2)},${(PAD.top+cH).toFixed(2)} L${PAD.left},${(PAD.top+cH).toFixed(2)} Z`;
  };
  return (
    <div style={{ position:'relative',width:'100%',height }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:'100%',height:'100%',overflow:'visible' }}
        onMouseMove={e=>{
          const rect=svgRef.current?.getBoundingClientRect();
          if(!rect) return;
          const relX=(e.clientX-rect.left)/rect.width*W;
          setHov(Math.max(0,Math.min(data.length-1,Math.round(((relX-PAD.left)/cW)*(data.length-1)))));
        }}
        onMouseLeave={()=>setHov(null)}>
        <defs>
          {lines.map(l=>(
            <React.Fragment key={l.key}>
              <linearGradient id={`dba-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.45"/>
                <stop offset="100%" stopColor={l.color} stopOpacity="0"/>
              </linearGradient>
              <linearGradient id={`dbl-${l.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.8"/>
                <stop offset="50%" stopColor={l.color2||l.color}/>
                <stop offset="100%" stopColor={l.color} stopOpacity="0.8"/>
              </linearGradient>
              <filter id={`dbg-${l.key}`}>
                <feGaussianBlur stdDeviation="0.4" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </React.Fragment>
          ))}
        </defs>
        {[0,0.25,0.5,0.75,1].map((p,i)=>(
          <line key={i} x1={PAD.left} y1={PAD.top+cH-p*cH} x2={W-PAD.right} y2={PAD.top+cH-p*cH}
            stroke="#1E2D4A" strokeWidth="0.25" strokeDasharray="1,1"/>
        ))}
        {data.map((d,i)=>i%Math.ceil(data.length/7)===0?(
          <text key={i} x={px(i)} y={H-1} textAnchor="middle" fill="#5A6B85"
            style={{ fontSize:'2.5px',fontFamily:'DM Mono,monospace' }}>
            {d.month?.slice(0,3)}
          </text>
        ):null)}
        {[...lines].reverse().map(l=>(
          <path key={`a-${l.key}`} d={buildArea(l.key)} fill={`url(#dba-${l.key})`}/>
        ))}
        {lines.map(l=>(
          <path key={`l-${l.key}`} d={buildPath(l.key)} fill="none"
            stroke={`url(#dbl-${l.key})`} strokeWidth="0.65"
            strokeLinecap="round" strokeLinejoin="round" filter={`url(#dbg-${l.key})`}/>
        ))}
        {hov!==null&&(
          <>
            <line x1={px(hov)} y1={PAD.top} x2={px(hov)} y2={PAD.top+cH}
              stroke="rgba(201,168,76,0.4)" strokeWidth="0.3" strokeDasharray="1,0.5"/>
            {lines.map(l=>{
              const v=parseFloat(data[hov]?.[l.key]||0);
              return <circle key={l.key} cx={px(hov)} cy={py(v)} r="1.1"
                fill={l.color} stroke="#0F172A" strokeWidth="0.3"
                style={{ filter:`drop-shadow(0 0 2px ${l.color})` }}/>;
            })}
          </>
        )}
      </svg>
      {hov!==null&&data[hov]&&(
        <div style={{ position:'absolute',left:`${(hov/Math.max(data.length-1,1))*100}%`,top:0,
          transform:hov>data.length*0.65?'translateX(-105%)':'translateX(8px)',
          background:'rgba(10,16,30,0.97)',backdropFilter:'blur(16px)',
          border:'1px solid rgba(201,168,76,0.3)',borderRadius:10,
          padding:'9px 13px',pointerEvents:'none',zIndex:30,
          boxShadow:'0 8px 32px rgba(0,0,0,0.7)',minWidth:120 }}>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:5 }}>
            {data[hov].month}
          </div>
          {lines.map(l=>(
            <div key={l.key} style={{ display:'flex',justifyContent:'space-between',gap:14,marginBottom:3 }}>
              <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>{l.label}</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:l.color,fontWeight:700 }}>
                {formatCurrency(data[hov][l.key]||0,'RWF')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Neon smooth attendance line ─────────────────────────────── */
function NeonLine({ data=[], lines=[], height=170 }) {
  const [hov,setHov]=useState(null);
  const svgRef=useRef(null);
  if(!data.length) return null;
  const W=100,H=100, PAD={top:8,right:4,bottom:18,left:8};
  const cW=W-PAD.left-PAD.right, cH=H-PAD.top-PAD.bottom;
  const allVals=data.flatMap(d=>lines.map(l=>parseFloat(d[l.key]||0)));
  const maxV=Math.max(...allVals,1);
  const px=i=>PAD.left+(i/Math.max(data.length-1,1))*cW;
  const py=v=>PAD.top+cH-(Math.min(v,maxV)/maxV)*cH;
  const buildSmooth=key=>{
    const pts=data.map((d,i)=>[px(i),py(parseFloat(d[key]||0))]);
    if(pts.length<2) return '';
    let d=`M${pts[0][0]},${pts[0][1]}`;
    for(let i=1;i<pts.length;i++){
      const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
      const cpx=(x1+x2)/2;
      d+=` C${cpx},${y1} ${cpx},${y2} ${x2},${y2}`;
    }
    return d;
  };
  return (
    <div style={{ position:'relative',width:'100%',height }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:'100%',height:'100%',overflow:'visible' }}
        onMouseMove={e=>{
          const rect=svgRef.current?.getBoundingClientRect();
          if(!rect) return;
          const relX=(e.clientX-rect.left)/rect.width*W;
          setHov(Math.max(0,Math.min(data.length-1,Math.round(((relX-PAD.left)/cW)*(data.length-1)))));
        }}
        onMouseLeave={()=>setHov(null)}>
        <defs>{lines.map(l=>(
          <filter key={l.key} id={`dbn-${l.key}`}>
            <feGaussianBlur stdDeviation="0.7" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}</defs>
        {[0,0.25,0.5,0.75,1].map((p,i)=>(
          <line key={i} x1={PAD.left} y1={PAD.top+cH-p*cH} x2={W-PAD.right} y2={PAD.top+cH-p*cH}
            stroke="#1E2D4A" strokeWidth="0.25" strokeDasharray="0.8,0.8"/>
        ))}
        {data.map((d,i)=>i%Math.ceil(data.length/7)===0?(
          <text key={i} x={px(i)} y={H-1} textAnchor="middle" fill="#5A6B85"
            style={{ fontSize:'2.5px',fontFamily:'DM Mono,monospace' }}>{d.month?.slice(0,3)}</text>
        ):null)}
        {lines.map(l=>(
          <React.Fragment key={l.key}>
            <path d={buildSmooth(l.key)} fill="none" stroke={l.color} strokeWidth="1.6"
              strokeOpacity="0.14" strokeLinecap="round" filter={`url(#dbn-${l.key})`}/>
            <path d={buildSmooth(l.key)} fill="none" stroke={l.color} strokeWidth="0.55"
              strokeLinecap="round" strokeLinejoin="round"/>
          </React.Fragment>
        ))}
        {hov!==null&&lines.map(l=>{
          const v=parseFloat(data[hov]?.[l.key]||0);
          return(<g key={l.key}>
            <circle cx={px(hov)} cy={py(v)} r="1.4" fill={l.color} opacity="0.15"/>
            <circle cx={px(hov)} cy={py(v)} r="0.8" fill={l.color} stroke="#0F172A" strokeWidth="0.3"/>
          </g>);
        })}
      </svg>
      {hov!==null&&(
        <div style={{ position:'absolute',left:`${(hov/Math.max(data.length-1,1))*100}%`,top:0,
          transform:hov>data.length*0.65?'translateX(-110%)':'translateX(6px)',
          background:'rgba(10,15,28,0.97)',backdropFilter:'blur(16px)',
          border:'1px solid rgba(139,92,246,0.35)',borderRadius:10,
          padding:'9px 13px',pointerEvents:'none',zIndex:30,
          boxShadow:'0 0 20px rgba(139,92,246,0.15),0 8px 32px rgba(0,0,0,0.6)',minWidth:110 }}>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--color-violet)',letterSpacing:'0.1em',marginBottom:5 }}>
            {data[hov]?.month}
          </div>
          {lines.map(l=>(
            <div key={l.key} style={{ display:'flex',justifyContent:'space-between',gap:14,marginBottom:3 }}>
              <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>{l.label}</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:l.color,fontWeight:700 }}>
                {data[hov][l.key]||0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Radial voice chart ──────────────────────────────────────── */
function VoiceRadial({ data=[], size=160 }) {
  const [hov,setHov]=useState(null);
  const cx=size/2,cy=size/2,total=data.reduce((s,d)=>s+d.value,0)||1;
  let angle=-Math.PI/2;
  const segments=data.map((d,i)=>{
    const ratio=d.value/total,sweep=ratio*2*Math.PI;
    const r1=size*0.36,r2=size*0.24;
    const x1o=cx+r1*Math.cos(angle),y1o=cy+r1*Math.sin(angle);
    const x1i=cx+r2*Math.cos(angle),y1i=cy+r2*Math.sin(angle);
    angle+=sweep;
    const x2o=cx+r1*Math.cos(angle),y2o=cy+r1*Math.sin(angle);
    const x2i=cx+r2*Math.cos(angle),y2i=cy+r2*Math.sin(angle);
    const large=sweep>Math.PI?1:0;
    return {...d,x1o,y1o,x1i,y1i,x2o,y2o,x2i,y2i,large,ratio,sweep};
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>{data.map((d,i)=>(
        <radialGradient key={i} id={`dbv-${i}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={d.color} stopOpacity="1"/>
          <stop offset="100%" stopColor={d.color} stopOpacity="0.6"/>
        </radialGradient>
      ))}</defs>
      {segments.map((s,i)=>{
        const isH=hov===i;
        const r1=isH?size*0.39:size*0.36,r2=isH?size*0.21:size*0.24;
        const a0=-Math.PI/2+segments.slice(0,i).reduce((sum,seg)=>sum+seg.sweep,0);
        const a1=a0+s.sweep;
        const x1o=cx+r1*Math.cos(a0),y1o=cy+r1*Math.sin(a0);
        const x1i=cx+r2*Math.cos(a0),y1i=cy+r2*Math.sin(a0);
        const x2o=cx+r1*Math.cos(a1),y2o=cy+r1*Math.sin(a1);
        const x2i=cx+r2*Math.cos(a1),y2i=cy+r2*Math.sin(a1);
        const large=s.sweep>Math.PI?1:0;
        const path=`M${x1i},${y1i} L${x1o},${y1o} A${r1},${r1} 0 ${large},1 ${x2o},${y2o} L${x2i},${y2i} A${r2},${r2} 0 ${large},0 ${x1i},${y1i} Z`;
        return(<g key={i} style={{ transition:'all 0.2s ease',cursor:'pointer' }}
          onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
          <path d={path} fill={`url(#dbv-${i})`} opacity={isH?1:0.82}
            style={{ filter:isH?`drop-shadow(0 0 6px ${s.color})`:'none',transition:'all 0.2s' }}/>
        </g>);
      })}
      <circle cx={cx} cy={cy} r={size*0.21} fill="rgba(8,12,20,0.95)"/>
      {hov!==null?(
        <>
          <text x={cx} y={cy-4} textAnchor="middle" fill={data[hov]?.color}
            style={{ fontFamily:'var(--font-heading)',fontSize:size*0.1,fontWeight:700 }}>
            {Math.round((data[hov]?.ratio||0)*100)}%
          </text>
          <text x={cx} y={cy+10} textAnchor="middle" fill="var(--text-secondary)"
            style={{ fontFamily:'var(--font-body)',fontSize:size*0.065 }}>{data[hov]?.name}</text>
        </>
      ):(
        <>
          <text x={cx} y={cy-4} textAnchor="middle" fill="#F0F4FF"
            style={{ fontFamily:'var(--font-heading)',fontSize:size*0.12,fontWeight:700 }}>
            {data.reduce((s,d)=>s+d.value,0)}
          </text>
          <text x={cx} y={cy+10} textAnchor="middle" fill="var(--text-muted)"
            style={{ fontFamily:'var(--font-mono)',fontSize:size*0.055,letterSpacing:'0.05em' }}>MEMBERS</text>
        </>
      )}
    </svg>
  );
}

/* ── Quick action button ─────────────────────────────────────── */
function QuickBtn({ icon, label, color, onClick, badge }) {
  const [hov,setHov]=useState(false);
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={onClick}
      style={{ flex:1,minWidth:90,position:'relative',
        padding:'14px 10px',borderRadius:16,border:'none',cursor:'pointer',
        background: hov?`${color}18`:`${color}0E`,
        border: hov?`1px solid ${color}60`:`1px solid ${color}25`,
        transition:'all 0.2s ease',
        boxShadow:hov?`0 0 16px ${color}25`:'none',
        display:'flex',flexDirection:'column',alignItems:'center',gap:7 }}>
      {badge!==undefined&&badge>0&&(
        <div style={{ position:'absolute',top:8,right:8,
          width:16,height:16,borderRadius:'50%',background:'#EF4444',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,color:'#fff',
          boxShadow:'0 0 8px rgba(239,68,68,0.6)' }}>{badge}</div>
      )}
      <span style={{ fontSize:22,filter:hov?`drop-shadow(0 0 6px ${color})`:'none',
        transition:'filter 0.2s' }}>{icon}</span>
      <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
        letterSpacing:'0.08em',textTransform:'uppercase',
        color:hov?color:'rgba(148,163,184,0.6)',transition:'color 0.2s' }}>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  injectStyles();
  const { session } = useAuth();
  const navigate    = useNavigate();
  const [tick, setTick] = useState(0);

  // Force re-render on relevant real-time events
  useRealtimeSync([
    'member:created', 'member:updated', 'member:deleted',
    'contribution:created', 'contribution:deleted',
    'attendance:marked', 'event:created', 'event:updated'
  ], () => setTick(t => t + 1));

  /* ── Pre-compute ─────────────────────────────────────────── */
  const stats        = useMemo(()=>getSummaryStats(),[tick]);
  const contribTrend = useMemo(()=>getContributionTrend(12),[tick]);
  const attendTrend  = useMemo(()=>getAttendanceTrend(12),[tick]);
  const voiceDist    = useMemo(()=>getVoiceDistribution(),[tick]);
  const topContribs  = useMemo(()=>getTopContributors(7),[tick]);
  const yoyData      = useMemo(()=>getYoYContributions(),[tick]);
  const memberGrowth = useMemo(()=>getMemberGrowth(12),[tick]);
  const memberRates  = useMemo(()=>getMemberAttendanceRates(),[tick]);
  const upcoming     = useMemo(()=>eventsService.getUpcoming().slice(0,5),[tick]);
  const auditLog     = useMemo(()=>auditService.getAll().slice(0,10),[tick]);

  /* ── Sparklines ──────────────────────────────────────────── */
  const contribSpark = contribTrend.slice(-6).map(d=>d.total||(d.tithe+d.offering+d.special_gift+d.welfare_fund+d.other)||0);
  const attendSpark  = attendTrend.slice(-6).map(d=>d.overall||0);
  const memberSpark  = memberGrowth.slice(-6).map(d=>d.members||0);

  /* ── Health score ────────────────────────────────────────── */
  const healthScore = useMemo(()=>{
    const verRate = 80; // assume good
    const contribScore = Math.min(30, (stats.totalContribs/100000)*30);
    const attScore = (stats.avgAttendance/100)*40;
    return Math.min(100,Math.round(verRate*0.3+contribScore+attScore));
  },[stats]);

  /* ── Greeting ────────────────────────────────────────────── */
  const h = new Date().getHours();
  const greeting  = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  const greetIcon = h<12?'☀️':h<17?'🌤️':'🌙';

  /* ── At-risk members ─────────────────────────────────────── */
  const atRisk = memberRates.filter(m=>m.rate<70).slice(0,3);

  /* ── Activity config ─────────────────────────────────────── */
  const actConfig = {
    'auth.login':           {icon:'🔐',color:'#3B82F6', label:'Signed in'},
    'auth.logout':          {icon:'🚪',color:'rgba(148,163,184,0.4)',label:'Signed out'},
    'member.created':       {icon:'👤',color:'#22C55E', label:'Member added'},
    'member.updated':       {icon:'✏️',color:'#C9A84C', label:'Member updated'},
    'event.created':        {icon:'📅',color:'#C9A84C', label:'Event created'},
    'contribution.recorded':{icon:'💰',color:'#22C55E', label:'Contribution recorded'},
    'attendance.saved':     {icon:'✅',color:'#8B5CF6', label:'Attendance saved'},
  };

  /* ── Today's summary ─────────────────────────────────────── */
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = upcoming.filter(e=>e.date===todayStr);

  return (
    <div style={{ animation:'dbFadeUp 0.35s ease both' }}>

      {/* ══════════════════════════════════════════════════
          ① HERO SECTION
         ══════════════════════════════════════════════════ */}
      <GlassPanel color="var(--gold)" accentRight="#8B5CF6"
        style={{ marginBottom:22 }}>

        {/* Background wave */}
        <svg style={{ position:'absolute',bottom:0,left:0,right:0,width:'100%',
          pointerEvents:'none',opacity:0.4,zIndex:0 }}
          viewBox="0 0 800 60" preserveAspectRatio="none" height={60}>
          <path d="M0,30 C200,8 400,52 600,30 C700,18 750,42 800,30" fill="none"
            stroke="rgba(201,168,76,0.4)" strokeWidth="1.2"
            style={{ animation:'dbWaveScroll 10s linear infinite',strokeDasharray:900 }}/>
        </svg>

        <div style={{ position:'relative',zIndex:1,
          display:'flex',alignItems:'center',justifyContent:'space-between',
          flexWrap:'wrap',gap:20 }}>

          {/* Greeting */}
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
              <span style={{ fontSize:24 }}>{greetIcon}</span>
              <h1 style={{ fontFamily:'var(--font-heading)',
                fontSize:'clamp(20px,2.5vw,28px)',fontWeight:900,
                background:'linear-gradient(135deg,#C9A84C,#F5E4A8,#E8C96A)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
                backgroundClip:'text',margin:0,letterSpacing:'0.02em' }}>
                {greeting}, {session?.name?.split(' ')[0]||'Director'}
              </h1>
            </div>
            <p style={{ fontFamily:'var(--font-body)',fontSize:13,
              color:'rgba(148,163,184,0.7)',margin:0,fontStyle:'italic' }}>
              "Voices united in worship and excellence" · {formatDate(new Date(),'long')}
            </p>

            {/* Today chips */}
            <div style={{ display:'flex',gap:8,marginTop:12,flexWrap:'wrap' }}>
              {[
                {icon:'👥',val:`${stats.activeMembers}`,label:'Active',color:'#C9A84C'},
                {icon:'📅',val:`${stats.upcomingEvents}`,label:'Upcoming',color:'#3B82F6'},
                {icon:'⏳',val:`${stats.atRiskCount}`,label:'At-Risk',color:'#EF4444'},
                ...(todayEvents.length>0?[{icon:'🎵',val:`${todayEvents.length}`,label:'Today',color:'#22C55E'}]:[]),
              ].map(chip=>(
                <div key={chip.label} style={{ display:'flex',alignItems:'center',gap:6,
                  background:`${chip.color}10`,border:`1px solid ${chip.color}30`,
                  borderRadius:20,padding:'4px 12px' }}>
                  <span style={{ fontSize:12 }}>{chip.icon}</span>
                  <span style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:900,
                    color:chip.color }}>{chip.val}</span>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                    color:`${chip.color}80`,letterSpacing:'0.06em',textTransform:'uppercase' }}>{chip.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health score */}
          <HealthGauge score={healthScore} size={120}/>
        </div>
      </GlassPanel>

      {/* ══════════════════════════════════════════════════
          ② KPI CARDS
         ══════════════════════════════════════════════════ */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',
        gap:14,marginBottom:22 }}>
        <KpiCard icon="👥" label="Active Members" value={stats.activeMembers}
          color="#C9A84C" delay={0} trend={5} sparkData={memberSpark}
          sub={`${stats.pendingMembers} pending`}
          onClick={()=>navigate('/dashboard/members')}/>
        <KpiCard icon="✅" label="Avg Attendance" value={`${stats.avgAttendance}%`}
          color="#8B5CF6" delay={1} trend={2} sparkData={attendSpark}
          sub={`${stats.atRiskCount} at-risk`}
          onClick={()=>navigate('/dashboard/attendance')}/>
        <KpiCard icon="💰" label="Total Contributions"
          value={stats.totalContribs>=1000000?`${(stats.totalContribs/1000000).toFixed(1)}M`:`${Math.round(stats.totalContribs/1000)}K`}
          color="#22C55E" delay={2} trend={stats.contribGrowth} sparkData={contribSpark}
          sub={`${formatCurrency(stats.thisMonthContribs,'RWF')} this month`}
          onClick={()=>navigate('/dashboard/contributions')}/>
        <KpiCard icon="📅" label="Upcoming Events" value={stats.upcomingEvents}
          color="#3B82F6" delay={3}
          sub={upcoming[0]?`Next in ${daysUntil(upcoming[0].date)}d`:'None scheduled'}
          onClick={()=>navigate('/dashboard/events')}/>
        <KpiCard icon="📝" label="Total Members" value={stats.totalMembers||0}
          color="#06B6D4" delay={4}
          sub={`${stats.activeMembers} active`}
          onClick={()=>navigate('/dashboard/members')}/>
      </div>

      {/* ══════════════════════════════════════════════════
          ③ QUICK ACTIONS
         ══════════════════════════════════════════════════ */}
      <GlassPanel color="var(--gold)" accentRight="#06B6D4" style={{ marginBottom:22 }}>
        <SecHead icon="⚡" title="Quick Actions" color="var(--gold)"/>
        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          <QuickBtn icon="✅" label="Attendance" color="#8B5CF6"
            onClick={()=>navigate('/dashboard/attendance')}/>
          <QuickBtn icon="💰" label="Contributions" color="#22C55E"
            onClick={()=>navigate('/dashboard/contributions')}/>
          <QuickBtn icon="📅" label="Events" color="#C9A84C"
            onClick={()=>navigate('/dashboard/events')}/>
          <QuickBtn icon="👥" label="Members" color="#3B82F6"
            onClick={()=>navigate('/dashboard/members')}/>
          <QuickBtn icon="💬" label="Messages" color="#EC4899"
            onClick={()=>navigate('/dashboard/messages')}/>
          <QuickBtn icon="📊" label="Analytics" color="#06B6D4"
            onClick={()=>navigate('/dashboard/analytics')}/>
        </div>
      </GlassPanel>

      {/* ══════════════════════════════════════════════════
          ④ CHARTS ROW 1
         ══════════════════════════════════════════════════ */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',
        gap:18,marginBottom:18 }}>

        {/* Contribution area chart */}
        <GlassPanel color="var(--gold)" accentRight="#22C55E">
          <SecHead icon="💰" title="12-Month Contributions" color="var(--gold)"
            onAction={()=>navigate('/dashboard/contributions')}/>
          <HoloAreaChart data={contribTrend} height={190}
            lines={[
              {key:'tithe',       label:'Tithe',  color:'#C9A84C',color2:'#E8C96A'},
              {key:'offering',    label:'Offering',color:'#3B82F6',color2:'#06B6D4'},
              {key:'special_gift',label:'Special', color:'#8B5CF6',color2:'#EC4899'},
              {key:'welfare_fund',label:'Welfare', color:'#22C55E',color2:'#10B981'},
            ]}/>
          <div style={{ display:'flex',flexWrap:'wrap',gap:14,marginTop:10,
            paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {[{l:'Tithe',c:'#C9A84C'},{l:'Offering',c:'#3B82F6'},
              {l:'Special',c:'#8B5CF6'},{l:'Welfare',c:'#22C55E'}].map(({l,c})=>(
              <div key={l} style={{ display:'flex',alignItems:'center',gap:5 }}>
                <div style={{ width:16,height:2,background:c,borderRadius:2,
                  boxShadow:`0 0 5px ${c}` }}/>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,
                  color:'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Attendance neon chart */}
        <GlassPanel color="#8B5CF6" accentRight="#EC4899">
          <SecHead icon="✅" title="Attendance Trend" color="#8B5CF6"
            onAction={()=>navigate('/dashboard/attendance')}/>
          <NeonLine data={attendTrend} height={190}
            lines={[
              {key:'overall', label:'Overall', color:'#8B5CF6'},
              {key:'Soprano', label:'Soprano', color:'#EC4899'},
              {key:'Alto',    label:'Alto',    color:'#06B6D4'},
              {key:'Tenor',   label:'Tenor',   color:'#C9A84C'},
              {key:'Bass',    label:'Bass',    color:'#22C55E'},
            ]}/>
          <div style={{ display:'flex',flexWrap:'wrap',gap:12,marginTop:10,
            paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {[{l:'Overall',c:'#8B5CF6'},{l:'Soprano',c:'#EC4899'},
              {l:'Alto',c:'#06B6D4'},{l:'Tenor',c:'#C9A84C'},{l:'Bass',c:'#22C55E'}].map(({l,c})=>(
              <div key={l} style={{ display:'flex',alignItems:'center',gap:5 }}>
                <div style={{ width:14,height:2,background:c,borderRadius:2,
                  boxShadow:`0 0 5px ${c}` }}/>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,
                  color:'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* ══════════════════════════════════════════════════
          ⑤ VOICE + TOP CONTRIBUTORS
         ══════════════════════════════════════════════════ */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
        gap:18,marginBottom:18 }}>

        {/* Voice radial */}
        <GlassPanel color="#EC4899" accentRight="#8B5CF6">
          <SecHead icon="🎤" title="Voice Distribution" color="#EC4899"
            onAction={()=>navigate('/dashboard/members')}/>
          <div style={{ display:'flex',alignItems:'center',gap:18,flexWrap:'wrap',justifyContent:'center' }}>
            <VoiceRadial data={voiceDist.map(v=>({name:v.name,value:v.value,color:v.color,ratio:v.percent/100}))} size={160}/>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {voiceDist.map(v=>(
                <div key={v.name} style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:v.color,
                    boxShadow:`0 0 8px ${v.color}80`,flexShrink:0 }}/>
                  <div>
                    <div style={{ fontFamily:'var(--font-heading)',fontSize:12,
                      color:'var(--text-primary)',fontWeight:700 }}>{v.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
                      color:'var(--text-muted)' }}>{v.value} · {v.percent}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Top contributors leaderboard */}
        <GlassPanel color="var(--gold)" accentRight="#8B5CF6">
          <SecHead icon="🏆" title="Top Contributors" color="var(--gold)"
            onAction={()=>navigate('/dashboard/contributions')}/>
          {topContribs.length===0?(
            <div style={{ fontFamily:'var(--font-body)',fontSize:13,color:'var(--text-muted)',padding:'12px 0' }}>No data yet.</div>
          ):topContribs.map((c,i)=>{
            const maxT=topContribs[0]?.total||1;
            const medals=['🥇','🥈','🥉'];
            return (
              <div key={c.id} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10,
                animation:`dbFadeUp 0.3s ease ${i*0.04}s both` }}>
                <span style={{ fontSize:14,width:20,textAlign:'center',flexShrink:0 }}>
                  {medals[i]||<span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>{i+1}</span>}
                </span>
                <Avatar initials={c.initials||c.name?.split(' ').map(w=>w[0]).join('').slice(0,2)||'?'}
                  size={28} color={c.color||'var(--gold)'}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,
                    color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',
                    whiteSpace:'nowrap',marginBottom:3 }}>{c.name}</div>
                  <div style={{ height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${(c.total/maxT)*100}%`,
                      background:`linear-gradient(90deg,${c.color||'#C9A84C'},${c.color||'#E8C96A'})`,
                      borderRadius:2,boxShadow:`0 0 5px ${c.color||'#C9A84C'}50`,
                      transition:'width 1s ease' }}/>
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:11,
                    color:c.color||'#C9A84C',fontWeight:700 }}>
                    {c.total>=1000?`${Math.round(c.total/1000)}K`:c.total}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)' }}>RWF</div>
                </div>
              </div>
            );
          })}
        </GlassPanel>
      </div>

      {/* ══════════════════════════════════════════════════
          ⑥ UPCOMING EVENTS + AT-RISK MEMBERS
         ══════════════════════════════════════════════════ */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',
        gap:18,marginBottom:18 }}>

        {/* Upcoming events */}
        <GlassPanel color="var(--gold)" accentRight="#3B82F6">
          <SecHead icon="📅" title="Upcoming Events" color="var(--gold)"
            onAction={()=>navigate('/dashboard/events')}/>
          {upcoming.length===0 ? (
            <div style={{ textAlign:'center',padding:'20px 0',fontFamily:'var(--font-body)',
              fontSize:13,color:'rgba(148,163,184,0.35)' }}>No upcoming events</div>
          ) : upcoming.map((ev,i)=>{
            const color=EV_COLOR[ev.type]||'#3B82F6';
            const days=daysUntil(ev.date);
            const urgColor=days===0?'#EF4444':days<=3?'#F59E0B':days<=7?'#C9A84C':'var(--text-secondary)';
            return (
              <div key={ev.id} style={{ display:'flex',alignItems:'center',gap:12,
                padding:'10px 0',
                borderBottom:i<upcoming.length-1?'1px solid rgba(255,255,255,0.05)':'',
                animation:`dbFadeUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ width:4,height:44,borderRadius:2,background:color,flexShrink:0,
                  boxShadow:`0 0 8px ${color}50` }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                    color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',
                    textOverflow:'ellipsis',marginBottom:3 }}>{ev.title}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>
                    {formatDate(ev.date)} · {ev.time}
                  </div>
                  {ev.location&&(
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
                      color:'rgba(148,163,184,0.4)',marginTop:1 }}>📍 {ev.location}</div>
                  )}
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:13,fontWeight:900,
                    color:urgColor,textShadow:`0 0 8px ${urgColor}60` }}>
                    {days===0?'TODAY':days===1?'TMRW':`${days}d`}
                  </div>
                  {ev.mandatory&&(
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:7,
                      color:'#EF4444',background:'rgba(239,68,68,0.1)',
                      border:'1px solid rgba(239,68,68,0.25)',borderRadius:20,
                      padding:'1px 5px',marginTop:3,letterSpacing:'0.05em' }}>REQ</div>
                  )}
                </div>
              </div>
            );
          })}
        </GlassPanel>

        {/* At-risk + member attendance */}
        <GlassPanel color="#F59E0B" accentRight="#EF4444">
          <SecHead icon="⚠" title="Attendance Watch" color="#F59E0B"
            onAction={()=>navigate('/dashboard/attendance')}/>
          {atRisk.length>0&&(
            <>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'rgba(239,68,68,0.6)',
                letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>
                ⚠ At-Risk Members (below 70%)
              </div>
              {atRisk.map((m,i)=>(
                <div key={m.name} style={{ display:'flex',alignItems:'center',gap:10,
                  marginBottom:8,padding:'8px 12px',borderRadius:12,
                  background:'rgba(239,68,68,0.06)',
                  border:'1px solid rgba(239,68,68,0.15)',
                  animation:'dbRiskPulse 3s ease infinite',
                  animationDelay:`${i*0.5}s` }}>
                  <Avatar initials={m.initials} size={28} color={m.color}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,
                      color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',
                      whiteSpace:'nowrap' }}>{m.name}</div>
                    <div style={{ height:3,borderRadius:2,
                      background:'rgba(255,255,255,0.06)',marginTop:4,overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${m.rate}%`,
                        background:'linear-gradient(90deg,#EF444480,#EF4444)',borderRadius:2 }}/>
                    </div>
                  </div>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:900,
                    color:'#EF4444',flexShrink:0,
                    textShadow:'0 0 10px rgba(239,68,68,0.5)' }}>{m.rate}%</div>
                </div>
              ))}
              <div style={{ height:1,background:'rgba(255,255,255,0.06)',margin:'10px 0' }}/>
            </>
          )}
          {/* Top attendance */}
          <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'rgba(34,197,94,0.6)',
            letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>
            🌟 Top Attendance
          </div>
          {memberRates.slice(0,4).map((m,i)=>(
            <div key={m.name} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8,
              animation:`dbFadeUp 0.3s ease ${i*0.05}s both` }}>
              <Avatar initials={m.initials} size={26} color={m.color}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-body)',fontSize:11,fontWeight:600,
                  color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',
                  whiteSpace:'nowrap',marginBottom:3 }}>{m.name.split(' ')[0]}</div>
                <div style={{ height:3,borderRadius:2,
                  background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${m.rate}%`,
                    background:`linear-gradient(90deg,${attendanceColor(m.rate)}80,${attendanceColor(m.rate)})`,
                    borderRadius:2,boxShadow:`0 0 6px ${attendanceColor(m.rate)}60`,
                    transition:'width 0.8s ease' }}/>
                </div>
              </div>
              <span style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:900,
                color:attendanceColor(m.rate),flexShrink:0,
                textShadow:`0 0 8px ${attendanceColor(m.rate)}50` }}>{m.rate}%</span>
            </div>
          ))}
        </GlassPanel>
      </div>

      {/* ══════════════════════════════════════════════════
          ⑦ YEAR-OVER-YEAR + MEMBER GROWTH
         ══════════════════════════════════════════════════ */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',
        gap:18,marginBottom:18 }}>

        {/* YoY bars */}
        <GlassPanel color="#3B82F6" accentRight="var(--gold)">
          <SecHead icon="📆" title="Year-over-Year" color="#3B82F6"
            onAction={()=>navigate('/dashboard/analytics')}/>
          <div style={{ display:'flex',gap:14,marginBottom:12 }}>
            {[{c:'#3B82F6',l:String(new Date().getFullYear()-1)},{c:'var(--gold)',l:String(new Date().getFullYear())}].map(({c,l})=>(
              <div key={l} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <div style={{ width:16,height:3,background:c,borderRadius:2 }}/>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',alignItems:'flex-end',gap:5,height:130,padding:'4px 0 18px' }}>
            {yoyData.map((d,i)=>{
              const maxV=Math.max(...yoyData.flatMap(r=>[r.lastYear||0,r.thisYear||0]),1);
              return (
                <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'flex-end',height:'100%',position:'relative' }}>
                  <div style={{ display:'flex',gap:1.5,alignItems:'flex-end',
                    width:'100%',justifyContent:'center',height:'calc(100% - 18px)' }}>
                    <div style={{ width:'44%',height:`${((d.lastYear||0)/maxV)*100}%`,minHeight:2,
                      borderRadius:'3px 3px 0 0',
                      background:'linear-gradient(180deg,#3B82F6,#1D4ED8)',opacity:0.75 }}/>
                    <div style={{ width:'44%',height:`${((d.thisYear||0)/maxV)*100}%`,minHeight:2,
                      borderRadius:'3px 3px 0 0',
                      background:'linear-gradient(180deg,var(--gold),#A07820)',opacity:0.75 }}/>
                  </div>
                  <div style={{ position:'absolute',bottom:0,fontFamily:'var(--font-mono)',
                    fontSize:6.5,color:'var(--text-muted)',textAlign:'center' }}>
                    {d.month?.slice(0,1)}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* Member growth area */}
        <GlassPanel color="var(--gold)" accentRight="#06B6D4">
          <SecHead icon="📈" title="Member Growth" color="var(--gold)"
            onAction={()=>navigate('/dashboard/members')}/>
          <HoloAreaChart
            data={memberGrowth.map(d=>({month:d.month||d.label,total:d.members||0}))}
            height={140}
            lines={[{key:'total',label:'Members',color:'#C9A84C',color2:'#06B6D4'}]}/>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:10,
            paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:900,
                color:'var(--gold)' }}>{stats.totalMembers||0}</div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                color:'var(--text-muted)',letterSpacing:'0.08em' }}>TOTAL</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:900,
                color:'#22C55E' }}>{stats.activeMembers}</div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                color:'var(--text-muted)',letterSpacing:'0.08em' }}>ACTIVE</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:900,
                color:'#F59E0B' }}>{stats.pendingMembers}</div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                color:'var(--text-muted)',letterSpacing:'0.08em' }}>PENDING</div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* ══════════════════════════════════════════════════
          ⑧ LIVE ACTIVITY FEED
         ══════════════════════════════════════════════════ */}
      <GlassPanel color="#06B6D4" accentRight="#8B5CF6">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:'#22C55E',
              boxShadow:'0 0 8px rgba(34,197,94,0.8)',animation:'dbLiveDot 2s ease infinite' }}/>
            <span style={{ fontFamily:'var(--font-heading)',fontSize:11,color:'#06B6D4',
              letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700 }}>
              ⚡ Live Activity
            </span>
          </div>
          <button onClick={()=>navigate('/dashboard/analytics')}
            style={{ background:'none',border:'none',color:'var(--gold)',cursor:'pointer',
              fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.08em' }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.6'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            Full analytics →
          </button>
        </div>

        {/* Vertical timeline */}
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute',left:15,top:0,bottom:0,width:1,
            background:'linear-gradient(180deg,transparent,rgba(6,182,212,0.3) 10%,rgba(6,182,212,0.1) 90%,transparent)' }}/>

          {auditLog.map((entry,i)=>{
            const cfg=actConfig[entry.action]||{icon:'⬡',color:'rgba(148,163,184,0.4)',label:entry.action};
            return (
              <div key={entry.id||i} style={{ display:'flex',alignItems:'flex-start',
                gap:14,marginBottom:12,
                animation:`dbFadeUp 0.3s ease ${i*0.04}s both` }}>
                {/* Neon node */}
                <div style={{ width:32,height:32,borderRadius:'50%',flexShrink:0,zIndex:2,
                  background:`${cfg.color}14`,border:`1px solid ${cfg.color}40`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
                  boxShadow:`0 0 8px ${cfg.color}30`,
                  animation:'dbNodePop 0.3s ease both',
                  animationDelay:`${i*0.04}s` }}>{cfg.icon}</div>

                <div style={{ flex:1,minWidth:0,padding:'5px 0' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10 }}>
                    <div>
                      <span style={{ fontFamily:'var(--font-body)',fontSize:13,
                        color:'var(--text-primary)',fontWeight:600 }}>{cfg.label}</span>
                      {entry.userEmail&&(
                        <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                          color:'var(--text-muted)',marginLeft:8 }}>· {entry.userEmail}</span>
                      )}
                    </div>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                      color:'var(--text-muted)',flexShrink:0 }}>
                      {formatDate(entry.timestamp,'relative')}
                    </span>
                  </div>
                  {entry.newValues&&Object.entries(entry.newValues).slice(0,1).map(([k,v])=>(
                    <div key={k} style={{ fontFamily:'var(--font-mono)',fontSize:9,
                      color:`${cfg.color}80`,marginTop:2 }}>
                      {k}: {String(v).slice(0,32)}
                    </div>
                  ))}
                  {i<auditLog.length-1&&(
                    <div style={{ height:1,background:'rgba(255,255,255,0.04)',marginTop:10 }}/>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

    </div>
  );
}
