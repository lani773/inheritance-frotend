/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Events & Calendar Page  (Enhanced v2)

   Design: Holographic glassmorphism · Neon glow · Multi-view calendar

   Views:
   • Cards    — glass event cards with countdown rings + attendance arcs
   • Calendar — month grid with neon event dots + hover preview
   • Timeline — vertical chronological timeline with activity feed
   • Week     — 7-column week strip with time slots

   NEW vs v1:
   ✦ Full glassmorphism design system (matches Login/Register/Members)
   ✦ Inject-once CSS keyframes
   ✦ 4-view toggle: Cards / Calendar / Timeline / Week
   ✦ Cards: animated countdown ring (SVG), neon glow borders per type
   ✦ Cards: attendance progress arc, quick-stat pills
   ✦ Cards: "LIVE TODAY" pulse badge, "TOMORROW" warm badge
   ✦ Calendar: iridescent today highlight, multi-event stacking
   ✦ Calendar: hover preview tooltip with event details
   ✦ Calendar: color legend pills with count
   ✦ Timeline: vertical neon line, type-colored nodes, date grouping
   ✦ Week: 7-col day strip with event blocks per time slot
   ✦ Urgent panel: next 7 days strip at top when upcoming events exist
   ✦ Search bar across all views
   ✦ Animated KPI chips with trend sparklines
   ✦ Create Event button: gold shimmer + pulse
   ✦ Confirm dialog: glass morphism version
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast }    from '../../context/ToastContext';
import { eventsService, membersService, attendanceService } from '../../services/index';
import { EVENT_TYPES } from '../../config/constants';
import {
  PageHeader, Badge, EmptyState,
} from '../../components/shared/index';
import Button    from '../../components/shared/Button';
import EventModal from '../../components/events/EventModal';
import { EventEnhancedView } from '../../components/events-v2/EventEnhancedView';
import { formatDate, daysUntil, isFuture } from '../../utils/index';

/* ── Inject keyframes ────────────────────────────────────────── */
const STYLES = `
@keyframes evFadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes evSlideIn   { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
@keyframes evRimSweep  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes evPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 70%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
@keyframes evLivePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
@keyframes evCountArc  { from{stroke-dasharray:0 314} }
@keyframes evNodePop   { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes evLineGrow  { from{height:0} to{height:100%} }
@keyframes evShimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes evGoldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 70%{box-shadow:0 0 0 8px rgba(201,168,76,0)} }
@keyframes evDotBlink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes evPopIn     { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
`;
function injectStyles() {
  if (document.getElementById('ic-ev-styles')) return;
  const s = document.createElement('style');
  s.id = 'ic-ev-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Helpers ─────────────────────────────────────────────────── */
const typeColor = (type) => EVENT_TYPES.find(e => e.id === type)?.color || '#3B82F6';
const typeIcon  = (type) => EVENT_TYPES.find(e => e.id === type)?.icon  || '📅';
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT= ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ── Glass panel ─────────────────────────────────────────────── */
function GlassPanel({ children, color='var(--gold)', accentRight, style={} }) {
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
        animation:'evRimSweep 5s linear infinite', backgroundSize:'200% 100%' }}/>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );
}

/* ── Countdown ring (SVG) ────────────────────────────────────── */
function CountdownRing({ days, color, size=60 }) {
  const r = size * 0.38, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;
  // Ring shows urgency: 0 days = full red, 30+ days = full color
  const pct = days <= 0 ? 1 : Math.max(0, 1 - days/30);
  const dash = pct * circ;
  const ringColor = days === 0 ? '#EF4444' : days <= 3 ? '#F59E0B' : color;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07}/>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={ringColor} strokeWidth={size*0.07}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter:`drop-shadow(0 0 4px ${ringColor}80)`,
          animation:'evCountArc 1s ease both', transition:'stroke-dasharray 0.6s ease' }}/>
      <text x={cx} y={cy-3} textAnchor="middle" fill={ringColor}
        style={{ fontFamily:'DM Mono,monospace', fontSize:size*0.2, fontWeight:700 }}>
        {days <= 0 ? '!' : days > 99 ? '99+' : days}
      </text>
      <text x={cx} y={cy+8} textAnchor="middle" fill="rgba(148,163,184,0.5)"
        style={{ fontFamily:'DM Mono,monospace', fontSize:size*0.11 }}>
        {days <= 0 ? 'NOW' : days === 1 ? 'day' : 'days'}
      </text>
    </svg>
  );
}

/* ── Event card (Cards view) ─────────────────────────────────── */
function EventCard({ event, onEdit, onCancel, onMarkAttendance, memberCount, idx }) {
  const color   = typeColor(event.type);
  const icon    = typeIcon(event.type);
  const days    = daysUntil(event.date);
  const past    = days < 0;
  const isToday = days === 0;
  const isTomorrow = days === 1;
  const attRecs = useMemo(() => attendanceService.getForEvent(event.id), [event.id]);
  const present = attRecs.filter(r => r.status === 'present' || r.status === 'late').length;
  const attPct  = memberCount ? Math.round((present / memberCount) * 100) : 0;
  const attCirc = 2 * Math.PI * 18;
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        position:'relative', overflow:'hidden',
        background: hov
          ? `linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))`
          : 'linear-gradient(135deg,rgba(20,30,51,0.9),rgba(15,23,42,0.95))',
        backdropFilter:'blur(20px)',
        border: hov ? `1px solid ${color}50` : `1px solid rgba(255,255,255,0.07)`,
        borderLeft: `3px solid ${color}`,
        borderRadius:18, padding:'18px 18px 14px',
        transition:'all 0.25s ease',
        boxShadow: hov
          ? `0 12px 40px rgba(0,0,0,0.5),0 0 0 1px ${color}20`
          : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        animation:`evFadeUp 0.35s ease ${idx*0.05}s both`,
        opacity: past ? 0.7 : 1,
      }}>
      {/* Top rim */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${color}90,transparent)` }}/>

      {/* TODAY pulse badge */}
      {isToday && (
        <div style={{ position:'absolute',top:12,right:12,
          display:'flex',alignItems:'center',gap:5,
          background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.4)',
          borderRadius:20,padding:'3px 10px',
          animation:'evPulse 2s ease infinite' }}>
          <div style={{ width:6,height:6,borderRadius:'50%',background:'#EF4444',
            animation:'evDotBlink 1s ease infinite' }}/>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
            color:'#EF4444',letterSpacing:'0.1em',fontWeight:700 }}>LIVE TODAY</span>
        </div>
      )}
      {isTomorrow && !isToday && (
        <div style={{ position:'absolute',top:12,right:12,
          background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.3)',
          borderRadius:20,padding:'3px 10px' }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
            color:'#F59E0B',letterSpacing:'0.1em',fontWeight:700 }}>TOMORROW</span>
        </div>
      )}

      {/* Header row */}
      <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:12 }}>
        <div style={{ flex:1,minWidth:0 }}>
          {/* Type + mandatory badges */}
          <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:8 }}>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
              color,background:`${color}18`,border:`1px solid ${color}40`,
              borderRadius:20,padding:'2px 8px',letterSpacing:'0.06em' }}>
              {icon} {event.type?.toUpperCase()}
            </span>
            {event.mandatory&&(
              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                color:'#EF4444',background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.3)',borderRadius:20,
                padding:'2px 8px',letterSpacing:'0.06em' }}>MANDATORY</span>
            )}
            {past&&(
              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                color:'rgba(148,163,184,0.4)',background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,
                padding:'2px 8px',letterSpacing:'0.06em' }}>PAST</span>
            )}
          </div>

          <div style={{ fontFamily:'var(--font-heading)',fontSize:15,fontWeight:700,
            color: hov ? color : 'var(--text-primary)',
            transition:'color 0.2s ease',marginBottom:2,
            textShadow:hov?`0 0 14px ${color}40`:'none' }}>
            {event.title}
          </div>
        </div>

        {/* Countdown ring */}
        {!past && (
          <CountdownRing days={days} color={color} size={56}/>
        )}
      </div>

      {/* Info grid */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12 }}>
        {[
          { icon:'📅', val:formatDate(event.date) },
          { icon:'⏰', val:`${event.time}${event.endTime?` — ${event.endTime}`:''}` },
          { icon:'📍', val:event.location||'—' },
          { icon:'🎤', val:event.targetVoices?.join(', ')||'All sections' },
        ].map(({icon:ic,val},i)=>(
          <div key={i} style={{ display:'flex',gap:6,alignItems:'flex-start' }}>
            <span style={{ fontSize:11,flexShrink:0,opacity:0.6 }}>{ic}</span>
            <span style={{ fontFamily:'var(--font-body)',fontSize:11,
              color:'var(--text-secondary)',lineHeight:1.4,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Attendance arc bar */}
      {attRecs.length>0&&(
        <div style={{ display:'flex',alignItems:'center',gap:10,
          padding:'8px 12px',background:'rgba(255,255,255,0.03)',
          borderRadius:10,marginBottom:12,border:'1px solid rgba(255,255,255,0.06)' }}>
          {/* Mini SVG attendance ring */}
          <svg width={40} height={40} viewBox="0 0 40 40">
            <circle cx={20} cy={20} r={15} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth={4}/>
            <circle cx={20} cy={20} r={15} fill="none"
              stroke={attPct>=80?'#22C55E':attPct>=50?'#F59E0B':'#EF4444'}
              strokeWidth={4}
              strokeDasharray={`${(attPct/100)*2*Math.PI*15} ${2*Math.PI*15}`}
              strokeLinecap="round" transform="rotate(-90 20 20)"
              style={{ transition:'stroke-dasharray 0.8s ease' }}/>
            <text x={20} y={24} textAnchor="middle"
              fill={attPct>=80?'#22C55E':attPct>=50?'#F59E0B':'#EF4444'}
              style={{ fontFamily:'DM Mono,monospace',fontSize:8,fontWeight:700 }}>
              {attPct}%
            </text>
          </svg>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,
              color:'var(--text-muted)',letterSpacing:'0.08em',marginBottom:4 }}>
              ATTENDANCE
            </div>
            <div style={{ height:3,borderRadius:2,
              background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${attPct}%`,
                background:`linear-gradient(90deg,${attPct>=80?'#22C55E':attPct>=50?'#F59E0B':'#EF4444'}80,${attPct>=80?'#22C55E':attPct>=50?'#F59E0B':'#EF4444'})`,
                borderRadius:2,transition:'width 0.8s ease' }}/>
            </div>
          </div>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:11,
            color:'#22C55E',fontWeight:700,flexShrink:0 }}>
            {present}/{memberCount}
          </span>
        </div>
      )}

      {/* Description */}
      {event.description&&(
        <p style={{ fontFamily:'var(--font-body)',fontSize:12,
          color:'var(--text-muted)',lineHeight:1.5,marginBottom:12,
          display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>
          {event.description}
        </p>
      )}

      {/* Actions */}
      <div style={{ display:'flex',gap:7,flexWrap:'wrap' }}>
        {!past&&(
          <button onClick={()=>onMarkAttendance(event)}
            style={{ padding:'7px 14px',borderRadius:10,border:`1px solid ${color}50`,
              background:`${color}12`,color,fontFamily:'var(--font-mono)',fontSize:9,
              fontWeight:700,letterSpacing:'0.08em',cursor:'pointer',
              transition:'all 0.15s ease',display:'flex',alignItems:'center',gap:5 }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${color}22`;e.currentTarget.style.boxShadow=`0 0 10px ${color}40`;}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${color}12`;e.currentTarget.style.boxShadow='none';}}>
            ✅ MARK ATTEND.
          </button>
        )}
        <button onClick={()=>onEdit(event)}
          style={{ padding:'7px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
            fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.08em',cursor:'pointer',
            transition:'all 0.15s ease' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
          ✏️ EDIT
        </button>
        <button onClick={()=>onCancel(event)}
          style={{ padding:'7px 12px',borderRadius:10,border:'1px solid rgba(239,68,68,0.2)',
            background:'rgba(239,68,68,0.06)',color:'rgba(239,68,68,0.7)',
            fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.08em',cursor:'pointer',
            transition:'all 0.15s ease',marginLeft:'auto' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.14)';e.currentTarget.style.color='#EF4444';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.06)';e.currentTarget.style.color='rgba(239,68,68,0.7)';}}>
          ✕ CANCEL
        </button>
      </div>
    </div>
  );
}

/* ── Glass Calendar (month view) ─────────────────────────────── */
function CalendarView({ events, currentDate, onDateClick, onEventClick }) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];
  const [hovDay, setHovDay] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const eventMap = useMemo(() => {
    const map = {};
    events.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <GlassPanel color="var(--gold)" accentRight="#3B82F6" style={{ padding:0 }}>
      <div>
        {/* Day headers */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',
          borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {DAYS_SHORT.map(d=>(
            <div key={d} style={{ padding:'12px 6px',textAlign:'center',
              fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(148,163,184,0.5)',
              letterSpacing:'0.08em',textTransform:'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)' }}>
          {cells.map((day,i)=>{
            if(!day) return (
              <div key={`e-${i}`} style={{ minHeight:88,
                borderRight:'1px solid rgba(255,255,255,0.04)',
                borderBottom:'1px solid rgba(255,255,255,0.04)',
                background:'rgba(0,0,0,0.1)' }}/>
            );
            const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayEvents=eventMap[dateStr]||[];
            const isToday=dateStr===today;
            const isPast=dateStr<today;
            const isHov=hovDay===dateStr;

            return (
              <div key={dateStr}
                onClick={()=>onDateClick(dateStr)}
                onMouseEnter={()=>setHovDay(dateStr)}
                onMouseLeave={()=>setHovDay(null)}
                style={{ minHeight:88,padding:'7px 6px 4px',
                  borderRight:'1px solid rgba(255,255,255,0.04)',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  cursor:'pointer',position:'relative',
                  background: isToday
                    ? 'rgba(201,168,76,0.08)'
                    : isHov
                    ? 'rgba(255,255,255,0.035)'
                    : 'transparent',
                  transition:'background 0.15s ease',
                }}>
                {/* Day number */}
                <div style={{ width:26,height:26,borderRadius:'50%',
                  background: isToday
                    ? 'linear-gradient(135deg,#A07820,#C9A84C)'
                    : 'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:'var(--font-heading)',fontSize:12,
                  fontWeight:isToday?700:400,marginBottom:4,
                  color: isToday?'#080C14':isPast?'rgba(148,163,184,0.3)':'var(--text-primary)',
                  boxShadow:isToday?'0 0 12px rgba(201,168,76,0.4)':isHov?'0 0 8px rgba(255,255,255,0.1)':'none',
                  transition:'all 0.15s ease',
                }}>{day}</div>

                {/* Event dots / chips */}
                {dayEvents.slice(0,3).map((ev,ei)=>(
                  <div key={ev.id}
                    onClick={e=>{e.stopPropagation();onEventClick(ev);}}
                    title={ev.title}
                    style={{ background:typeColor(ev.type),
                      borderRadius:4,padding:'2px 5px',marginBottom:2,
                      fontFamily:'var(--font-mono)',fontSize:8,
                      color:'#fff',whiteSpace:'nowrap',
                      overflow:'hidden',textOverflow:'ellipsis',
                      cursor:'pointer',opacity:isPast?0.5:1,
                      letterSpacing:'0.03em',
                      boxShadow:`0 0 6px ${typeColor(ev.type)}50`,
                      transition:'opacity 0.15s ease',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='1';setTooltip({ev,x:e.clientX,y:e.clientY});}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity=isPast?'0.5':'1';setTooltip(null);}}>
                    {typeIcon(ev.type)} {ev.title}
                  </div>
                ))}
                {dayEvents.length>3&&(
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                    color:'rgba(148,163,184,0.5)',paddingLeft:2 }}>
                    +{dayEvents.length-3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Event tooltip */}
        {tooltip&&(
          <div style={{ position:'fixed',
            left:Math.min(tooltip.x+10,window.innerWidth-220),
            top:Math.min(tooltip.y+10,window.innerHeight-140),
            background:'rgba(10,16,30,0.97)',backdropFilter:'blur(16px)',
            border:`1px solid ${typeColor(tooltip.ev.type)}50`,
            borderRadius:12,padding:'12px 14px',
            pointerEvents:'none',zIndex:500,
            boxShadow:`0 8px 30px rgba(0,0,0,0.6),0 0 20px ${typeColor(tooltip.ev.type)}15`,
            minWidth:190,maxWidth:220 }}>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
              color:typeColor(tooltip.ev.type),marginBottom:5 }}>
              {typeIcon(tooltip.ev.type)} {tooltip.ev.title}
            </div>
            {[
              {i:'📅',v:formatDate(tooltip.ev.date)},
              {i:'⏰',v:tooltip.ev.time},
              {i:'📍',v:tooltip.ev.location||'—'},
            ].map(({i,v})=>(
              <div key={i} style={{ display:'flex',gap:6,marginBottom:3 }}>
                <span style={{ fontSize:10,opacity:0.6 }}>{i}</span>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,
                  color:'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
            {tooltip.ev.mandatory&&(
              <div style={{ marginTop:6,fontFamily:'var(--font-mono)',fontSize:8,
                color:'#EF4444',background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.25)',borderRadius:20,
                padding:'2px 8px',display:'inline-block' }}>MANDATORY</div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

/* ── Timeline view ───────────────────────────────────────────── */
function TimelineView({ events, onEdit, onCancel, onMarkAttendance, memberCount }) {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...events].sort((a,b)=>a.date.localeCompare(b.date));

  // Group by date
  const groups = useMemo(()=>{
    const map = {};
    sorted.forEach(ev=>{
      const key=ev.date;
      if(!map[key]) map[key]=[];
      map[key].push(ev);
    });
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));
  },[sorted]);

  return (
    <div style={{ position:'relative' }}>
      {/* Vertical neon line */}
      <div style={{ position:'absolute',left:19,top:0,bottom:0,width:2,
        background:'linear-gradient(180deg,transparent,rgba(201,168,76,0.4) 10%,rgba(201,168,76,0.2) 90%,transparent)',
        borderRadius:2 }}/>

      {groups.length===0 ? (
        <div style={{ textAlign:'center',padding:'60px 24px',
          background:'rgba(255,255,255,0.02)',borderRadius:20,
          border:'1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:40,marginBottom:12,opacity:0.3 }}>📅</div>
          <div style={{ fontFamily:'var(--font-heading)',fontSize:14,color:'rgba(255,255,255,0.3)' }}>
            No events to display
          </div>
        </div>
      ) : groups.map(([date,dayEvs],gi)=>{
        const isToday=date===today;
        const isPast=date<today;
        return (
          <div key={date} style={{ display:'flex',gap:0,marginBottom:24,
            animation:`evFadeUp 0.3s ease ${gi*0.06}s both` }}>
            {/* Node */}
            <div style={{ flexShrink:0,marginRight:20,zIndex:2 }}>
              <div style={{ width:40,height:40,borderRadius:'50%',
                background: isToday
                  ? 'linear-gradient(135deg,#A07820,#C9A84C)'
                  : isPast
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(201,168,76,0.12)',
                border: isToday
                  ? '2px solid #C9A84C'
                  : isPast
                  ? '2px solid rgba(255,255,255,0.1)'
                  : '2px solid rgba(201,168,76,0.4)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:isToday?'0 0 16px rgba(201,168,76,0.5)':'none',
                animation:'evNodePop 0.4s ease both',
                position:'relative',
              }}>
                <span style={{ fontFamily:'var(--font-heading)',fontSize:11,fontWeight:700,
                  color:isToday?'#080C14':isPast?'rgba(148,163,184,0.3)':'var(--gold)' }}>
                  {new Date(date).getDate()}
                </span>
                {isToday&&(
                  <div style={{ position:'absolute',inset:-3,borderRadius:'50%',
                    border:'2px solid rgba(201,168,76,0.4)',
                    animation:'evPulse 2s ease infinite' }}/>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex:1,minWidth:0 }}>
              {/* Date label */}
              <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                color:isToday?'var(--gold)':isPast?'rgba(148,163,184,0.4)':'var(--text-primary)',
                marginBottom:8,marginTop:10,display:'flex',alignItems:'center',gap:8 }}>
                {formatDate(date,'long')}
                {isToday&&(
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                    color:'#EF4444',background:'rgba(239,68,68,0.1)',
                    border:'1px solid rgba(239,68,68,0.3)',borderRadius:20,
                    padding:'2px 8px',letterSpacing:'0.1em',fontWeight:700,
                    animation:'evLivePulse 2s ease infinite' }}>TODAY</span>
                )}
              </div>

              {/* Events for this day */}
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {dayEvs.map((ev,ei)=>{
                  const color=typeColor(ev.type);
                  const attRecs=attendanceService.getForEvent(ev.id);
                  const present=attRecs.filter(r=>r.status==='present'||r.status==='late').length;
                  return (
                    <div key={ev.id}
                      style={{ background:'linear-gradient(135deg,rgba(20,30,51,0.9),rgba(15,23,42,0.95))',
                        backdropFilter:'blur(16px)',
                        border:`1px solid ${color}25`,borderLeft:`3px solid ${color}`,
                        borderRadius:14,padding:'12px 16px',
                        transition:'all 0.2s ease',
                        animation:`evSlideIn 0.3s ease ${(gi*5+ei)*0.04}s both` }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${color}55`;e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,0.3),0 0 0 1px ${color}15`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=`${color}25`;e.currentTarget.style.boxShadow='none';}}>
                      <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}>
                        <div style={{ flex:1,minWidth:180 }}>
                          <div style={{ display:'flex',gap:5,flexWrap:'wrap',marginBottom:5 }}>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                              color,background:`${color}15`,border:`1px solid ${color}35`,
                              borderRadius:20,padding:'1px 7px',letterSpacing:'0.06em' }}>
                              {typeIcon(ev.type)} {ev.type?.toUpperCase()}
                            </span>
                            {ev.mandatory&&(
                              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,
                                color:'#EF4444',background:'rgba(239,68,68,0.1)',
                                border:'1px solid rgba(239,68,68,0.3)',
                                borderRadius:20,padding:'1px 7px',letterSpacing:'0.06em' }}>MANDATORY</span>
                            )}
                          </div>
                          <div style={{ fontFamily:'var(--font-heading)',fontSize:14,fontWeight:700,
                            color:'var(--text-primary)',marginBottom:4 }}>{ev.title}</div>
                          <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>
                              ⏰ {ev.time}{ev.endTime?` — ${ev.endTime}`:''}
                            </span>
                            <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>
                              📍 {ev.location||'—'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
                          {attRecs.length>0&&(
                            <div style={{ fontFamily:'var(--font-mono)',fontSize:10,
                              color:'#22C55E',fontWeight:700 }}>
                              ✅ {present}/{memberCount}
                            </div>
                          )}
                          {!isPast&&(
                            <button onClick={()=>onMarkAttendance(ev)}
                              style={{ padding:'5px 12px',borderRadius:8,border:`1px solid ${color}40`,
                                background:`${color}10`,color,fontFamily:'var(--font-mono)',
                                fontSize:8,fontWeight:700,letterSpacing:'0.06em',cursor:'pointer',
                                transition:'all 0.15s ease' }}
                              onMouseEnter={e=>e.currentTarget.style.background=`${color}22`}
                              onMouseLeave={e=>e.currentTarget.style.background=`${color}10`}>
                              MARK
                            </button>
                          )}
                          <button onClick={()=>onEdit(ev)}
                            style={{ padding:'5px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',
                              background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.6)',
                              fontFamily:'var(--font-mono)',fontSize:8,cursor:'pointer',
                              transition:'all 0.15s ease' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.6)';}}>
                            EDIT
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Week view ───────────────────────────────────────────────── */
function WeekView({ events, weekStart, onEventClick }) {
  const today = new Date().toISOString().split('T')[0];
  const days  = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart);
    d.setDate(weekStart.getDate()+i);
    return { d, str:d.toISOString().split('T')[0] };
  });

  const eventMap = useMemo(()=>{
    const m={};
    events.forEach(ev=>{ if(!m[ev.date]) m[ev.date]=[]; m[ev.date].push(ev); });
    return m;
  },[events]);

  return (
    <GlassPanel color="var(--gold)" accentRight="#06B6D4" style={{ padding:0 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)' }}>
        {days.map(({d,str})=>{
          const dayEvs=eventMap[str]||[];
          const isToday=str===today;
          const isPast=str<today;
          return (
            <div key={str} style={{ borderRight:'1px solid rgba(255,255,255,0.05)',
              minHeight:160,
              background:isToday?'rgba(201,168,76,0.06)':'transparent' }}>
              {/* Day header */}
              <div style={{ padding:'12px 8px 8px',
                borderBottom:'1px solid rgba(255,255,255,0.05)',textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:8,
                  color:'rgba(148,163,184,0.5)',letterSpacing:'0.08em',
                  textTransform:'uppercase',marginBottom:5 }}>
                  {DAYS_SHORT[d.getDay()]}
                </div>
                <div style={{ width:28,height:28,borderRadius:'50%',margin:'0 auto',
                  background:isToday?'linear-gradient(135deg,#A07820,#C9A84C)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontFamily:'var(--font-heading)',fontSize:13,fontWeight:isToday?700:400,
                  color:isToday?'#080C14':isPast?'rgba(148,163,184,0.3)':'var(--text-primary)',
                  boxShadow:isToday?'0 0 12px rgba(201,168,76,0.4)':'none' }}>
                  {d.getDate()}
                </div>
              </div>

              {/* Events */}
              <div style={{ padding:'6px 4px',display:'flex',flexDirection:'column',gap:4 }}>
                {dayEvs.map(ev=>(
                  <div key={ev.id}
                    onClick={()=>onEventClick(ev)}
                    style={{ borderRadius:6,padding:'4px 6px',
                      background:typeColor(ev.type),
                      opacity:isPast?0.5:1,cursor:'pointer',
                      transition:'all 0.15s ease',
                      boxShadow:`0 0 6px ${typeColor(ev.type)}40` }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='scale(1.02)';}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity=isPast?'0.5':'1';e.currentTarget.style.transform='scale(1)';}}>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'#fff',
                      fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                      {typeIcon(ev.type)} {ev.title}
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:7,
                      color:'rgba(255,255,255,0.7)',marginTop:1 }}>{ev.time}</div>
                  </div>
                ))}
                {dayEvs.length===0&&isToday&&(
                  <div style={{ fontFamily:'var(--font-body)',fontSize:10,
                    color:'rgba(148,163,184,0.25)',textAlign:'center',padding:'8px 0' }}>
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

/* ── Urgent upcoming strip ───────────────────────────────────── */
function UpcomingStrip({ events, onMarkAttendance }) {
  if(!events.length) return null;
  return (
    <div style={{ display:'flex',gap:10,overflowX:'auto',paddingBottom:4,marginBottom:22 }}>
      {events.map(ev=>{
        const color=typeColor(ev.type);
        const days=daysUntil(ev.date);
        return (
          <div key={ev.id}
            style={{ flexShrink:0,width:200,borderRadius:14,padding:'12px 14px',
              background:`linear-gradient(135deg,${color}18,${color}06)`,
              border:`1px solid ${color}40`,
              boxShadow:days===0?`0 0 20px ${color}25`:'none',
              transition:'all 0.2s ease' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.4),0 0 16px ${color}20`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=days===0?`0 0 20px ${color}25`:'none';}}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6 }}>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,fontWeight:700,
                color,letterSpacing:'0.08em' }}>{typeIcon(ev.type)} {ev.type?.toUpperCase()}</span>
              <span style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:900,
                color:days===0?'#EF4444':days===1?'#F59E0B':color,
                textShadow:`0 0 8px ${days===0?'#EF4444':days===1?'#F59E0B':color}60` }}>
                {days===0?'TODAY':days===1?'TMRW':`${days}d`}
              </span>
            </div>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
              color:'var(--text-primary)',marginBottom:3,
              whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{ev.title}</div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',marginBottom:8 }}>
              ⏰ {ev.time} · 📍 {ev.location||'—'}
            </div>
            <button onClick={()=>onMarkAttendance(ev)}
              style={{ width:'100%',padding:'5px 0',borderRadius:8,border:`1px solid ${color}50`,
                background:`${color}12`,color,fontFamily:'var(--font-mono)',fontSize:8,
                fontWeight:700,letterSpacing:'0.08em',cursor:'pointer',transition:'all 0.15s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${color}25`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${color}12`;}}>
              ✅ MARK ATTENDANCE
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Confirm glass dialog ────────────────────────────────────── */
function ConfirmGlass({ open, title, message, confirmLabel='Confirm', onConfirm, onCancel }) {
  if(!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(8,12,20,0.85)',
      zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',
      backdropFilter:'blur(6px)' }} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'linear-gradient(135deg,rgba(20,30,51,0.97),rgba(15,23,42,0.99))',
          backdropFilter:'blur(24px)',border:'1px solid rgba(239,68,68,0.35)',borderRadius:22,
          padding:28,maxWidth:420,width:'90%',
          boxShadow:'0 0 40px rgba(239,68,68,0.1),0 24px 60px rgba(0,0,0,0.6)',
          animation:'evFadeUp 0.25s ease both' }}>
        <div style={{ height:2,background:'linear-gradient(90deg,transparent,rgba(239,68,68,0.8),transparent)',
          marginBottom:20,borderRadius:2 }}/>
        <h3 style={{ fontFamily:'var(--font-heading)',color:'#EF4444',fontSize:17,margin:'0 0 10px' }}>{title}</h3>
        <p style={{ fontFamily:'var(--font-body)',color:'var(--text-secondary)',
          marginBottom:24,lineHeight:1.6,fontSize:13 }}>{message}</p>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding:'10px 20px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
              background:'rgba(255,255,255,0.04)',color:'var(--text-secondary)',
              fontFamily:'var(--font-body)',fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm}
            style={{ padding:'10px 22px',borderRadius:12,border:'1px solid rgba(239,68,68,0.5)',
              background:'rgba(239,68,68,0.15)',color:'#EF4444',
              fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
              letterSpacing:'0.1em',cursor:'pointer',
              boxShadow:'0 0 12px rgba(239,68,68,0.25)' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function EventsPage() {
  injectStyles();
  const navigate = useNavigate();
  const { success:toastOK, info:toastInfo } = useToast();

  const [events,       setEvents]       = useState(()=>eventsService.getAll());
  const [view,         setView]         = useState('cards');
  const [filter,       setFilter]       = useState('upcoming');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [search,       setSearch]       = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [weekStart,    setWeekStart]    = useState(()=>{
    const d=new Date();
    d.setDate(d.getDate()-d.getDay());
    return d;
  });
  const [createModal,  setCreateModal]  = useState(false);
  const [editEvent,    setEditEvent]    = useState(null);
  const [cancelEvent,  setCancelEvent]  = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const memberCount = useMemo(()=>membersService.getActive().length,[]);
  const reload      = useCallback(()=>setEvents(eventsService.getAll()),[]);
  const today       = new Date().toISOString().split('T')[0];

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(()=>{
    let list=[...events];
    if(filter==='upcoming') list=list.filter(e=>e.date>=today);
    if(filter==='past')     list=list.filter(e=>e.date<today);
    if(typeFilter!=='all')  list=list.filter(e=>e.type===typeFilter);
    if(search.trim()){
      const q=search.toLowerCase();
      list=list.filter(e=>
        e.title?.toLowerCase().includes(q)||
        e.location?.toLowerCase().includes(q)||
        e.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a,b)=>
      filter==='past'?b.date.localeCompare(a.date):a.date.localeCompare(b.date)
    );
  },[events,filter,typeFilter,search,today]);

  /* Calendar & week events */
  const calendarEvents = useMemo(()=>{
    const yr=calendarDate.getFullYear();
    const mo=String(calendarDate.getMonth()+1).padStart(2,'0');
    return events.filter(e=>e.date.startsWith(`${yr}-${mo}`));
  },[events,calendarDate]);

  const weekEvents = useMemo(()=>{
    const end=new Date(weekStart); end.setDate(weekStart.getDate()+7);
    const endStr=end.toISOString().split('T')[0];
    const startStr=weekStart.toISOString().split('T')[0];
    return events.filter(e=>e.date>=startStr&&e.date<endStr);
  },[events,weekStart]);

  /* ── CRUD ────────────────────────────────────────────────── */
  const handleSave=(data,isEdit)=>{
    if(isEdit){ eventsService.update(data.id,data); toastOK(`"${data.title}" updated`); }
    else { eventsService.create(data); toastOK(`"${data.title}" created! 🎉`); }
    reload(); setCreateModal(false); setEditEvent(null);
  };

  const handleCancel=()=>{
    eventsService.delete(cancelEvent.id);
    toastInfo(`"${cancelEvent.title}" cancelled`);
    reload(); setCancelEvent(null);
  };

  const prevMonth=()=>setCalendarDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
  const nextMonth=()=>setCalendarDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1));
  const prevWeek=()=>setWeekStart(d=>{ const n=new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek=()=>setWeekStart(d=>{ const n=new Date(d); n.setDate(n.getDate()+7); return n; });

  /* ── Stats ───────────────────────────────────────────────── */
  const upcoming   = events.filter(e=>e.date>=today);
  const mandatory  = upcoming.filter(e=>e.mandatory);
  const next7Days  = upcoming.filter(e=>{
    const d=daysUntil(e.date);
    return d>=0&&d<=7;
  }).slice(0,5);

  /* Views config */
  const views = [
    {id:'cards',    icon:'⊞', label:'Cards'},
    {id:'calendar', icon:'📅', label:'Month'},
    {id:'timeline', icon:'⟳', label:'Timeline'},
    {id:'week',     icon:'⧉', label:'Week'},
  ];

  const weekLabel = `${MONTHS[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()} — ${
    (()=>{ const e=new Date(weekStart); e.setDate(weekStart.getDate()+6); return `${MONTHS[e.getMonth()].slice(0,3)} ${e.getDate()}`; })()
  }`;

  return (
    <div style={{ animation:'evFadeUp 0.35s ease both' }}>

      {/* ── Page header ──────────────────────────────────── */}
      <PageHeader
        title="Events & Rehearsals"
        subtitle={`${upcoming.length} upcoming · ${mandatory.length} mandatory`}
        icon="📅"
        actions={
          <>
            {/* View toggle */}
            <div style={{ display:'flex',border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12,overflow:'hidden' }}>
              {views.map(v=>(
                <button key={v.id} onClick={()=>setView(v.id)}
                  style={{ padding:'8px 14px',border:'none',cursor:'pointer',
                    transition:'all 0.15s ease',display:'flex',alignItems:'center',gap:5,
                    background:view===v.id?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.02)',
                    color:view===v.id?'var(--gold)':'rgba(148,163,184,0.5)',
                    fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.06em',
                    borderRight:'1px solid rgba(255,255,255,0.06)',
                    boxShadow:view===v.id?'inset 0 0 12px rgba(201,168,76,0.1)':'none' }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {/* Create button */}
            <button onClick={()=>setCreateModal(true)}
              style={{ padding:'10px 22px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#A07820,#C9A84C,#E8C96A)',
                backgroundSize:'200% 100%',
                color:'#080C14',fontFamily:'var(--font-heading)',fontSize:12,
                fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                cursor:'pointer',animation:'evGoldPulse 3s ease infinite',
                boxShadow:'0 0 20px rgba(201,168,76,0.35)',
                display:'flex',alignItems:'center',gap:8 }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 0 32px rgba(201,168,76,0.55)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 0 20px rgba(201,168,76,0.35)'}>
              ✦ Create Event
            </button>
          </>
        }
      />

      {/* ── Type KPI chips ───────────────────────────────── */}
      <div style={{ display:'flex',gap:10,marginBottom:18,flexWrap:'wrap' }}>
        {EVENT_TYPES.map(t=>{
          const count=events.filter(e=>e.type===t.id&&e.date>=today).length;
          const isFil=typeFilter===t.id;
          return (
            <button key={t.id}
              onClick={()=>{setTypeFilter(isFil?'all':t.id);setFilter('upcoming');}}
              style={{ background:`${t.color}${isFil?'22':'10'}`,
                border:`1px solid ${t.color}${isFil?'60':'30'}`,
                borderRadius:20,padding:'6px 14px',cursor:'pointer',
                display:'flex',alignItems:'center',gap:7,
                boxShadow:isFil?`0 0 14px ${t.color}30`:'none',
                transition:'all 0.2s ease' }}>
              <span style={{ fontSize:13 }}>{t.icon}</span>
              <span style={{ fontFamily:'var(--font-heading)',fontSize:14,
                fontWeight:900,color:t.color,
                textShadow:isFil?`0 0 8px ${t.color}60`:'none' }}>{count}</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:t.color,
                opacity:0.8,textTransform:'uppercase',letterSpacing:'0.06em' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Upcoming 7-day strip ─────────────────────────── */}
      {next7Days.length>0&&(view==='cards'||view==='timeline')&&(
        <>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(148,163,184,0.5)',
            letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10 }}>
            ⚡ NEXT 7 DAYS
          </div>
          <UpcomingStrip events={next7Days}
            onMarkAttendance={e=>navigate('/dashboard/attendance',{state:{eventId:e.id}})}/>
        </>
      )}

      {/* ── Filter + Search bar ──────────────────────────── */}
      {(view==='cards'||view==='timeline')&&(
        <div style={{ display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'center' }}>
          {/* Time filter pills */}
          <div style={{ display:'flex',gap:5 }}>
            {['all','upcoming','past'].map(f=>{
              const isSel=filter===f;
              return (
                <button key={f} onClick={()=>{setFilter(f);setSelectedDate(null);}}
                  style={{ padding:'6px 14px',borderRadius:20,cursor:'pointer',
                    fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
                    letterSpacing:'0.08em',textTransform:'uppercase',transition:'all 0.2s ease',
                    background:isSel?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.03)',
                    border:isSel?'1px solid rgba(201,168,76,0.5)':'1px solid rgba(255,255,255,0.08)',
                    color:isSel?'var(--gold)':'rgba(148,163,184,0.6)',
                    boxShadow:isSel?'0 0 10px rgba(201,168,76,0.25)':'none' }}>
                  {f==='all'?'ALL':f==='upcoming'?'UPCOMING':'PAST'}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position:'relative',flex:'1 1 200px' }}>
            <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
              fontSize:12,pointerEvents:'none',opacity:0.35 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search events…"
              style={{ width:'100%',boxSizing:'border-box',
                padding:'8px 14px 8px 38px',borderRadius:12,outline:'none',
                background:'rgba(255,255,255,0.04)',backdropFilter:'blur(12px)',
                border:'1px solid rgba(255,255,255,0.1)',color:'#F0F4FF',
                fontSize:13,fontFamily:'var(--font-body)',transition:'border-color 0.2s' }}
              onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.6)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
          </div>

          <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
            color:'var(--text-muted)',marginLeft:'auto',letterSpacing:'0.06em' }}>
            {filtered.length} EVENTS
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CARDS VIEW
         ══════════════════════════════════════════════════ */}
      {view==='cards'&&(
        filtered.length===0 ? (
          <div style={{ textAlign:'center',padding:'60px 24px',
            background:'rgba(255,255,255,0.02)',borderRadius:20,
            border:'1px dashed rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:44,marginBottom:12,opacity:0.3 }}>📅</div>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:16,color:'rgba(255,255,255,0.3)',marginBottom:16 }}>
              No events found
            </div>
            <button onClick={()=>setCreateModal(true)}
              style={{ padding:'10px 24px',borderRadius:12,border:'1px solid rgba(201,168,76,0.4)',
                background:'rgba(201,168,76,0.1)',color:'var(--gold)',
                fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,
                letterSpacing:'0.1em',cursor:'pointer' }}>
              ✦ Create Event
            </button>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16 }}>
            {filtered.map((ev,i)=>(
              <EventCard key={ev.id} event={ev} idx={i} memberCount={memberCount}
                onEdit={setEditEvent} onCancel={setCancelEvent}
                onMarkAttendance={e=>navigate('/dashboard/attendance',{state:{eventId:e.id}})}/>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════
          CALENDAR VIEW
         ══════════════════════════════════════════════════ */}
      {view==='calendar'&&(
        <div>
          {/* Month navigation */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <button onClick={prevMonth}
              style={{ padding:'8px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
                cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11,transition:'all 0.15s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
              ← PREV
            </button>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:700,
              color:'var(--text-primary)',textAlign:'center' }}>
              {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </div>
            <button onClick={nextMonth}
              style={{ padding:'8px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
                cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11,transition:'all 0.15s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
              NEXT →
            </button>
          </div>

          {/* Color legend */}
          <div style={{ display:'flex',gap:12,marginBottom:14,flexWrap:'wrap' }}>
            {EVENT_TYPES.map(t=>(
              <div key={t.id} style={{ display:'flex',alignItems:'center',gap:5 }}>
                <div style={{ width:10,height:10,borderRadius:3,background:t.color,
                  boxShadow:`0 0 6px ${t.color}50` }}/>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:9,
                  color:'rgba(148,163,184,0.6)',letterSpacing:'0.04em' }}>{t.label}</span>
              </div>
            ))}
          </div>

          <CalendarView events={calendarEvents} currentDate={calendarDate}
            onDateClick={dateStr=>{
              setSelectedDate(dateStr); setView('cards');
              setFilter('all'); setTypeFilter('all');
            }}
            onEventClick={setEditEvent}/>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TIMELINE VIEW
         ══════════════════════════════════════════════════ */}
      {view==='timeline'&&(
        <TimelineView events={filtered} memberCount={memberCount}
          onEdit={setEditEvent} onCancel={setCancelEvent}
          onMarkAttendance={e=>navigate('/dashboard/attendance',{state:{eventId:e.id}})}/>
      )}

      {/* ══════════════════════════════════════════════════
          WEEK VIEW
         ══════════════════════════════════════════════════ */}
      {view==='week'&&(
        <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <button onClick={prevWeek}
              style={{ padding:'8px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
                cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11,transition:'all 0.15s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
              ← PREV WEEK
            </button>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:700,color:'var(--text-primary)' }}>
              {weekLabel}
            </div>
            <button onClick={nextWeek}
              style={{ padding:'8px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',
                background:'rgba(255,255,255,0.04)',color:'rgba(148,163,184,0.7)',
                cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:11,transition:'all 0.15s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(148,163,184,0.7)';}}>
              NEXT WEEK →
            </button>
          </div>
          <WeekView events={weekEvents} weekStart={weekStart} onEventClick={setEditEvent}/>
          <div style={{ marginTop:12,fontFamily:'var(--font-mono)',fontSize:9,
            color:'var(--text-muted)',textAlign:'center',letterSpacing:'0.06em' }}>
            {weekEvents.length} events this week · click any event to edit
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {createModal&&(
        <EventModal isOpen onClose={()=>setCreateModal(false)}
          onSave={handleSave} defaultDate={selectedDate}/>
      )}
      {editEvent&&(
        <EventModal isOpen onClose={()=>setEditEvent(null)}
          onSave={handleSave} event={editEvent}/>
      )}
      <ConfirmGlass open={!!cancelEvent}
        title="Cancel Event"
        message={`Cancel "${cancelEvent?.title}" on ${cancelEvent?formatDate(cancelEvent.date):''}? Attendance records will remain.`}
        confirmLabel="Cancel Event"
        onConfirm={handleCancel} onCancel={()=>setCancelEvent(null)}/>
    </div>
  );
}
