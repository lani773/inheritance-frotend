/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Attendance Page  (Enhanced v2)

   Design: Holographic glassmorphism · Neon glow · Animated scanner

   Tabs:
   • Mark Attendance  — glass rows, search/filter, animated status btns
   • Excuse Requests  — glass cards, quick approve/reject
   • QR Check-In      — animated scanner viewport + live check-in feed
   • Statistics       — gauge rings, heatmap, streak leaderboard

   NEW vs v1:
   ✦ Full-page glassmorphism design system (matches Login/Register)
   ✦ Inject-once keyframe styles (no external CSS needed)
   ✦ Mark tab: search by name, filter by voice part, keyboard shortcut keys
   ✦ Mark tab: animated status toggle with ripple + color flash on row
   ✦ Mark tab: live attendance donut ring summary
   ✦ Mark tab: progress bar fill per section
   ✦ Excuse tab: glass cards with approve/reject inline + review note
   ✦ QR tab: animated neon scanner frame with sweeping scan line
   ✦ QR tab: real-time check-in feed (log of who scanned when)
   ✦ QR tab: keyboard-focused for fast check-in workflow
   ✦ Stats tab: animated gauge rings per voice section
   ✦ Stats tab: 20-week attendance heatmap calendar
   ✦ Stats tab: contribution streak leaderboard
   ✦ Stats tab: at-risk member alert cards
   ═══════════════════════════════════════════════════════════════════ */
import React, {
  useState, useMemo, useCallback, useRef, useEffect,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  eventsService, membersService,
  attendanceService, notificationsService,
} from '../../services/index';
import {
  PageHeader, Tabs, Avatar, Badge, ProgressBar,
  EmptyState, Select, InfoBox,
} from '../../components/shared/index';
import Button from '../../components/shared/Button';
import Input  from '../../components/shared/Input';
import Modal  from '../../components/shared/Modal';
import { formatDate, getInitials, attendanceColor } from '../../utils/index';

/* ── Inject keyframes once ───────────────────────────────────── */
const STYLES = `
@keyframes attFadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes attSlideIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes scanLine    { 0%{top:8px;opacity:1} 48%{opacity:1} 50%{top:calc(100% - 8px);opacity:0.5} 52%{opacity:1} 100%{top:8px;opacity:1} }
@keyframes scannerPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0.15)} }
@keyframes checkIn     { 0%{opacity:0;transform:translateX(20px) scale(0.95)} 60%{transform:translateX(-4px) scale(1.02)} 100%{opacity:1;transform:translateX(0) scale(1)} }
@keyframes rowFlash    { 0%{background:rgba(34,197,94,0.2)} 100%{background:transparent} }
@keyframes rimSweep3   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes gaugeAnim   { from{stroke-dasharray:0 314} }
@keyframes waveBar3    { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
@keyframes spin3       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes dotPulse3   { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 70%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
@keyframes successPop3 { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
`;
function injectStyles() {
  if (document.getElementById('ic-att-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-att-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Constants ───────────────────────────────────────────────── */
const STATUS = {
  present: { color:'#22C55E', icon:'✅', label:'Present', key:'p' },
  late:    { color:'#F59E0B', icon:'⏰', label:'Late',    key:'l' },
  excused: { color:'#8B5CF6', icon:'📝', label:'Excused', key:'e' },
  absent:  { color:'#EF4444', icon:'❌', label:'Absent',  key:'a' },
};
const VP_COLOR = {
  Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981',
};

/* ── Glass panel wrapper ─────────────────────────────────────── */
function GlassPanel({ children, color='var(--gold)', accentRight, title, icon, style={} }) {
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(20,30,51,0.92),rgba(15,23,42,0.97))',
      backdropFilter:'blur(20px)',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:20, overflow:'hidden',
      boxShadow:'0 8px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)',
      ...style,
    }}>
      <div style={{ height:2,
        background:`linear-gradient(90deg,transparent,${color}90 30%,${accentRight||'#8B5CF6'}80 70%,transparent)`,
        animation:'rimSweep3 5s linear infinite', backgroundSize:'200% 100%',
      }}/>
      {title && (
        <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'center', gap:8 }}>
          {icon && <span style={{ fontSize:14 }}>{icon}</span>}
          <span style={{ fontFamily:'var(--font-heading)', fontSize:11, fontWeight:700,
            color, letterSpacing:'0.12em', textTransform:'uppercase' }}>{title}</span>
        </div>
      )}
      <div style={{ padding: title ? '14px 20px 20px' : '20px' }}>{children}</div>
    </div>
  );
}

/* ── Animated status button ──────────────────────────────────── */
function StatusBtn({ status, current, onClick, disabled }) {
  const cfg   = STATUS[status];
  const isSel = current === status;
  const [ripple, setRipple] = useState(null);
  const ref = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setRipple({ x:e.clientX-rect.left, y:e.clientY-rect.top });
    setTimeout(() => setRipple(null), 500);
    onClick(status);
  };

  return (
    <button ref={ref} onClick={handleClick} disabled={disabled}
      title={`${cfg.label} (${cfg.key.toUpperCase()})`}
      style={{
        width:36, height:36, borderRadius:10, position:'relative', overflow:'hidden',
        border:`2px solid ${isSel ? cfg.color : 'rgba(255,255,255,0.1)'}`,
        background: isSel ? `${cfg.color}20` : 'rgba(255,255,255,0.03)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize:15, display:'flex', alignItems:'center', justifyContent:'center',
        transition:'all 0.2s ease', opacity: disabled ? 0.35 : 1,
        transform: isSel ? 'scale(1.12)' : 'scale(1)',
        boxShadow: isSel ? `0 0 14px ${cfg.color}50` : 'none',
      }}
      onMouseEnter={e=>{ if(!isSel&&!disabled){ e.currentTarget.style.borderColor=`${cfg.color}70`; e.currentTarget.style.background=`${cfg.color}10`; } }}
      onMouseLeave={e=>{ if(!isSel){ e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; } }}
    >
      {ripple && (
        <span style={{ position:'absolute', left:ripple.x, top:ripple.y,
          width:4, height:4, marginLeft:-2, marginTop:-2,
          borderRadius:'50%', background:cfg.color, opacity:0.6,
          animation:'rippleOut 0.5s ease both', pointerEvents:'none' }}/>
      )}
      {cfg.icon}
    </button>
  );
}

/* ── Live attendance donut ───────────────────────────────────── */
function AttendanceDonut({ summary, total, size=120 }) {
  const cx=size/2, cy=size/2, r=size*0.36, circ=2*Math.PI*r;
  const segments=[
    {key:'present',  color:'#22C55E'},
    {key:'late',     color:'#F59E0B'},
    {key:'excused',  color:'#8B5CF6'},
    {key:'absent',   color:'#EF4444'},
    {key:'unmarked', color:'rgba(255,255,255,0.1)'},
  ];
  let offset=0;
  const arcs=segments.map(s=>{
    const pct=(summary[s.key]||0)/Math.max(total,1);
    const dash=pct*circ;
    const arc={...s, dash, offset};
    offset+=dash;
    return arc;
  });
  const presentPct=total?Math.round(((summary.present||0)/total)*100):0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color} strokeWidth={size*0.09}
          strokeDasharray={`${arc.dash} ${circ}`}
          strokeDashoffset={-arc.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:'stroke-dasharray 0.6s ease' }}
        />
      ))}
      <text x={cx} y={cy-5} textAnchor="middle" fill="#F0F4FF"
        style={{ fontFamily:'var(--font-heading)',fontSize:size*0.18,fontWeight:900 }}>
        {presentPct}%
      </text>
      <text x={cx} y={cy+10} textAnchor="middle" fill="rgba(148,163,184,0.6)"
        style={{ fontFamily:'var(--font-mono)',fontSize:size*0.07,letterSpacing:'0.05em' }}>
        PRESENT
      </text>
    </svg>
  );
}

/* ── Gauge ring ──────────────────────────────────────────────── */
function GaugeRing({ label, value, color, icon, size=90 }) {
  const r=size*0.36, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  const [displayed, setDisplayed] = useState(0);
  useEffect(()=>{
    let n=0; const step=value/40;
    const t=setInterval(()=>{
      n+=step;
      if(n>=value){setDisplayed(value);clearInterval(t);}
      else setDisplayed(Math.floor(n));
    },20);
    return ()=>clearInterval(t);
  },[value]);
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
          strokeDasharray={`${(displayed/100)*circ} ${circ}`}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter:`drop-shadow(0 0 4px ${color}80)`, transition:'stroke-dasharray 0.3s ease' }}/>
        <text x={cx} y={cy-3} textAnchor="middle" fill={color}
          style={{ fontFamily:'var(--font-heading)',fontSize:size*0.2,fontWeight:900 }}>{displayed}</text>
        <text x={cx} y={cy+8} textAnchor="middle" fill={color}
          style={{ fontFamily:'var(--font-heading)',fontSize:size*0.13 }}>%</text>
      </svg>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:14 }}>{icon}</div>
        <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',
          letterSpacing:'0.08em',textTransform:'uppercase' }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Attendance heatmap (20-week) ────────────────────────────── */
function AttendanceHeatmap({ memberId, allRecords }) {
  const today=new Date();
  const WEEKS=20;
  const grid=useMemo(()=>{
    const memberRecs=allRecords.filter(r=>r.memberId===memberId);
    const recMap={};
    memberRecs.forEach(r=>{ if(r.date) recMap[r.date]=r.status; });
    const startDate=new Date(today);
    startDate.setDate(startDate.getDate()-WEEKS*7-startDate.getDay());
    const weeks=[];
    for(let w=0;w<WEEKS;w++){
      const days=[];
      for(let d=0;d<7;d++){
        const dt=new Date(startDate);
        dt.setDate(startDate.getDate()+w*7+d);
        const key=dt.toISOString().slice(0,10);
        days.push({ date:key, status:recMap[key]||null });
      }
      weeks.push(days);
    }
    return weeks;
  },[memberId,allRecords]);

  const cellColor=(status)=>{
    if(!status) return 'rgba(255,255,255,0.05)';
    return STATUS[status]?.color+'60' || 'rgba(255,255,255,0.1)';
  };
  const CELL=9, GAP=2;
  return (
    <div style={{ display:'flex',gap:GAP }}>
      {grid.map((week,wi)=>(
        <div key={wi} style={{ display:'flex',flexDirection:'column',gap:GAP }}>
          {week.map((day,di)=>(
            <div key={di} title={`${day.date}: ${day.status||'no record'}`}
              style={{ width:CELL,height:CELL,borderRadius:2,background:cellColor(day.status),
                cursor:day.status?'pointer':'default',
                boxShadow:day.status?`0 0 4px ${STATUS[day.status]?.color}40`:'none',
              }}/>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── QR animated scanner frame ───────────────────────────────── */
function QRScannerFrame({ active, onScan, eventId, members }) {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const inputRef = useRef(null);
  const { success: toastOK, error: toastErr } = useToast();

  useEffect(()=>{ if(active) setTimeout(()=>inputRef.current?.focus(),100); },[active]);

  const doScan = useCallback(()=>{
    if(!eventId){ toastErr('Select an event first'); return; }
    const memberId=parseInt(input.trim());
    const member=members.find(m=>m.id===memberId);
    if(!member){
      setResult({success:false,message:`No member found with ID "${input}"`});
      setTimeout(()=>setResult(null),2500);
      setInput('');
      return;
    }
    attendanceService.saveRecords(Number(eventId),[{memberId:member.id,status:'present'}]);
    const entry={
      id:Date.now(), member,
      time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    };
    setScanLog(prev=>[entry,...prev].slice(0,12));
    setResult({success:true,member});
    setInput('');
    toastOK(`${member.fullName} checked in ✅`);
    setTimeout(()=>setResult(null),2800);
    inputRef.current?.focus();
  },[input,eventId,members]);

  const handleKey=(e)=>{ if(e.key==='Enter') doScan(); };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

      {/* Left: scanner viewport */}
      <div>
        {/* Animated scanner frame */}
        <div style={{ position:'relative',borderRadius:20,overflow:'hidden',
          background:'rgba(0,0,0,0.6)', border:`2px solid ${eventId?'#22C55E':'rgba(255,255,255,0.15)'}`,
          height:220, marginBottom:16,
          boxShadow: eventId?'0 0 30px rgba(34,197,94,0.2),0 0 60px rgba(34,197,94,0.1)':'none',
          animation: eventId?'scannerPulse 3s ease infinite':'none',
          transition:'border-color 0.4s,box-shadow 0.4s',
        }}>
          {/* Corner accents */}
          {['top-left','top-right','bottom-left','bottom-right'].map(pos=>{
            const isTop=pos.includes('top'), isLeft=pos.includes('left');
            return (
              <div key={pos} style={{ position:'absolute',
                top:isTop?12:'auto', bottom:!isTop?12:'auto',
                left:isLeft?12:'auto', right:!isLeft?12:'auto',
                width:24, height:24,
                borderTop:isTop?`3px solid ${eventId?'#22C55E':'rgba(255,255,255,0.3)'}`:0,
                borderBottom:!isTop?`3px solid ${eventId?'#22C55E':'rgba(255,255,255,0.3)'}`:0,
                borderLeft:isLeft?`3px solid ${eventId?'#22C55E':'rgba(255,255,255,0.3)'}`:0,
                borderRight:!isLeft?`3px solid ${eventId?'#22C55E':'rgba(255,255,255,0.3)'}`:0,
                borderRadius: isTop&&isLeft?'4px 0 0 0':isTop&&!isLeft?'0 4px 0 0':!isTop&&isLeft?'0 0 0 4px':'0 0 4px 0',
                transition:'border-color 0.4s',
              }}/>
            );
          })}

          {/* Scan line */}
          {eventId && (
            <div style={{ position:'absolute',left:12,right:12,height:2,
              background:'linear-gradient(90deg,transparent,#22C55E,#06B6D4,#22C55E,transparent)',
              boxShadow:'0 0 10px rgba(34,197,94,0.8)',borderRadius:2,
              animation:'scanLine 2.5s ease-in-out infinite',
              pointerEvents:'none',
            }}/>
          )}

          {/* Content */}
          <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',gap:12,padding:20 }}>
            {!eventId ? (
              <>
                <div style={{ fontSize:36,opacity:0.3 }}>📱</div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                  color:'rgba(255,255,255,0.3)',textAlign:'center',lineHeight:1.5 }}>
                  Select an event above<br/>to activate scanner
                </div>
              </>
            ) : result ? (
              <div style={{ animation:'successPop3 0.35s ease both', textAlign:'center' }}>
                {result.success ? (
                  <>
                    <div style={{ fontSize:42, marginBottom:8 }}>✅</div>
                    <div style={{ fontFamily:'var(--font-heading)',fontSize:15,
                      color:'#22C55E',fontWeight:700,textShadow:'0 0 16px rgba(34,197,94,0.8)' }}>
                      {result.member.fullName}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
                      color:'rgba(34,197,94,0.7)',marginTop:4 }}>
                      {result.member.voicePart} · CHECKED IN
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:42, marginBottom:8 }}>❌</div>
                    <div style={{ fontFamily:'var(--font-body)',fontSize:13,
                      color:'#EF4444',textAlign:'center' }}>{result.message}</div>
                  </>
                )}
              </div>
            ) : (
              <>
                <div style={{ fontSize:38,opacity:0.4,animation:'waveBar3 1.5s ease-in-out infinite' }}>
                  🔍
                </div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
                  color:'rgba(34,197,94,0.6)',letterSpacing:'0.12em',textAlign:'center' }}>
                  READY TO SCAN
                </div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                  color:'rgba(255,255,255,0.3)',textAlign:'center' }}>
                  Type a member ID + Enter
                </div>
              </>
            )}
          </div>
        </div>

        {/* Input row */}
        <div style={{ display:'flex',gap:10,marginBottom:12 }}>
          <input ref={inputRef} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Member ID (e.g. 3) → Enter to check in"
            disabled={!eventId}
            style={{ flex:1,padding:'11px 16px',borderRadius:12,outline:'none',
              background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
              border:`1px solid ${eventId?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.1)'}`,
              color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)',
              boxShadow:eventId?'0 0 0 0 rgba(34,197,94,0)':'none',
              transition:'border-color 0.3s',
            }}
            onFocus={e=>{if(eventId)e.target.style.boxShadow='0 0 0 3px rgba(34,197,94,0.15)';}}
            onBlur={e=>e.target.style.boxShadow='none'}
          />
          <button onClick={doScan} disabled={!eventId||!input.trim()}
            style={{ padding:'11px 20px',borderRadius:12,border:'none',
              background:eventId&&input.trim()?'linear-gradient(135deg,#16A34A,#22C55E)':'rgba(255,255,255,0.05)',
              color:eventId&&input.trim()?'#fff':'rgba(255,255,255,0.2)',
              fontFamily:'var(--font-heading)',fontSize:11,fontWeight:700,
              letterSpacing:'0.1em',cursor:eventId&&input.trim()?'pointer':'not-allowed',
              boxShadow:eventId&&input.trim()?'0 0 16px rgba(34,197,94,0.4)':'none',
              transition:'all 0.2s ease',
            }}>
            SCAN
          </button>
        </div>

        {/* Quick-tap member grid */}
        <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',
          letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>Quick Tap</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:6 }}>
          {members.slice(0,10).map(m=>(
            <button key={m.id} onClick={()=>{setInput(String(m.id));setTimeout(()=>inputRef.current?.focus(),50);}}
              style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 10px',
                borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',
                background:'rgba(255,255,255,0.03)',cursor:'pointer',
                transition:'all 0.15s ease',
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=VP_COLOR[m.voicePart]+'60';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
              <Avatar initials={getInitials(m.fullName)} size={22} color={VP_COLOR[m.voicePart]}/>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-body)',fontSize:10,color:'var(--text-primary)',
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                  {m.fullName.split(' ')[0]}
                </div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>
                  ID:{m.id}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: check-in feed */}
      <div>
        <div style={{ fontFamily:'var(--font-heading)',fontSize:11,color:'#22C55E',
          letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:700,
          marginBottom:14,display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'#22C55E',
            boxShadow:'0 0 8px rgba(34,197,94,0.8)',
            animation:'dotPulse3 2s ease infinite' }}/>
          Live Check-In Feed
        </div>

        {scanLog.length===0 ? (
          <div style={{ textAlign:'center',padding:'40px 20px',
            background:'rgba(255,255,255,0.02)',borderRadius:14,
            border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:32,marginBottom:10,opacity:0.3 }}>📋</div>
            <div style={{ fontFamily:'var(--font-body)',fontSize:12,
              color:'rgba(255,255,255,0.25)' }}>
              Check-ins will appear here
            </div>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {scanLog.map((entry,i)=>(
              <div key={entry.id}
                style={{ display:'flex',alignItems:'center',gap:12,
                  padding:'10px 14px',borderRadius:12,
                  background: i===0?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.025)',
                  border: i===0?'1px solid rgba(34,197,94,0.25)':'1px solid rgba(255,255,255,0.05)',
                  animation:'checkIn 0.4s ease both',
                  animationDelay:`${i*0.04}s`,
                }}>
                <Avatar initials={getInitials(entry.member.fullName)} size={32}
                  color={VP_COLOR[entry.member.voicePart]}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                    fontWeight:600,color:'var(--text-primary)',
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                    {entry.member.fullName}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
                    color:VP_COLOR[entry.member.voicePart],marginTop:2 }}>
                    {entry.member.voicePart}
                  </div>
                </div>
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'#22C55E',fontWeight:700 }}>
                    ✅ IN
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',marginTop:2 }}>
                    {entry.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {scanLog.length>0&&(
          <button onClick={()=>setScanLog([])}
            style={{ marginTop:12,width:'100%',padding:'8px',borderRadius:10,
              border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',
              color:'rgba(148,163,184,0.5)',fontFamily:'var(--font-body)',fontSize:12,cursor:'pointer',
              transition:'all 0.2s ease' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='var(--text-secondary)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='rgba(148,163,184,0.5)';}}>
            Clear Feed
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  injectStyles();
  const { session } = useAuth();
  const { success:toastOK, info:toastInfo, error:toastErr } = useToast();
  const location   = useLocation();
  const preselected= location.state?.eventId;

  const [tab, setTab] = useState('mark');

  /* ── data ────────────────────────────────────────────────── */
  const allEvents     = useMemo(()=>eventsService.getAll(),[]);
  const activeMembers = useMemo(()=>membersService.getActive(),[]);
  const allAttendance = useMemo(()=>attendanceService.getAll(),[]);

  /* ── MARK ATTENDANCE ─────────────────────────────────────── */
  const [selectedEventId, setSelectedEventId] = useState(preselected||'');
  const [records, setRecords]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [search, setSearch]     = useState('');
  const [vpFilter, setVpFilter] = useState('all');

  const selectedEvent = useMemo(()=>
    allEvents.find(e=>e.id===Number(selectedEventId)),
    [allEvents,selectedEventId]
  );

  const loadExisting = useCallback((eventId)=>{
    if(!eventId) return;
    const existing = attendanceService.getForEvent(Number(eventId));
    const map={};
    existing.forEach(r=>{ map[r.memberId]=r.status; });
    setRecords(map); setSaved(false);
  },[]);

  const handleEventSelect=(id)=>{ setSelectedEventId(id); loadExisting(id); };

  useEffect(()=>{ if(preselected) loadExisting(preselected); },[]);

  const setMemberStatus=(memberId,status)=>{
    setRecords(prev=>({...prev,[memberId]:status})); setSaved(false);
  };

  const markAll=(status)=>{
    const next={};
    activeMembers.forEach(m=>{ next[m.id]=status; });
    setRecords(next); setSaved(false);
  };

  const handleSave=async()=>{
    if(!selectedEventId){ toastErr('Select an event first'); return; }
    setSaving(true);
    const recs=activeMembers.map(m=>({ memberId:m.id, status:records[m.id]||'absent' }));
    await new Promise(r=>setTimeout(r,350));
    attendanceService.saveRecords(Number(selectedEventId),recs);
    setSaved(true); setSaving(false);
    toastOK(`Attendance saved for "${selectedEvent?.title}"`);
    notificationsService.add({
      type:'success', title:'Attendance recorded',
      message:`${selectedEvent?.title} — ${Object.values(records).filter(s=>s==='present').length} present`,
      actionUrl:'/dashboard/attendance',
    });
  };

  const summary=useMemo(()=>{
    const counts={present:0,late:0,excused:0,absent:0,unmarked:0};
    activeMembers.forEach(m=>{
      const s=records[m.id];
      if(!s) counts.unmarked++;
      else if(counts[s]!==undefined) counts[s]++;
    });
    return counts;
  },[records,activeMembers]);

  /* Filtered member list */
  const filteredMembers=useMemo(()=>{
    let list=activeMembers;
    if(vpFilter!=='all') list=list.filter(m=>m.voicePart===vpFilter);
    if(search.trim()) {
      const q=search.toLowerCase();
      list=list.filter(m=>m.fullName.toLowerCase().includes(q));
    }
    return list;
  },[activeMembers,vpFilter,search]);

  /* Keyboard shortcut handler */
  useEffect(()=>{
    if(tab!=='mark'||!selectedEvent) return;
    // No global key shortcuts needed; per-row handled separately
  },[tab,selectedEvent]);

  /* ── EXCUSES ─────────────────────────────────────────────── */
  const [excuses,setExcuses]       = useState(()=>attendanceService.getExcuses());
  const [excuseModal,setExcuseModal]   = useState(false);
  const [excuseForm,setExcuseForm]     = useState({eventId:'',reason:''});
  const [excuseLoading,setExcuseLoading] = useState(false);
  const [reviewNote,setReviewNote]     = useState('');
  const reloadExcuses=()=>setExcuses(attendanceService.getExcuses());

  const handleSubmitExcuse=async()=>{
    if(!excuseForm.eventId||!excuseForm.reason.trim()){ toastErr('Select an event and provide a reason'); return; }
    setExcuseLoading(true);
    await new Promise(r=>setTimeout(r,300));
    attendanceService.submitExcuse({
      eventId:Number(excuseForm.eventId),
      memberId:session?.userId,
      reason:excuseForm.reason,
      requestedAt:new Date().toISOString(),
    });
    toastOK('Excuse request submitted!');
    setExcuseForm({eventId:'',reason:''}); setExcuseModal(false);
    setExcuseLoading(false); reloadExcuses();
  };

  const handleReviewExcuse=(excuse,status)=>{
    attendanceService.reviewExcuse(excuse.id,status,reviewNote,session?.userId);
    toastOK(status==='approved'?'Excuse approved':'Excuse rejected');
    setReviewNote(''); reloadExcuses();
  };

  /* ── QR ──────────────────────────────────────────────────── */
  const [qrEventId,setQrEventId]=useState('');

  /* ── STATS ───────────────────────────────────────────────── */
  const memberStats=useMemo(()=>{
    return activeMembers.map(m=>{
      const mRec=allAttendance.filter(r=>r.memberId===m.id);
      const ok=mRec.filter(r=>r.status==='present'||r.status==='late').length;
      const rate=mRec.length?Math.round((ok/mRec.length)*100):m.attendance||0;
      // streak: consecutive months with at least 1 present/late
      const now=new Date();
      let streak=0;
      for(let i=0;i<12;i++){
        const d=new Date(now.getFullYear(),now.getMonth()-i,1);
        const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const hasPresence=mRec.some(r=>r.date?.startsWith(key)&&(r.status==='present'||r.status==='late'));
        if(hasPresence) streak++;
        else break;
      }
      return {...m, rate, totalEvents:mRec.length, streak};
    }).sort((a,b)=>b.rate-a.rate);
  },[activeMembers,allAttendance]);

  const voiceStats=useMemo(()=>
    ['Soprano','Alto','Tenor','Bass'].map(vp=>{
      const vpM=memberStats.filter(m=>m.voicePart===vp);
      const avg=vpM.length?Math.round(vpM.reduce((s,m)=>s+m.rate,0)/vpM.length):0;
      return {vp,avg,count:vpM.length,color:VP_COLOR[vp]};
    })
  ,[memberStats]);

  const streakLeaders=[...memberStats].sort((a,b)=>b.streak-a.streak).slice(0,8);
  const atRiskMembers=memberStats.filter(m=>m.rate<70);

  /* ── tabs ────────────────────────────────────────────────── */
  const pendingExcuses=excuses.filter(e=>e.status==='pending').length;
  const tabs=[
    {id:'mark',    label:'Mark Attendance', icon:'✅'},
    {id:'excuses', label:'Excuses',         icon:'📝', count:pendingExcuses||undefined},
    {id:'qr',      label:'QR Check-In',     icon:'📱'},
    {id:'stats',   label:'Statistics',      icon:'📊'},
  ];

  const eventOptions=useMemo(()=>[
    {value:'',label:'Select an event…'},
    ...allEvents.map(e=>({value:String(e.id),label:`${e.title} — ${formatDate(e.date)}`})),
  ],[allEvents]);

  return (
    <div style={{ animation:'fadeUp 0.35s ease both' }}>

      <PageHeader
        title="Attendance Management"
        subtitle="Track, mark, and analyse choir member attendance"
        icon="✅"
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab}/>

      {/* ═══════════════════════════════════════════════
          MARK ATTENDANCE TAB
         ═══════════════════════════════════════════════ */}
      {tab==='mark'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:18 }}>

          {/* Event selector + bulk controls */}
          <GlassPanel color="#22C55E" accentRight="#06B6D4">
            <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
              <div style={{ flex:'1 1 280px' }}>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(148,163,184,0.7)',
                  letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:7 }}>Select Event</div>
                <select value={String(selectedEventId)} onChange={e=>handleEventSelect(e.target.value)}
                  style={{ width:'100%',padding:'11px 14px',borderRadius:12,outline:'none',
                    background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                    border:'1px solid rgba(34,197,94,0.3)',color:'#F0F4FF',
                    fontSize:13,fontFamily:'var(--font-body)',cursor:'pointer' }}>
                  {eventOptions.map(o=>(
                    <option key={o.value} value={o.value}
                      style={{ background:'#141E33',color:'#F0F4FF' }}>{o.label}</option>
                  ))}
                </select>
              </div>
              {selectedEvent&&(
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {[
                    {label:'✅ ALL PRESENT',status:'present',color:'#22C55E'},
                    {label:'❌ ALL ABSENT',status:'absent',color:'#EF4444'},
                    {label:'↺ CLEAR',status:null,color:'rgba(148,163,184,0.6)'},
                  ].map(b=>(
                    <button key={b.label}
                      onClick={()=>b.status?markAll(b.status):setRecords({})}
                      style={{ padding:'8px 14px',borderRadius:10,cursor:'pointer',
                        background:`${b.color}12`,border:`1px solid ${b.color}40`,
                        color:b.color,fontFamily:'var(--font-mono)',fontSize:9,
                        letterSpacing:'0.06em',transition:'all 0.15s ease' }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${b.color}20`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=`${b.color}12`;}}>
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedEvent&&(
              <div style={{ display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',
                marginTop:14,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
                    color:'var(--text-primary)' }}>{selectedEvent.title}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',marginTop:2 }}>
                    {formatDate(selectedEvent.date)} · {selectedEvent.time} · {selectedEvent.location}
                  </div>
                </div>
                <div style={{ display:'flex',gap:6,marginLeft:'auto' }}>
                  {selectedEvent.mandatory&&<Badge color="var(--color-error)">MANDATORY</Badge>}
                  <Badge color="var(--gold)">{selectedEvent.type?.toUpperCase()}</Badge>
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Summary + search/filter row */}
          {selectedEvent&&(
            <div style={{ display:'grid',gridTemplateColumns:'auto 1fr',gap:18,alignItems:'center' }}>

              {/* Donut summary */}
              <div style={{ display:'flex',alignItems:'center',gap:16,
                background:'rgba(255,255,255,0.02)',borderRadius:16,padding:'14px 18px',
                border:'1px solid rgba(255,255,255,0.06)' }}>
                <AttendanceDonut summary={summary} total={activeMembers.length} size={100}/>
                <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                  {Object.entries(STATUS).map(([key,cfg])=>(
                    <div key={key} style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:cfg.color,
                        boxShadow:`0 0 5px ${cfg.color}60`,flexShrink:0 }}/>
                      <span style={{ fontFamily:'var(--font-body)',fontSize:11,
                        color:'var(--text-secondary)',minWidth:55 }}>{cfg.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:11,
                        color:cfg.color,fontWeight:700 }}>{summary[key]||0}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:8,height:8,borderRadius:'50%',
                      background:'rgba(255,255,255,0.15)',flexShrink:0 }}/>
                    <span style={{ fontFamily:'var(--font-body)',fontSize:11,
                      color:'var(--text-muted)',minWidth:55 }}>Unmarked</span>
                    <span style={{ fontFamily:'var(--font-mono)',fontSize:11,
                      color:'var(--text-muted)',fontWeight:700 }}>{summary.unmarked}</span>
                  </div>
                </div>
              </div>

              {/* Search + filter */}
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',
                    fontSize:13,pointerEvents:'none',opacity:0.4 }}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search member…"
                    style={{ width:'100%',boxSizing:'border-box',padding:'10px 14px 10px 40px',
                      borderRadius:12,outline:'none',background:'rgba(255,255,255,0.04)',
                      backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.1)',
                      color:'#F0F4FF',fontSize:13,fontFamily:'var(--font-body)' }}
                    onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.6)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                </div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  {['all','Soprano','Alto','Tenor','Bass'].map(vp=>(
                    <button key={vp} onClick={()=>setVpFilter(vp)}
                      style={{ padding:'5px 12px',borderRadius:20,border:`1px solid ${vpFilter===vp?(VP_COLOR[vp]||'#C9A84C'):'rgba(255,255,255,0.1)'}`,
                        background:vpFilter===vp?`${(VP_COLOR[vp]||'#C9A84C')}18`:'rgba(255,255,255,0.03)',
                        color:vpFilter===vp?(VP_COLOR[vp]||'#C9A84C'):'rgba(148,163,184,0.7)',
                        fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.08em',
                        cursor:'pointer',transition:'all 0.2s ease',
                        boxShadow:vpFilter===vp?`0 0 10px ${(VP_COLOR[vp]||'#C9A84C')}30`:'none',
                      }}>
                      {vp==='all'?'ALL':vp.toUpperCase()}
                    </button>
                  ))}
                  <span style={{ marginLeft:'auto',fontFamily:'var(--font-mono)',fontSize:9,
                    color:'var(--text-muted)',alignSelf:'center' }}>
                    {filteredMembers.length} members
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Member roster */}
          {!selectedEvent ? (
            <div style={{ background:'rgba(255,255,255,0.02)',borderRadius:20,
              border:'1px dashed rgba(255,255,255,0.08)',padding:'48px 24px',textAlign:'center' }}>
              <div style={{ fontSize:40,marginBottom:12,opacity:0.3 }}>📅</div>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:14,color:'rgba(255,255,255,0.3)' }}>
                Select an event to begin
              </div>
              <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                color:'rgba(255,255,255,0.15)',marginTop:6 }}>
                Choose from the dropdown above to start marking attendance
              </div>
            </div>
          ) : (
            <>
              {['Soprano','Alto','Tenor','Bass'].map(vp=>{
                const vpMembers=filteredMembers.filter(m=>m.voicePart===vp);
                if(vpMembers.length===0) return null;
                const vpPresent=vpMembers.filter(m=>records[m.id]==='present'||records[m.id]==='late').length;
                const vpPct=Math.round((vpPresent/vpMembers.length)*100);
                return (
                  <div key={vp}>
                    {/* Section header */}
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                      <div style={{ width:3,height:20,background:VP_COLOR[vp],
                        borderRadius:2,boxShadow:`0 0 8px ${VP_COLOR[vp]}60` }}/>
                      <span style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                        color:VP_COLOR[vp],letterSpacing:'0.08em',textTransform:'uppercase' }}>
                        {vp} <span style={{ opacity:0.6 }}>({vpMembers.length})</span>
                      </span>
                      <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }}/>
                      {/* Section progress */}
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ width:60,height:3,borderRadius:2,
                          background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                          <div style={{ height:'100%',width:`${vpPct}%`,
                            background:`linear-gradient(90deg,${VP_COLOR[vp]}80,${VP_COLOR[vp]})`,
                            borderRadius:2,transition:'width 0.4s ease' }}/>
                        </div>
                        <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                          color:VP_COLOR[vp],fontWeight:700 }}>{vpPct}%</span>
                      </div>
                    </div>

                    <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:20 }}>
                      {vpMembers.map((m,mi)=>{
                        const status=records[m.id];
                        const excuse=excuses.find(e=>e.eventId===Number(selectedEventId)&&e.memberId===m.id&&e.status==='approved');
                        const rowBg=status?`${STATUS[status].color}10`:'rgba(255,255,255,0.02)';
                        const rowBorder=status?`${STATUS[status].color}22`:'rgba(255,255,255,0.06)';
                        return (
                          <div key={m.id}
                            style={{ display:'flex',alignItems:'center',gap:12,
                              background:rowBg, border:`1px solid ${rowBorder}`,
                              borderRadius:14,padding:'10px 14px',
                              transition:'all 0.2s ease',
                              animation:`attFadeUp 0.3s ease ${mi*0.03}s both`,
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.background=status?`${STATUS[status].color}18`:'rgba(255,255,255,0.04)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background=rowBg;}}
                          >
                            <Avatar initials={getInitials(m.fullName)} size={36}
                              online={m.online} color={VP_COLOR[vp]}/>

                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontFamily:'var(--font-body)',fontSize:13,
                                fontWeight:600,color:'var(--text-primary)',
                                whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                                {m.fullName}
                              </div>
                              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:2 }}>
                                <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                                  color:'var(--text-muted)' }}>
                                  Avg {m.attendance||0}%
                                </span>
                                {excuse&&(
                                  <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                                    color:'#8B5CF6',background:'rgba(139,92,246,0.12)',
                                    padding:'1px 6px',borderRadius:20,border:'1px solid rgba(139,92,246,0.25)' }}>
                                    📝 EXCUSED
                                  </span>
                                )}
                                {(m.attendance||0)<70&&(
                                  <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                                    color:'#EF4444',background:'rgba(239,68,68,0.1)',
                                    padding:'1px 6px',borderRadius:20,border:'1px solid rgba(239,68,68,0.25)',
                                    animation:'dotPulse3 2s ease infinite' }}>
                                    AT-RISK
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Status buttons */}
                            <div style={{ display:'flex',gap:5 }}>
                              {Object.keys(STATUS).map(s=>(
                                <StatusBtn key={s} status={s} current={status}
                                  disabled={!!(excuse&&s!=='excused')}
                                  onClick={()=>setMemberStatus(m.id,s)}/>
                              ))}
                            </div>

                            {/* Current badge */}
                            {status&&(
                              <div style={{ minWidth:76,textAlign:'right',flexShrink:0 }}>
                                <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                                  letterSpacing:'0.08em',fontWeight:700,
                                  color:STATUS[status].color,
                                  background:`${STATUS[status].color}15`,
                                  border:`1px solid ${STATUS[status].color}35`,
                                  borderRadius:20,padding:'3px 8px',
                                  boxShadow:`0 0 8px ${STATUS[status].color}30` }}>
                                  {STATUS[status].icon} {STATUS[status].label.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Save footer */}
              <div style={{ display:'flex',justifyContent:'flex-end',alignItems:'center',
                gap:12,paddingTop:4 }}>
                {saved&&(
                  <div style={{ display:'flex',alignItems:'center',gap:6,
                    fontFamily:'var(--font-mono)',fontSize:10,color:'#22C55E',
                    animation:'attFadeUp 0.2s ease both' }}>
                    <svg width={14} height={14} viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="6" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1"/>
                      <path d="M4 7L6.5 9.5L10 4.5" fill="none" stroke="#22C55E" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Saved successfully
                  </div>
                )}
                <button onClick={handleSave} disabled={saving}
                  style={{ padding:'10px 24px',borderRadius:12,border:'none',
                    background:saving?'rgba(255,255,255,0.05)':'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
                    color:saving?'rgba(255,255,255,0.2)':'#080C14',
                    fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                    letterSpacing:'0.1em',textTransform:'uppercase',
                    cursor:saving?'not-allowed':'pointer',
                    boxShadow:saving?'none':'0 0 20px rgba(201,168,76,0.35)',
                    transition:'all 0.2s ease',
                    display:'flex',alignItems:'center',gap:8 }}>
                  {saving?(
                    <>
                      <svg width={12} height={12} viewBox="0 0 12 12"
                        style={{ animation:'spin3 0.8s linear infinite' }}>
                        <circle cx="6" cy="6" r="4.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
                        <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" fill="none" stroke="#080C14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Saving…
                    </>
                  ):'💾 Save Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          EXCUSE REQUESTS TAB
         ═══════════════════════════════════════════════ */}
      {tab==='excuses'&&(
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:'var(--font-body)',fontSize:13,color:'var(--text-secondary)',lineHeight:1.5 }}>
                Submit and manage absence excuse requests.
                {pendingExcuses>0&&(
                  <span style={{ marginLeft:8,fontFamily:'var(--font-mono)',fontSize:10,
                    color:'#F59E0B',background:'rgba(245,158,11,0.1)',
                    border:'1px solid rgba(245,158,11,0.3)',borderRadius:20,
                    padding:'2px 8px',animation:'dotPulse3 2s ease infinite' }}>
                    {pendingExcuses} pending
                  </span>
                )}
              </div>
            </div>
            <Button variant="primary" icon="📝" onClick={()=>setExcuseModal(true)}>
              Submit Excuse
            </Button>
          </div>

          {excuses.length===0 ? (
            <div style={{ textAlign:'center',padding:'60px 24px',
              background:'rgba(255,255,255,0.02)',borderRadius:20,
              border:'1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:40,marginBottom:12,opacity:0.3 }}>📝</div>
              <div style={{ fontFamily:'var(--font-heading)',fontSize:14,
                color:'rgba(255,255,255,0.3)' }}>No excuse requests yet</div>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {excuses.map((exc,i)=>{
                const member=activeMembers.find(m=>m.id===exc.memberId);
                const event=allEvents.find(e=>e.id===exc.eventId);
                const stColor=exc.status==='approved'?'#22C55E':exc.status==='rejected'?'#EF4444':'#F59E0B';
                return (
                  <div key={exc.id||i}
                    style={{ background:'linear-gradient(135deg,rgba(20,30,51,0.9),rgba(15,23,42,0.95))',
                      backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.07)',
                      borderRadius:18,overflow:'hidden',
                      boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
                      animation:`attSlideIn 0.35s ease ${i*0.05}s both` }}>
                    <div style={{ height:2,background:`linear-gradient(90deg,transparent,${stColor}90,transparent)` }}/>
                    <div style={{ padding:'16px 20px' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',gap:14,flexWrap:'wrap' }}>
                        <Avatar initials={getInitials(member?.fullName||'?')} size={46}
                          color={VP_COLOR[member?.voicePart]}/>
                        <div style={{ flex:1,minWidth:180 }}>
                          <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
                            color:'var(--text-primary)',marginBottom:4 }}>
                            {member?.fullName||`Member #${exc.memberId}`}
                          </div>
                          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
                            color:'var(--text-muted)',marginBottom:10,letterSpacing:'0.06em' }}>
                            {event?.title||`Event #${exc.eventId}`}
                            {event?` · ${formatDate(event.date)}`:''}
                            {' · '}Submitted {formatDate(exc.requestedAt,'relative')}
                          </div>
                          <div style={{ fontFamily:'var(--font-body)',fontSize:13,
                            color:'var(--text-secondary)',lineHeight:1.5,
                            background:'rgba(255,255,255,0.03)',borderRadius:10,
                            padding:'10px 14px',borderLeft:`2px solid ${stColor}50` }}>
                            "{exc.reason}"
                          </div>
                          {exc.reviewNote&&(
                            <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                              color:'var(--text-muted)',marginTop:8,fontStyle:'italic' }}>
                              Review note: {exc.reviewNote}
                            </div>
                          )}
                        </div>
                        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10,flexShrink:0 }}>
                          <span style={{ fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                            letterSpacing:'0.1em',color:stColor,
                            background:`${stColor}12`,border:`1px solid ${stColor}35`,
                            borderRadius:20,padding:'3px 10px',
                            boxShadow:`0 0 8px ${stColor}30` }}>
                            {exc.status.toUpperCase()}
                          </span>
                          {exc.status==='pending'&&(
                            <div style={{ display:'flex',gap:6 }}>
                              <button onClick={()=>handleReviewExcuse(exc,'approved')}
                                style={{ padding:'6px 14px',borderRadius:20,border:'1px solid rgba(34,197,94,0.4)',
                                  background:'rgba(34,197,94,0.1)',color:'#22C55E',
                                  fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                                  cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.15s ease' }}
                                onMouseEnter={e=>{e.currentTarget.style.background='rgba(34,197,94,0.2)';}}
                                onMouseLeave={e=>{e.currentTarget.style.background='rgba(34,197,94,0.1)';}}>
                                ✅ APPROVE
                              </button>
                              <button onClick={()=>handleReviewExcuse(exc,'rejected')}
                                style={{ padding:'6px 14px',borderRadius:20,border:'1px solid rgba(239,68,68,0.4)',
                                  background:'rgba(239,68,68,0.1)',color:'#EF4444',
                                  fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                                  cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.15s ease' }}
                                onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.2)';}}
                                onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';}}>
                                ❌ REJECT
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit excuse modal */}
          <Modal isOpen={excuseModal} onClose={()=>setExcuseModal(false)}
            title="Submit Absence Excuse" accent="var(--color-violet)" size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={()=>setExcuseModal(false)}>Cancel</Button>
                <Button variant="primary" loading={excuseLoading} onClick={handleSubmitExcuse}>
                  Submit Request
                </Button>
              </>
            }>
            <InfoBox type="info" style={{ marginBottom:16 }}>
              Your excuse will be reviewed by a committee member.
            </InfoBox>
            <Select label="Event" value={excuseForm.eventId}
              onChange={v=>setExcuseForm(f=>({...f,eventId:v}))}
              options={[{value:'',label:'Select event…'},...allEvents.filter(e=>e.date>=new Date().toISOString().split('T')[0]).map(e=>({value:String(e.id),label:`${e.title} — ${formatDate(e.date)}`}))]}
              style={{ marginBottom:14 }}/>
            <Input label="Reason for Absence" multiline rows={4}
              value={excuseForm.reason}
              onChange={v=>setExcuseForm(f=>({...f,reason:v}))}
              placeholder="Explain why you cannot attend…" maxLength={400}/>
          </Modal>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          QR CHECK-IN TAB
         ═══════════════════════════════════════════════ */}
      {tab==='qr'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
          <GlassPanel color="#22C55E" accentRight="#06B6D4">
            <div style={{ display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 260px' }}>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
                  color:'rgba(148,163,184,0.7)',letterSpacing:'0.14em',
                  textTransform:'uppercase',marginBottom:7 }}>Select Event</div>
                <select value={qrEventId} onChange={e=>setQrEventId(e.target.value)}
                  style={{ width:'100%',padding:'11px 14px',borderRadius:12,outline:'none',
                    background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                    border:'1px solid rgba(34,197,94,0.3)',color:'#F0F4FF',
                    fontSize:13,fontFamily:'var(--font-body)',cursor:'pointer' }}>
                  {eventOptions.map(o=>(
                    <option key={o.value} value={o.value}
                      style={{ background:'#141E33',color:'#F0F4FF' }}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontFamily:'var(--font-body)',fontSize:12,
                color:'rgba(148,163,184,0.6)',lineHeight:1.5 }}>
                In production: scan QR with camera<br/>
                Dev mode: type member ID + Enter
              </div>
            </div>
          </GlassPanel>

          <GlassPanel color="#22C55E" accentRight="#06B6D4">
            <QRScannerFrame
              active={tab==='qr'}
              eventId={qrEventId}
              members={activeMembers}
            />
          </GlassPanel>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          STATISTICS TAB
         ═══════════════════════════════════════════════ */}
      {tab==='stats'&&(
        <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

          {/* Gauge rings per section */}
          <GlassPanel title="Section Attendance Gauges" icon="🎤"
            color="var(--color-violet)" accentRight="#EC4899">
            <div style={{ display:'flex',justifyContent:'space-around',
              flexWrap:'wrap',gap:24,padding:'10px 0' }}>
              {voiceStats.map(({vp,avg,color})=>(
                <GaugeRing key={vp} label={vp} value={avg} color={color}
                  icon={vp==='Soprano'?'🎵':vp==='Alto'?'🎶':vp==='Tenor'?'🎤':'🎸'}
                  size={100}/>
              ))}
            </div>
          </GlassPanel>

          {/* Section summary cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14 }}>
            {voiceStats.map(({vp,avg,count,color})=>(
              <div key={vp} style={{ background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,
                overflow:'hidden',transition:'border-color 0.2s ease' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=`${color}50`}
                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
                <div style={{ height:2,background:`linear-gradient(90deg,transparent,${color},transparent)` }}/>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:28,fontWeight:900,
                    color,lineHeight:1,textShadow:`0 0 20px ${color}40` }}>{avg}%</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color,
                    textTransform:'uppercase',letterSpacing:'0.08em',marginTop:4 }}>{vp}</div>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                    color:'var(--text-muted)',marginTop:3 }}>{count} members</div>
                  <div style={{ marginTop:8,height:3,borderRadius:2,
                    background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${avg}%`,
                      background:`linear-gradient(90deg,${color}80,${color})`,borderRadius:2,
                      boxShadow:`0 0 8px ${color}50`,transition:'width 1s ease' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-member bars + streak leaderboard */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:18 }}>

            {/* Member bars */}
            <GlassPanel title="Per-Member Attendance Rates" icon="📊"
              color="var(--color-violet)">
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {memberStats.map((m,i)=>{
                  const color=attendanceColor(m.rate);
                  return (
                    <div key={m.id} style={{ animation:`attFadeUp 0.3s ease ${i*0.025}s both` }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:5 }}>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
                          color:i<3?'var(--gold)':'var(--text-muted)',
                          width:24,textAlign:'center',fontWeight:700,flexShrink:0 }}>
                          {i<3?['🥇','🥈','🥉'][i]:i+1}
                        </div>
                        <Avatar initials={getInitials(m.fullName)} size={32}
                          color={VP_COLOR[m.voicePart]}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontFamily:'var(--font-body)',fontSize:13,
                            fontWeight:600,color:'var(--text-primary)',
                            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                            {m.fullName}
                          </div>
                          <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                            color:'var(--text-muted)',marginTop:1 }}>
                            {m.voicePart} · {m.totalEvents} events
                          </div>
                        </div>
                        <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
                          {m.rate<70&&(
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                              color:'#EF4444',background:'rgba(239,68,68,0.1)',
                              border:'1px solid rgba(239,68,68,0.25)',
                              borderRadius:20,padding:'1px 6px',
                              animation:'dotPulse3 2s ease infinite' }}>AT-RISK</span>
                          )}
                          {m.streak>0&&(
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                              color:'#F59E0B',background:'rgba(245,158,11,0.1)',
                              border:'1px solid rgba(245,158,11,0.2)',
                              borderRadius:20,padding:'1px 6px' }}>
                              🔥{m.streak}mo
                            </span>
                          )}
                          <span style={{ fontFamily:'var(--font-heading)',fontSize:16,
                            color,fontWeight:900,minWidth:44,textAlign:'right',
                            textShadow:`0 0 12px ${color}50` }}>
                            {m.rate}%
                          </span>
                        </div>
                      </div>
                      <div style={{ paddingLeft:62,height:4,borderRadius:3,
                        background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${m.rate}%`,
                          background:`linear-gradient(90deg,${color}80,${color})`,borderRadius:3,
                          boxShadow:`0 0 8px ${color}60`,transition:'width 1s ease' }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>

            {/* Streak + at-risk */}
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* Streak leaderboard */}
              <GlassPanel title="🔥 Attendance Streaks" icon=""
                color="#F59E0B" accentRight="#EF4444">
                <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                  color:'var(--text-muted)',marginBottom:12 }}>
                  Consecutive months with attendance
                </div>
                {streakLeaders.filter(m=>m.streak>0).slice(0,6).map((m,i)=>(
                  <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,
                    marginBottom:10,padding:'8px 12px',borderRadius:12,
                    background:i===0?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.02)',
                    border:i===0?'1px solid rgba(245,158,11,0.2)':'1px solid rgba(255,255,255,0.04)',
                    transition:'all 0.2s ease' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=i===0?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.02)';}}>
                    <span style={{ fontSize:14,flexShrink:0 }}>
                      {i===0?'🔥':i===1?'🔥':i===2?'✨':'⭐'}
                    </span>
                    <Avatar initials={getInitials(m.fullName)} size={28}
                      color={VP_COLOR[m.voicePart]}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,
                        color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',
                        whiteSpace:'nowrap',marginBottom:2 }}>{m.fullName}</div>
                      <div style={{ height:2,borderRadius:1,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                        <div style={{ height:'100%',
                          width:`${(m.streak/Math.max(streakLeaders[0]?.streak||1,1))*100}%`,
                          background:`linear-gradient(90deg,#F59E0B,#EF4444)`,
                          borderRadius:1,transition:'width 1s ease' }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-heading)',fontSize:17,fontWeight:900,
                        color:'#F59E0B',textShadow:'0 0 10px rgba(245,158,11,0.6)' }}>
                        {m.streak}
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)' }}>MONTHS</div>
                    </div>
                  </div>
                ))}
                {streakLeaders.filter(m=>m.streak>0).length===0&&(
                  <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-muted)',padding:'10px 0' }}>
                    No streaks yet
                  </div>
                )}
              </GlassPanel>

              {/* At-risk members */}
              {atRiskMembers.length>0&&(
                <GlassPanel title="⚠ At-Risk Members" icon="" color="#EF4444" accentRight="#F59E0B">
                  <div style={{ fontFamily:'var(--font-body)',fontSize:11,
                    color:'var(--text-muted)',marginBottom:12 }}>
                    Members below 70% attendance threshold
                  </div>
                  {atRiskMembers.slice(0,5).map((m,i)=>(
                    <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,
                      marginBottom:8,padding:'8px 12px',borderRadius:12,
                      background:'rgba(239,68,68,0.06)',
                      border:'1px solid rgba(239,68,68,0.15)',
                      animation:'dotPulse3 3s ease infinite',
                      animationDelay:`${i*0.5}s` }}>
                      <Avatar initials={getInitials(m.fullName)} size={28}
                        color={VP_COLOR[m.voicePart]}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,
                          color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',
                          whiteSpace:'nowrap' }}>{m.fullName}</div>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                          color:'var(--text-muted)' }}>{m.voicePart}</div>
                      </div>
                      <div style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:900,
                        color:'#EF4444',flexShrink:0,textShadow:'0 0 10px rgba(239,68,68,0.5)' }}>
                        {m.rate}%
                      </div>
                    </div>
                  ))}
                </GlassPanel>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
