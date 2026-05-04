/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Analytics Page  (Enhanced v3 — Deep Continue)

   NEW in v3:
   - Contribution Activity Heatmap (52-week GitHub-style calendar)
   - Forecast Engine (linear regression → 3-month projection)
   - Voice Section Radar Chart (spider/web SVG)
   - Member Retention Funnel
   - Smart Alerts Panel (auto-generated insights)
   - Payment Method Breakdown (donut + bars)
   - Contribution Streak Leaderboard
   - Per-Section Gauge Rings (attendance)
   - Animated number counter on mount

   Tabs: Financial · Attendance · Members · Insights
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  getContributionTrend, getAttendanceTrend, getVoiceDistribution,
  getTopContributors, getYoYContributions, getMemberGrowth,
  getMemberAttendanceRates, getContributionByType, getSummaryStats,
} from '../../utils/analytics';
import { Tabs, Badge, ProgressBar, Avatar } from '../../components/shared/index';
import { PageHeader, StatCard } from '../../components/shared/index';
import { formatCurrency, formatDate, attendanceColor } from '../../utils/index';
import Storage, { KEYS } from '../../storage/engine';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

/* ── Design tokens ───────────────────────────────────────────── */
const NEON = {
  gold:   '#C9A84C',
  blue:   '#3B82F6',
  purple: '#8B5CF6',
  pink:   '#EC4899',
  green:  '#22C55E',
  cyan:   '#06B6D4',
  amber:  '#F59E0B',
  rose:   '#F43F5E',
};
const HOLO = ['#C9A84C','#3B82F6','#8B5CF6','#EC4899','#22C55E','#06B6D4','#F59E0B'];

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ══════════════════════════════════════════════════════════════════ */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

/* ══════════════════════════════════════════════════════════════════
   HOLOGRAPHIC AREA CHART  (pure SVG)
   ══════════════════════════════════════════════════════════════════ */
function HoloAreaChart({ data = [], lines = [], height = 220, showGrid = true }) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  if (!data.length || !lines.length) return null;

  const W = 100, H = 100;
  const PAD = { top: 8, right: 4, bottom: 18, left: 8 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const allVals = data.flatMap(d => lines.map(l => parseFloat(d[l.key] || 0)));
  const maxV = Math.max(...allVals, 1);
  const px = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * cW;
  const py = (v) => PAD.top + cH - (v / maxV) * cH;
  const buildPath = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(2)},${py(parseFloat(d[key] || 0)).toFixed(2)}`).join(' ');
  const buildArea = (key) => {
    const line = buildPath(key);
    return `${line} L${px(data.length - 1).toFixed(2)},${(PAD.top + cH).toFixed(2)} L${PAD.left.toFixed(2)},${(PAD.top + cH).toFixed(2)} Z`;
  };
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: PAD.top + cH - p * cH,
    label: (maxV * p >= 1000 ? `${Math.round(maxV * p / 1000)}K` : Math.round(maxV * p)),
  }));

  return (
    <div style={{ position:'relative', width:'100%', height }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:'100%', height:'100%', overflow:'visible' }}
        onMouseMove={e => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const relX = (e.clientX - rect.left) / rect.width * W;
          setHov(Math.max(0, Math.min(data.length - 1, Math.round(((relX - PAD.left) / cW) * (data.length - 1)))));
        }}
        onMouseLeave={() => setHov(null)}
      >
        <defs>
          {lines.map(l => (
            <React.Fragment key={l.key}>
              <linearGradient id={`area-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.42" />
                <stop offset="70%" stopColor={l.color} stopOpacity="0.08" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`holo-${l.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.8" />
                <stop offset="50%" stopColor={l.color2 || l.color} />
                <stop offset="100%" stopColor={l.color3 || l.color} stopOpacity="0.8" />
              </linearGradient>
              <filter id={`glow-${l.key}`}>
                <feGaussianBlur stdDeviation="0.4" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </React.Fragment>
          ))}
        </defs>
        {showGrid && gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y}
              stroke="#1E2D4A" strokeWidth="0.25" strokeDasharray="1,1" />
            <text x={PAD.left - 0.5} y={g.y + 0.9} textAnchor="end" fill="#5A6B85"
              style={{ fontSize:'2.6px', fontFamily:'DM Mono,monospace' }}>{g.label}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const show = data.length <= 12 || i % Math.ceil(data.length / 8) === 0;
          return show ? (
            <text key={i} x={px(i)} y={H - 1} textAnchor="middle" fill="#5A6B85"
              style={{ fontSize:'2.6px', fontFamily:'DM Mono,monospace' }}>
              {d.month?.slice(0, 3) || d.label}
            </text>
          ) : null;
        })}
        {[...lines].reverse().map(l => (
          <path key={`area-${l.key}`} d={buildArea(l.key)} fill={`url(#area-${l.key})`} />
        ))}
        {lines.map(l => (
          <path key={`line-${l.key}`} d={buildPath(l.key)} fill="none"
            stroke={`url(#holo-${l.key})`} strokeWidth="0.65"
            strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow-${l.key})`} />
        ))}
        {hov !== null && (
          <>
            <line x1={px(hov)} y1={PAD.top} x2={px(hov)} y2={PAD.top + cH}
              stroke="rgba(201,168,76,0.4)" strokeWidth="0.3" strokeDasharray="1,0.5" />
            {lines.map(l => {
              const v = parseFloat(data[hov]?.[l.key] || 0);
              return <circle key={l.key} cx={px(hov)} cy={py(v)} r="1.1"
                fill={l.color} stroke="#0F172A" strokeWidth="0.35"
                style={{ filter:`drop-shadow(0 0 2px ${l.color})` }} />;
            })}
          </>
        )}
      </svg>
      {hov !== null && data[hov] && (
        <div style={{ position:'absolute', left:`${(hov/Math.max(data.length-1,1))*100}%`, top:0,
          transform: hov > data.length * 0.65 ? 'translateX(-105%)' : 'translateX(8px)',
          background:'rgba(10,16,30,0.97)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(201,168,76,0.3)', borderRadius:10,
          padding:'10px 14px', pointerEvents:'none', zIndex:30,
          boxShadow:'0 8px 32px rgba(0,0,0,0.7)', minWidth:130 }}>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:6 }}>
            {data[hov].month || data[hov].label}
          </div>
          {lines.map(l => (
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

/* ══════════════════════════════════════════════════════════════════
   NEON LINE CHART
   ══════════════════════════════════════════════════════════════════ */
function NeonLineChart({ data = [], lines = [], height = 200 }) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  if (!data.length) return null;
  const W = 100, H = 100;
  const PAD = { top: 8, right: 4, bottom: 18, left: 8 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const allVals = data.flatMap(d => lines.map(l => parseFloat(d[l.key] || 0)));
  const maxV = Math.max(...allVals, 1);
  const px = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * cW;
  const py = (v) => PAD.top + cH - (Math.min(v, maxV) / maxV) * cH;
  const buildSmooth = (key) => {
    const pts = data.map((d, i) => [px(i), py(parseFloat(d[key] || 0))]);
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const cpx = (x1 + x2) / 2;
      d += ` C${cpx},${y1} ${cpx},${y2} ${x2},${y2}`;
    }
    return d;
  };
  return (
    <div style={{ position:'relative', width:'100%', height }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width:'100%', height:'100%', overflow:'visible' }}
        onMouseMove={e => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const relX = (e.clientX - rect.left) / rect.width * W;
          setHov(Math.max(0, Math.min(data.length - 1, Math.round(((relX - PAD.left) / cW) * (data.length - 1)))));
        }}
        onMouseLeave={() => setHov(null)}
      >
        <defs>
          {lines.map(l => (
            <filter key={l.key} id={`neon-${l.key}`}>
              <feGaussianBlur stdDeviation="0.7" result="b1" />
              <feMerge><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          ))}
        </defs>
        {[0,0.25,0.5,0.75,1].map((p,i) => (
          <line key={i} x1={PAD.left} y1={PAD.top+cH-p*cH} x2={W-PAD.right} y2={PAD.top+cH-p*cH}
            stroke="#1E2D4A" strokeWidth="0.25" strokeDasharray="0.8,0.8" />
        ))}
        {data.map((d, i) => {
          const show = data.length <= 12 || i % Math.ceil(data.length / 7) === 0;
          return show ? (
            <text key={i} x={px(i)} y={H-1} textAnchor="middle" fill="#5A6B85"
              style={{ fontSize:'2.6px', fontFamily:'DM Mono,monospace' }}>
              {d.month?.slice(0,3)||d.label}
            </text>
          ) : null;
        })}
        {lines.map(l => (
          <React.Fragment key={l.key}>
            <path d={buildSmooth(l.key)} fill="none" stroke={l.color} strokeWidth="1.6" strokeOpacity="0.15"
              strokeLinecap="round" filter={`url(#neon-${l.key})`} />
            <path d={buildSmooth(l.key)} fill="none" stroke={l.color} strokeWidth="0.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </React.Fragment>
        ))}
        {hov !== null && lines.map(l => {
          const v = parseFloat(data[hov]?.[l.key] || 0);
          return (
            <g key={l.key}>
              <circle cx={px(hov)} cy={py(v)} r="1.5" fill={l.color} opacity="0.15" />
              <circle cx={px(hov)} cy={py(v)} r="0.85" fill={l.color} stroke="#0F172A" strokeWidth="0.3" />
            </g>
          );
        })}
      </svg>
      {hov !== null && (
        <div style={{ position:'absolute', left:`${(hov/Math.max(data.length-1,1))*100}%`, top:0,
          transform: hov>data.length*0.65?'translateX(-110%)':'translateX(6px)',
          background:'rgba(10,15,28,0.97)', backdropFilter:'blur(16px)',
          border:'1px solid rgba(139,92,246,0.35)', borderRadius:10,
          padding:'10px 14px', pointerEvents:'none', zIndex:30,
          boxShadow:'0 0 20px rgba(139,92,246,0.2),0 8px 32px rgba(0,0,0,0.6)', minWidth:110 }}>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--color-violet)',letterSpacing:'0.1em',marginBottom:6 }}>
            {data[hov]?.month||data[hov]?.label}
          </div>
          {lines.map(l => (
            <div key={l.key} style={{ display:'flex',justifyContent:'space-between',gap:14,marginBottom:3 }}>
              <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>{l.label}</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:l.color,fontWeight:700 }}>
                {typeof data[hov][l.key]==='number'&&data[hov][l.key]>200
                  ? formatCurrency(data[hov][l.key],'RWF') : `${data[hov][l.key]||0}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GLASS STAT CARD
   ══════════════════════════════════════════════════════════════════ */
function GlassStatCard({ icon, label, value, color, sub, trend, sparkData, animate = false }) {
  const numericVal = useMemo(() => {
    if (!animate) return null;
    const n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  }, [value, animate]);
  const counted = useCountUp(numericVal || 0, 1000);
  const displayVal = animate && numericVal !== null
    ? String(value).replace(/[\d.]+/, counted.toLocaleString())
    : value;

  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position:'relative', background: hov
        ? 'linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))'
        : 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))',
        backdropFilter:'blur(20px)',
        border: hov ? `1px solid ${color}65` : '1px solid rgba(255,255,255,0.08)',
        borderRadius:18, padding:'18px 20px', overflow:'hidden',
        transition:'all 0.3s ease', cursor:'default',
        boxShadow: hov
          ? `0 0 32px ${color}22,0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)`
          : '0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
      <div style={{ position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',
        background:`radial-gradient(circle,${color}25 0%,transparent 70%)`,
        opacity: hov ? 1 : 0.5, transition:'opacity 0.3s' }} />
      <div style={{ position:'absolute',top:0,left:'20%',right:'20%',height:1,
        background:`linear-gradient(90deg,transparent,${color}80,transparent)` }} />
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10 }}>
        <div style={{ width:38,height:38,borderRadius:12,
          background:`linear-gradient(135deg,${color}30,${color}15)`,
          border:`1px solid ${color}40`,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
          boxShadow:`0 0 12px ${color}30` }}>{icon}</div>
        {sparkData && <MiniSpark data={sparkData} color={color} />}
      </div>
      <div style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:22,color:'#F0F4FF',
        lineHeight:1,marginBottom:5,textShadow:`0 0 20px ${color}40` }}>{displayVal}</div>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'rgba(148,163,184,0.8)',
        letterSpacing:'0.12em',textTransform:'uppercase' }}>{label}</div>
      {trend !== undefined && (
        <div style={{ marginTop:7,fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,
          color:trend>0?'#22C55E':trend<0?'#EF4444':'#5A6B85' }}>
          {trend>0?'▲':trend<0?'▼':'—'} {Math.abs(trend)}% vs last month
        </div>
      )}
      {sub && <div style={{ marginTop:4,fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function MiniSpark({ data=[], color='#C9A84C', w=56, h=24 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v,i) => `${(i/Math.max(data.length-1,1))*w},${h-(v/max)*h}`).join(' ');
  const area = `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
  const id = color.replace(/[^a-z0-9]/gi,'');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={`ms-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#ms-${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GLASS PANEL
   ══════════════════════════════════════════════════════════════════ */
function GlassPanel({ children, color='var(--gold)', title, icon, accentRight, style={} }) {
  return (
    <div style={{ background:'linear-gradient(135deg,rgba(20,30,51,0.92),rgba(15,23,42,0.97))',
      backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:20, overflow:'hidden',
      boxShadow:'0 8px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.05)', ...style }}>
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${color}90 30%,${accentRight||'#8B5CF6'}80 70%,transparent)` }} />
      {title && (
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'16px 20px 0' }}>
          {icon && <span style={{ fontSize:14 }}>{icon}</span>}
          <span style={{ fontFamily:'var(--font-heading)',fontSize:11,fontWeight:700,color,
            letterSpacing:'0.12em',textTransform:'uppercase' }}>{title}</span>
        </div>
      )}
      <div style={{ padding: title ? '14px 20px 20px' : '20px' }}>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: CONTRIBUTION ACTIVITY HEATMAP  (GitHub-style 52-week)
   ══════════════════════════════════════════════════════════════════ */
function ContributionHeatmap({ contributions = [] }) {
  const today = new Date();
  const WEEKS = 26; // last 26 weeks
  const DAY_LABELS = ['S','M','T','W','T','F','S'];
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Build week × day grid
  const grid = useMemo(() => {
    const cellData = {};
    contributions.forEach(c => {
      if (!c.date) return;
      const key = c.date.slice(0, 10);
      cellData[key] = (cellData[key] || 0) + parseFloat(c.amount || 0);
    });

    const weeks = [];
    // Start from WEEKS weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - WEEKS * 7 - startDate.getDay());

    for (let w = 0; w < WEEKS; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const key = date.toISOString().slice(0, 10);
        days.push({ date: key, value: cellData[key] || 0, day: date.getDay(), month: date.getMonth() });
      }
      weeks.push(days);
    }
    return weeks;
  }, [contributions]);

  const maxVal = Math.max(...grid.flat().map(d => d.value), 1);
  const [tooltip, setTooltip] = useState(null);

  const cellColor = (val) => {
    if (val === 0) return 'rgba(30,45,74,0.8)';
    const intensity = val / maxVal;
    if (intensity < 0.25) return 'rgba(201,168,76,0.25)';
    if (intensity < 0.5)  return 'rgba(201,168,76,0.5)';
    if (intensity < 0.75) return 'rgba(201,168,76,0.75)';
    return '#C9A84C';
  };

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    grid.forEach((week, wi) => {
      const firstDay = week[1]; // use Monday to detect month changes
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({ week: wi, label: MONTH_LABELS[firstDay.month] });
        lastMonth = firstDay.month;
      }
    });
    return labels;
  }, [grid]);

  const CELL = 11, GAP = 3;

  return (
    <div style={{ overflowX:'auto', paddingBottom:4 }}>
      <div style={{ display:'flex', gap:0, position:'relative', minWidth: WEEKS * (CELL + GAP) + 40 }}>
        {/* Day labels */}
        <div style={{ display:'flex',flexDirection:'column',gap:GAP,marginRight:6,paddingTop:20 }}>
          {DAY_LABELS.map((l,i) => (
            <div key={i} style={{ height:CELL,display:'flex',alignItems:'center',
              fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',lineHeight:1 }}>
              {i%2===1?l:''}
            </div>
          ))}
        </div>

        <div>
          {/* Month labels */}
          <div style={{ display:'flex',height:18,position:'relative',marginBottom:2 }}>
            {monthLabels.map((ml,i) => (
              <div key={i} style={{ position:'absolute',
                left: ml.week * (CELL + GAP),
                fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>
                {ml.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:'flex',gap:GAP }}>
            {grid.map((week, wi) => (
              <div key={wi} style={{ display:'flex',flexDirection:'column',gap:GAP }}>
                {week.map((day, di) => (
                  <div key={di}
                    style={{ width:CELL,height:CELL,borderRadius:3,
                      background: cellColor(day.value),
                      cursor: day.value > 0 ? 'pointer' : 'default',
                      transition:'all 0.15s ease',
                      boxShadow: tooltip?.date===day.date
                        ? `0 0 8px rgba(201,168,76,0.8)` : 'none',
                    }}
                    onMouseEnter={() => day.value > 0 && setTooltip(day)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:10 }}>
        <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{ width:10,height:10,borderRadius:2, background:cellColor(v*maxVal) }} />
        ))}
        <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)' }}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ marginTop:8,padding:'8px 12px',background:'rgba(201,168,76,0.1)',
          border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,display:'inline-block' }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--gold)' }}>
            {tooltip.date}: {formatCurrency(tooltip.value,'RWF')}
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: FORECAST CHART  (linear regression + projection)
   ══════════════════════════════════════════════════════════════════ */
function ForecastChart({ historical = [], height = 200 }) {
  if (historical.length < 3) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height,
      fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-muted)' }}>
      Need at least 3 months of data to forecast
    </div>
  );

  // Linear regression
  const n = historical.length;
  const vals = historical.map(d => d.total || 0);
  const xs = vals.map((_, i) => i);
  const sumX = xs.reduce((a,b)=>a+b,0);
  const sumY = vals.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((s,x,i)=>s+x*vals[i],0);
  const sumXX = xs.reduce((s,x)=>s+x*x,0);
  const slope  = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const interc = (sumY - slope * sumX) / n;
  const forecast = [1, 2, 3].map(offset => Math.max(0, Math.round(slope * (n - 1 + offset) + interc)));

  const allVals = [...vals, ...forecast];
  const maxV = Math.max(...allVals, 1);
  const W = 100, H = 100;
  const PAD = { top:8, right:5, bottom:20, left:8 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const totalPoints = n + 3;
  const px = (i) => PAD.left + (i / (totalPoints - 1)) * cW;
  const py = (v) => PAD.top + cH - (v / maxV) * cH;

  // Historical path
  const histPath = vals.map((v,i) => `${i===0?'M':'L'}${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(' ');
  const histArea = `${histPath} L${px(n-1).toFixed(2)},${(PAD.top+cH).toFixed(2)} L${PAD.left},${(PAD.top+cH).toFixed(2)} Z`;

  // Forecast path (connecting from last historical point)
  const forecastPts = [vals[n-1], ...forecast].map((v,i) => [px(n-1+i), py(v)]);
  const forecastPath = forecastPts.map(([x,y],i) => `${i===0?'M':'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const forecastArea = `${forecastPath} L${px(n-1+3).toFixed(2)},${(PAD.top+cH).toFixed(2)} L${px(n-1).toFixed(2)},${(PAD.top+cH).toFixed(2)} Z`;

  // Trend line (full)
  const trendPath = [0, totalPoints-1].map((i) => `${i===0?'M':'L'}${px(i).toFixed(2)},${py(interc+slope*i).toFixed(2)}`).join(' ');

  // Next 3 month labels
  const now = new Date();
  const fLabels = [1,2,3].map(o => {
    const d = new Date(now.getFullYear(), now.getMonth()+o, 1);
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  });

  const svgRef = useRef(null);
  const [hov, setHov] = useState(null);

  return (
    <div>
      <div style={{ position:'relative', width:'100%', height }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          style={{ width:'100%',height:'100%',overflow:'visible' }}
          onMouseMove={e => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const relX = (e.clientX-rect.left)/rect.width*W;
            const idx = Math.round(((relX-PAD.left)/cW)*(totalPoints-1));
            setHov(Math.max(0,Math.min(totalPoints-1,idx)));
          }}
          onMouseLeave={() => setHov(null)}
        >
          <defs>
            <linearGradient id="fg-hist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="fg-fore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
            </linearGradient>
            <filter id="fc-glow">
              <feGaussianBlur stdDeviation="0.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid */}
          {[0,0.25,0.5,0.75,1].map((p,i) => (
            <line key={i} x1={PAD.left} y1={PAD.top+cH-p*cH} x2={W-PAD.right} y2={PAD.top+cH-p*cH}
              stroke="#1E2D4A" strokeWidth="0.25" strokeDasharray="1,1"/>
          ))}

          {/* Forecast divider */}
          <line x1={px(n-1)} y1={PAD.top} x2={px(n-1)} y2={PAD.top+cH}
            stroke="rgba(139,92,246,0.5)" strokeWidth="0.4" strokeDasharray="1,0.5"/>
          <text x={px(n-1)+0.5} y={PAD.top+3} fill="rgba(139,92,246,0.8)"
            style={{ fontSize:'2.4px',fontFamily:'DM Mono,monospace' }}>FORECAST ▶</text>

          {/* Shade forecast zone */}
          <rect x={px(n-1)} y={PAD.top} width={px(totalPoints-1)-px(n-1)} height={cH}
            fill="rgba(139,92,246,0.04)" />

          {/* Areas */}
          <path d={histArea}    fill="url(#fg-hist)" />
          <path d={forecastArea} fill="url(#fg-fore)" />

          {/* Trend line */}
          <path d={trendPath} fill="none" stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.4" strokeDasharray="1,1"/>

          {/* Historical line */}
          <path d={histPath} fill="none" stroke="#C9A84C" strokeWidth="0.7"
            strokeLinecap="round" strokeLinejoin="round" filter="url(#fc-glow)"/>

          {/* Forecast dashed line */}
          <path d={forecastPath} fill="none" stroke="#8B5CF6" strokeWidth="0.7"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="1.5,0.8" filter="url(#fc-glow)"/>

          {/* Historical dots */}
          {vals.map((v,i) => (
            <circle key={i} cx={px(i)} cy={py(v)} r="0.8"
              fill="#C9A84C" stroke="#0F172A" strokeWidth="0.25" opacity="0.7"/>
          ))}

          {/* Forecast dots */}
          {forecast.map((v,i) => (
            <circle key={i} cx={px(n+i)} cy={py(v)} r="1"
              fill="#8B5CF6" stroke="#0F172A" strokeWidth="0.3"
              style={{ filter:'drop-shadow(0 0 2px #8B5CF6)' }}/>
          ))}

          {/* X labels */}
          {historical.map((d,i) => (
            i % Math.ceil(n/6) === 0 ? (
              <text key={i} x={px(i)} y={H-1} textAnchor="middle" fill="#5A6B85"
                style={{ fontSize:'2.4px',fontFamily:'DM Mono,monospace' }}>
                {d.month?.slice(0,3)}
              </text>
            ) : null
          ))}
          {fLabels.map((l,i) => (
            <text key={i} x={px(n+i)} y={H-1} textAnchor="middle" fill="#8B5CF6"
              style={{ fontSize:'2.4px',fontFamily:'DM Mono,monospace' }}>{l}</text>
          ))}

          {/* Hover crosshair */}
          {hov !== null && (
            <line x1={px(hov)} y1={PAD.top} x2={px(hov)} y2={PAD.top+cH}
              stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" strokeDasharray="1,0.5"/>
          )}
        </svg>
      </div>

      {/* Forecast pills */}
      <div style={{ display:'flex',gap:10,marginTop:12,flexWrap:'wrap' }}>
        {forecast.map((v,i) => (
          <div key={i} style={{ background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.3)',
            borderRadius:10,padding:'8px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'rgba(139,92,246,0.8)',letterSpacing:'0.1em' }}>
              {fLabels[i].toUpperCase()} FORECAST
            </span>
            <span style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:900,color:'#8B5CF6' }}>
              {v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toLocaleString()}
            </span>
            <span style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)' }}>RWF</span>
          </div>
        ))}
        <div style={{ background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',
          borderRadius:10,padding:'8px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:2 }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'rgba(201,168,76,0.7)',letterSpacing:'0.1em' }}>
            TREND
          </span>
          <span style={{ fontFamily:'var(--font-heading)',fontSize:16,fontWeight:900,
            color: slope >= 0 ? '#22C55E' : '#EF4444' }}>
            {slope >= 0 ? '▲' : '▼'} {Math.abs(Math.round(slope)).toLocaleString()}
          </span>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)' }}>RWF/MO</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: VOICE SECTION RADAR CHART  (SVG spider/web)
   ══════════════════════════════════════════════════════════════════ */
function RadarChart({ data = [], size = 200 }) {
  // data: [{ label, values: {attendance, contribution, members} }]
  if (!data.length) return null;
  const cx = size/2, cy = size/2, r = size*0.36;
  const axes = ['Attendance','Contribution','Members','Consistency'];
  const N = axes.length;
  const angle = (i) => (i / N) * 2 * Math.PI - Math.PI / 2;

  const pt = (ax, val, radius = r) => {
    const a = angle(ax);
    return [cx + radius * Math.cos(a) * val, cy + radius * Math.sin(a) * val];
  };

  const [hov, setHov] = useState(null);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {data.map((d,i) => (
          <radialGradient key={i} id={`radar-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={d.color} stopOpacity="0.5"/>
            <stop offset="100%" stopColor={d.color} stopOpacity="0.1"/>
          </radialGradient>
        ))}
      </defs>

      {/* Web rings */}
      {[0.25,0.5,0.75,1].map((ring,ri) => {
        const pts = axes.map((_,ai) => pt(ai,ring).join(',')).join(' ');
        return <polygon key={ri} points={pts} fill="none"
          stroke={ring===1?'#243356':'#1E2D4A'} strokeWidth={ring===1?0.8:0.4}/>;
      })}

      {/* Axis lines + labels */}
      {axes.map((ax,ai) => {
        const [lx,ly] = pt(ai,1.22);
        const [x2,y2] = pt(ai,1);
        return (
          <g key={ai}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#1E2D4A" strokeWidth="0.6"/>
            <text x={lx} y={ly} textAnchor="middle" fill="#5A6B85"
              style={{ fontSize:`${size*0.046}px`,fontFamily:'DM Mono,monospace' }}>{ax}</text>
          </g>
        );
      })}

      {/* Data polygons */}
      {data.map((d,di) => {
        const vals = [
          d.attendance/100,
          d.contribution,
          d.members,
          d.consistency,
        ];
        const pts = vals.map((v,ai) => pt(ai, Math.min(v,1)).join(',')).join(' ');
        const isH = hov===di;
        return (
          <g key={di} style={{ cursor:'pointer' }}
            onMouseEnter={()=>setHov(di)} onMouseLeave={()=>setHov(null)}>
            <polygon points={pts}
              fill={`url(#radar-${di})`} opacity={isH?1:0.7}
              stroke={d.color} strokeWidth={isH?1:0.5}
              style={{ filter:isH?`drop-shadow(0 0 4px ${d.color})`:'none',transition:'all 0.2s' }}
            />
          </g>
        );
      })}

      {/* Center */}
      <circle cx={cx} cy={cy} r={size*0.06} fill="rgba(8,12,20,0.9)"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: MEMBER RETENTION FUNNEL
   ══════════════════════════════════════════════════════════════════ */
function RetentionFunnel({ data = [] }) {
  const max = data[0]?.value || 1;
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
      {data.map((stage,i) => {
        const width = (stage.value/max)*100;
        const prevWidth = i>0 ? (data[i-1].value/max)*100 : 100;
        const dropPct = i>0 ? Math.round(((data[i-1].value-stage.value)/data[i-1].value)*100) : 0;
        return (
          <div key={i}>
            {i>0 && dropPct>0 && (
              <div style={{ textAlign:'center',fontFamily:'var(--font-mono)',fontSize:9,
                color:'var(--color-error)',marginBottom:3 }}>
                ↓ {dropPct}% dropout
              </div>
            )}
            <div style={{ position:'relative',height:44,display:'flex',alignItems:'center',justifyContent:'center' }}>
              {/* Trapezoid shape */}
              <div style={{ position:'absolute',inset:0,display:'flex',justifyContent:'center' }}>
                <svg width="100%" height="44" viewBox="0 0 200 44" preserveAspectRatio="none">
                  <polygon
                    points={`${(100-prevWidth/2)},0 ${(100+prevWidth/2)},0 ${(100+width/2)},44 ${(100-width/2)},44`}
                    fill={stage.color} opacity="0.18"
                  />
                  <polygon
                    points={`${(100-prevWidth/2)},0 ${(100+prevWidth/2)},0 ${(100+width/2)},44 ${(100-width/2)},44`}
                    fill="none" stroke={stage.color} strokeWidth="0.5" opacity="0.5"
                  />
                </svg>
              </div>
              <div style={{ position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ fontSize:16 }}>{stage.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-primary)',fontWeight:600 }}>{stage.label}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:stage.color,fontWeight:700 }}>{stage.value} members</div>
                </div>
                <div style={{ fontFamily:'var(--font-heading)',fontSize:18,fontWeight:900,color:stage.color,
                  textShadow:`0 0 12px ${stage.color}50` }}>
                  {Math.round((stage.value/max)*100)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: SMART ALERTS PANEL
   ══════════════════════════════════════════════════════════════════ */
function SmartAlert({ type='info', title, detail, icon }) {
  const colors = { info:NEON.blue, warning:NEON.amber, success:NEON.green, danger:NEON.rose };
  const c = colors[type] || NEON.blue;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',
      background:`${c}0D`,border:`1px solid ${c}35`,
      borderLeft:`3px solid ${c}`,borderRadius:12,
      animation:'fadeUp 0.3s ease both' }}>
      <span style={{ fontSize:16,flexShrink:0,marginTop:1 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'var(--font-heading)',fontSize:12,fontWeight:700,color:c,marginBottom:3 }}>{title}</div>
        <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)',lineHeight:1.5 }}>{detail}</div>
      </div>
      <button onClick={()=>setDismissed(true)}
        style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:14,padding:2,flexShrink:0 }}>✕</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: PAYMENT METHOD DONUT  (mini version)
   ══════════════════════════════════════════════════════════════════ */
function PaymentBreakdown({ contributions = [] }) {
  const METHODS = {
    cash:          { label:'Cash',          color:'#C9A84C', icon:'💵' },
    mobile_money:  { label:'Mobile Money',  color:'#22C55E', icon:'📱' },
    bank_transfer: { label:'Bank Transfer', color:'#3B82F6', icon:'🏦' },
    cheque:        { label:'Cheque',        color:'#8B5CF6', icon:'📄' },
    online:        { label:'Online',        color:'#06B6D4', icon:'🌐' },
  };
  const totals = {};
  contributions.forEach(c => {
    const m = c.method || 'cash';
    totals[m] = (totals[m] || 0) + parseFloat(c.amount || 0);
  });
  const data = Object.entries(totals)
    .map(([id, val]) => ({ id, ...METHODS[id]||{label:id,color:'#94A3B8',icon:'◇'}, value: Math.round(val) }))
    .sort((a,b) => b.value - a.value);
  const grandTotal = data.reduce((s,d)=>s+d.value,0);

  return (
    <div>
      {data.map((d,i) => (
        <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:12 }}>
          <span style={{ fontSize:14,flexShrink:0 }}>{d.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>{d.label}</span>
              <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:d.color,fontWeight:700 }}>
                {grandTotal ? Math.round((d.value/grandTotal)*100) : 0}%
              </span>
            </div>
            <div style={{ height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${grandTotal?(d.value/grandTotal)*100:0}%`,
                background:`linear-gradient(90deg,${d.color}80,${d.color})`,borderRadius:3,
                boxShadow:`0 0 8px ${d.color}50`,transition:'width 1s ease' }}/>
            </div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)',marginTop:2 }}>
              {d.value >= 1000 ? `${(d.value/1000).toFixed(0)}K` : d.value} RWF
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: CONTRIBUTION STREAK TRACKER
   ══════════════════════════════════════════════════════════════════ */
function StreakLeaderboard({ contributions = [], members = [] }) {
  const streaks = useMemo(() => {
    const now = new Date();
    return members
      .filter(m => m.status === 'active')
      .map(m => {
        let streak = 0;
        let d = new Date(now.getFullYear(), now.getMonth(), 1);
        while (true) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const has = contributions.some(c => c.memberId===m.id && c.date?.startsWith(key));
          if (!has) break;
          streak++;
          d.setMonth(d.getMonth() - 1);
        }
        return {
          id: m.id,
          name: m.fullName,
          initials: m.fullName?.split(' ').map(w=>w[0]).join('').slice(0,2) || '?',
          voicePart: m.voicePart,
          streak,
        };
      })
      .filter(m => m.streak > 0)
      .sort((a,b) => b.streak - a.streak)
      .slice(0, 8);
  }, [contributions, members]);

  if (!streaks.length) return (
    <div style={{ fontFamily:'var(--font-body)',fontSize:13,color:'var(--text-muted)',padding:'12px 0' }}>
      No contribution streaks found yet.
    </div>
  );

  const maxStreak = streaks[0].streak;
  const FLAME_COLORS = ['#F59E0B','#EF4444','#EC4899','#8B5CF6','#3B82F6'];

  return (
    <div>
      {streaks.map((m,i) => (
        <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10,
          padding:'10px 12px',borderRadius:12,
          background: i===0 ? 'rgba(245,158,11,0.08)':'rgba(255,255,255,0.02)',
          border: i===0 ? '1px solid rgba(245,158,11,0.25)':'1px solid rgba(255,255,255,0.04)',
          transition:'all 0.2s ease' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';}}
          onMouseLeave={e=>{e.currentTarget.style.background=i===0?'rgba(245,158,11,0.08)':'rgba(255,255,255,0.02)';}}
        >
          <span style={{ fontSize:14,flexShrink:0 }}>
            {i===0?'🔥':i===1?'🔥':i===2?'✨':'⭐'}
          </span>
          <Avatar initials={m.initials} size={28} color={FLAME_COLORS[i%5]}/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,color:'var(--text-primary)',
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2 }}>{m.name}</div>
            <div style={{ height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${(m.streak/maxStreak)*100}%`,
                background:`linear-gradient(90deg,${FLAME_COLORS[i%5]}80,${FLAME_COLORS[i%5]})`,
                borderRadius:2,transition:'width 1s ease' }}/>
            </div>
          </div>
          <div style={{ textAlign:'right',flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-heading)',fontSize:17,fontWeight:900,color:FLAME_COLORS[i%5],
              textShadow:`0 0 10px ${FLAME_COLORS[i%5]}60` }}>
              {m.streak}
            </div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)',letterSpacing:'0.06em' }}>MONTHS</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ★ NEW: GAUGE RING  (attendance per section)
   ══════════════════════════════════════════════════════════════════ */
function GaugeRing({ label, value, color, icon, size=90 }) {
  const r = size*0.36, cx=size/2, cy=size/2;
  const circ = 2*Math.PI*r;
  const dash = Math.min(value/100,1)*circ;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start=0;
    const step=value/40;
    const t=setInterval(()=>{
      start+=step;
      if(start>=value){setDisplayed(value);clearInterval(t);}
      else setDisplayed(Math.floor(start));
    },20);
    return ()=>clearInterval(t);
  }, [value]);

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size*0.07}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter:`drop-shadow(0 0 4px ${color}80)`,transition:'stroke-dasharray 1s ease' }}/>
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

/* ══════════════════════════════════════════════════════════════════
   YoY BARS
   ══════════════════════════════════════════════════════════════════ */
function YoYBars({ data=[], height=180 }) {
  if (!data.length) return null;
  const allVals = data.flatMap(d=>[d.lastYear||0,d.thisYear||0]);
  const max = Math.max(...allVals, 1);
  const [hov, setHov] = useState(null);
  return (
    <div style={{ height,display:'flex',alignItems:'flex-end',gap:6,padding:'8px 0 20px' }}>
      {data.map((d,i) => (
        <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'flex-end',height:'100%',position:'relative',cursor:'pointer' }}
          onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
        >
          {hov===i && (
            <div style={{ position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',
              background:'rgba(14,20,36,0.97)',backdropFilter:'blur(12px)',
              border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,padding:'8px 12px',
              pointerEvents:'none',zIndex:10,whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--gold)',marginBottom:4 }}>{d.month}</div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'#3B82F6',marginBottom:2 }}>
                {new Date().getFullYear()-1}: {(d.lastYear||0)>=1000?`${((d.lastYear||0)/1000).toFixed(0)}K`:Math.round(d.lastYear||0)}
              </div>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--gold)' }}>
                {new Date().getFullYear()}: {(d.thisYear||0)>=1000?`${((d.thisYear||0)/1000).toFixed(0)}K`:Math.round(d.thisYear||0)}
              </div>
            </div>
          )}
          <div style={{ display:'flex',gap:2,alignItems:'flex-end',width:'100%',justifyContent:'center',height:'calc(100% - 20px)' }}>
            <div style={{ width:'42%',height:`${((d.lastYear||0)/max)*100}%`,minHeight:2,borderRadius:'3px 3px 0 0',
              background:'linear-gradient(180deg,#3B82F6,#1D4ED8)',opacity:hov===i?1:0.7,transition:'all 0.2s',
              boxShadow:hov===i?'0 0 8px #3B82F650':'none' }}/>
            <div style={{ width:'42%',height:`${((d.thisYear||0)/max)*100}%`,minHeight:2,borderRadius:'3px 3px 0 0',
              background:'linear-gradient(180deg,var(--gold),#A07820)',opacity:hov===i?1:0.7,transition:'all 0.2s',
              boxShadow:hov===i?'0 0 8px rgba(201,168,76,0.5)':'none' }}/>
          </div>
          <div style={{ fontFamily:'var(--font-mono)',fontSize:6.5,color:'var(--text-muted)',textAlign:'center',
            marginTop:4,position:'absolute',bottom:0 }}>{d.month?.slice(0,3)}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LEADERBOARD
   ══════════════════════════════════════════════════════════════════ */
function NeonLeaderboard({ data=[] }) {
  const max = data[0]?.amount || 1;
  const medals = ['🥇','🥈','🥉'];
  return (
    <div>
      {data.map((g,i) => (
        <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,
          background: i===0 ? 'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04))' : 'rgba(255,255,255,0.02)',
          border: i===0 ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
          marginBottom:8,transition:'all 0.2s ease' }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';}}
          onMouseLeave={e=>{e.currentTarget.style.background=i===0?'linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.04))':'rgba(255,255,255,0.02)';e.currentTarget.style.borderColor=i===0?'rgba(201,168,76,0.2)':'transparent';}}
        >
          <span style={{ fontSize:15,width:20,textAlign:'center',flexShrink:0 }}>
            {medals[i] || <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text-muted)' }}>{i+1}</span>}
          </span>
          <Avatar initials={g.name?.split(' ').map(w=>w[0]).join('').slice(0,2)||'?'} size={30} color={HOLO[i%HOLO.length]}/>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-body)',fontSize:12,fontWeight:600,color:'var(--text-primary)',
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3 }}>{g.name}</div>
            <div style={{ height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${(g.amount/max)*100}%`,
                background:`linear-gradient(90deg,${HOLO[i%HOLO.length]},${HOLO[(i+2)%HOLO.length]})`,
                borderRadius:2,boxShadow:`0 0 6px ${HOLO[i%HOLO.length]}60`,transition:'width 1s ease' }}/>
            </div>
          </div>
          <div style={{ textAlign:'right',flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:11,color:HOLO[i%HOLO.length],fontWeight:700 }}>
              {g.amount>=1000?`${(g.amount/1000).toFixed(0)}K`:String(Math.round(g.amount))}
            </div>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:7,color:'var(--text-muted)' }}>RWF</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ATTENDANCE MEMBER CARD
   ══════════════════════════════════════════════════════════════════ */
function AttendanceMemberCard({ m }) {
  const color = attendanceColor(m.rate);
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background: hov
        ? 'linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))'
        : 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))',
        backdropFilter:'blur(16px)',
        border:`1px solid ${m.atRisk?'rgba(239,68,68,0.25)':hov?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.06)'}`,
        borderRadius:16,padding:'12px 14px',transition:'all 0.25s ease',
        boxShadow:hov?`0 4px 20px rgba(0,0,0,0.3),0 0 0 1px ${color}20`:'0 2px 12px rgba(0,0,0,0.2)' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
        <Avatar initials={m.initials} size={32} color={m.color}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-primary)',fontWeight:600,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.name}</div>
          <div style={{ display:'flex',gap:4,marginTop:2 }}>
            <Badge color={m.color} size="xs">{m.voicePart}</Badge>
            {m.atRisk && <Badge color="var(--color-error)" size="xs">⚠ AT-RISK</Badge>}
          </div>
        </div>
        <div style={{ fontFamily:'var(--font-heading)',fontSize:20,fontWeight:900,color,
          lineHeight:1,flexShrink:0,textShadow:`0 0 16px ${color}60` }}>{m.rate}%</div>
      </div>
      <div style={{ height:4,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${m.rate}%`,
          background:`linear-gradient(90deg,${color}80,${color})`,borderRadius:3,
          boxShadow:`0 0 8px ${color}60`,transition:'width 0.8s ease' }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RADIAL VOICE CHART
   ══════════════════════════════════════════════════════════════════ */
function RadialVoiceChart({ data=[], size=200 }) {
  const [hov,setHov]=useState(null);
  const cx=size/2,cy=size/2;
  const total=data.reduce((s,d)=>s+d.value,0)||1;
  let angle=-Math.PI/2;
  const segments=data.map((d,i)=>{
    const ratio=d.value/total;
    const sweep=ratio*2*Math.PI;
    const r1=size*0.36,r2=size*0.25;
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
      <defs>
        {data.map((d,i)=>(
          <radialGradient key={i} id={`rv3-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={d.color} stopOpacity="1"/>
            <stop offset="100%" stopColor={d.color} stopOpacity="0.6"/>
          </radialGradient>
        ))}
      </defs>
      {segments.map((s,i)=>{
        const isH=hov===i;
        const r1=isH?size*0.39:size*0.36;
        const r2=isH?size*0.22:size*0.25;
        const a0=-Math.PI/2+segments.slice(0,i).reduce((sum,seg)=>sum+seg.sweep,0);
        const a1=a0+s.sweep;
        const x1o=cx+r1*Math.cos(a0),y1o=cy+r1*Math.sin(a0);
        const x1i=cx+r2*Math.cos(a0),y1i=cy+r2*Math.sin(a0);
        const x2o=cx+r1*Math.cos(a1),y2o=cy+r1*Math.sin(a1);
        const x2i=cx+r2*Math.cos(a1),y2i=cy+r2*Math.sin(a1);
        const large=s.sweep>Math.PI?1:0;
        const path=`M${x1i},${y1i} L${x1o},${y1o} A${r1},${r1} 0 ${large},1 ${x2o},${y2o} L${x2i},${y2i} A${r2},${r2} 0 ${large},0 ${x1i},${y1i} Z`;
        return (
          <g key={i} style={{ transition:'all 0.2s ease',cursor:'pointer' }}
            onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
            <path d={path} fill={`url(#rv3-${i})`} opacity={isH?1:0.8}
              style={{ filter:isH?`drop-shadow(0 0 6px ${s.color})`:'none',transition:'all 0.2s ease' }}/>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={size*0.22} fill="rgba(8,12,20,0.95)"/>
      {hov!==null?(
        <>
          <text x={cx} y={cy-6} textAnchor="middle" fill={data[hov]?.color}
            style={{ fontFamily:'var(--font-heading)',fontSize:size*0.075,fontWeight:700 }}>
            {Math.round((data[hov]?.ratio||0)*100)}%
          </text>
          <text x={cx} y={cy+9} textAnchor="middle" fill="var(--text-secondary)"
            style={{ fontFamily:'var(--font-body)',fontSize:size*0.055 }}>{data[hov]?.name}</text>
        </>
      ):(
        <>
          <text x={cx} y={cy-4} textAnchor="middle" fill="#F0F4FF"
            style={{ fontFamily:'var(--font-heading)',fontSize:size*0.09,fontWeight:700 }}>
            {data.reduce((s,d)=>s+d.value,0)}
          </text>
          <text x={cx} y={cy+10} textAnchor="middle" fill="var(--text-muted)"
            style={{ fontFamily:'var(--font-mono)',fontSize:size*0.048,letterSpacing:'0.06em' }}>MEMBERS</text>
        </>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [tab, setTab] = useState('financial');
  const [tick, setTick] = useState(0);

  // Force re-render on relevant real-time events
  useRealtimeSync([
    'member:created', 'member:updated', 'member:deleted',
    'contribution:created', 'contribution:deleted',
    'attendance:marked', 'event:created', 'event:updated'
  ], () => setTick(t => t + 1));

  const tabs = [
    { id:'financial',  label:'Financial',  icon:'💰' },
    { id:'attendance', label:'Attendance', icon:'✅' },
    { id:'members',    label:'Members',    icon:'👥' },
    { id:'insights',   label:'Insights',   icon:'💡' },
  ];

  const stats       = useMemo(() => getSummaryStats(),        [tick]);
  const contribType = useMemo(() => getContributionByType(),  [tick]);
  const topContribs = useMemo(() => getTopContributors(8),    [tick]);
  const yoyData     = useMemo(() => getYoYContributions(),    [tick]);
  const trend12     = useMemo(() => getContributionTrend(12), [tick]);
  const attend12    = useMemo(() => getAttendanceTrend(12),   [tick]);
  const voiceDist   = useMemo(() => getVoiceDistribution(),   [tick]);
  const memberRates = useMemo(() => getMemberAttendanceRates(),[tick]);
  const growth12    = useMemo(() => getMemberGrowth(12),      [tick]);

  const contributions = Storage.getList(KEYS.CONTRIBUTIONS);
  const members       = Storage.getList(KEYS.MEMBERS);

  const spark12    = trend12.map(r => r.total||(r.tithe+r.offering+r.special_gift+r.welfare_fund+r.other)||0);
  const attendSpark= attend12.map(r => r.overall||0);

  const monthlyTable = trend12.map(row => ({
    ...row,
    rowTotal: Math.round((row.tithe||0)+(row.offering||0)+(row.special_gift||0)+(row.welfare_fund||0)+(row.other||0)),
  }));

  // Smart alerts
  const alerts = useMemo(() => {
    const list = [];
    const n = trend12.length;
    if (n >= 2) {
      const prev = spark12[n-2], curr = spark12[n-1];
      const drop = prev > 0 ? Math.round(((prev-curr)/prev)*100) : 0;
      if (drop > 20) list.push({ type:'warning', icon:'📉', title:'Significant Income Drop',
        detail:`Last month's contributions dropped ${drop}% vs the previous month. Consider following up with members.` });
      if (drop < -20) list.push({ type:'success', icon:'📈', title:'Strong Growth This Month',
        detail:`Contributions grew by ${Math.abs(drop)}% vs last month. Great momentum to sustain!` });
    }
    const unverified = contributions.filter(c=>!c.verified).length;
    if (unverified > 5) list.push({ type:'warning', icon:'⏳', title:'Pending Verifications',
      detail:`${unverified} contributions still need verification. Head to the Finance page to verify them.` });
    const atRisk = memberRates.filter(m=>m.atRisk);
    if (atRisk.length > 0) list.push({ type:'danger', icon:'⚠️', title:`${atRisk.length} At-Risk Members`,
      detail:`Members below 70% attendance: ${atRisk.slice(0,3).map(m=>m.name.split(' ')[0]).join(', ')}${atRisk.length>3?' and more':''}. Consider pastoral follow-up.` });
    const avgAtt = attend12[attend12.length-1]?.overall || 0;
    if (avgAtt >= 85) list.push({ type:'success', icon:'🌟', title:'Excellent Attendance Rate',
      detail:`Current average attendance is ${avgAtt}%, above the 80% target. The choir is thriving!` });
    if (!list.length) list.push({ type:'info', icon:'✅', title:'All Systems Healthy',
      detail:'No critical issues detected. Keep up the great work!' });
    return list;
  }, [trend12, contributions, memberRates, attend12]);

  // Radar data for voice sections
  const radarData = useMemo(() => {
    const maxContrib = Math.max(...['Soprano','Alto','Tenor','Bass'].map(vp =>
      contributions.filter(c=>members.find(m=>m.id===c.memberId)?.voicePart===vp).reduce((s,c)=>s+parseFloat(c.amount||0),0)
    ),1);
    return ['Soprano','Alto','Tenor','Bass'].map((vp,i) => {
      const vpMembers = members.filter(m=>m.voicePart===vp&&m.status==='active');
      const vpContrib = contributions.filter(c=>vpMembers.some(m=>m.id===c.memberId)).reduce((s,c)=>s+parseFloat(c.amount||0),0);
      const avgAtt = vpMembers.length ? vpMembers.reduce((s,m)=>s+(m.attendance||0),0)/vpMembers.length : 0;
      const maxMembers = Math.max(...['Soprano','Alto','Tenor','Bass'].map(v=>members.filter(m=>m.voicePart===v&&m.status==='active').length),1);
      return {
        label:vp,
        color:[NEON.pink,NEON.purple,NEON.blue,NEON.green][i],
        attendance: avgAtt,
        contribution: vpContrib/maxContrib,
        members: vpMembers.length/maxMembers,
        consistency: Math.min(1,(vpContrib/maxContrib+avgAtt/100)/2),
      };
    });
  }, [contributions, members]);

  // Retention funnel
  const funnelData = useMemo(() => {
    const total     = members.length;
    const active    = members.filter(m=>m.status==='active').length;
    const contributed = new Set(contributions.map(c=>c.memberId)).size;
    const regularContrib = Object.entries(
      contributions.reduce((acc,c)=>{acc[c.memberId]=(acc[c.memberId]||0)+1;return acc;},{})
    ).filter(([,n])=>n>=3).length;
    const excellentAtt = members.filter(m=>(m.attendance||0)>=85).length;
    return [
      { label:'Registered',        value:total,          color:NEON.cyan,   icon:'📋' },
      { label:'Active',            value:active,         color:NEON.green,  icon:'✅' },
      { label:'Contributing',      value:contributed,    color:NEON.gold,   icon:'💰' },
      { label:'Regular Givers',    value:regularContrib, color:NEON.purple, icon:'🔄' },
      { label:'Excellent Attend.', value:excellentAtt,   color:NEON.pink,   icon:'🌟' },
    ];
  }, [members, contributions]);

  // Insights
  const avgMonthly    = spark12.length ? spark12.reduce((a,b)=>a+b,0)/spark12.length : 0;
  const bestMonthIdx  = spark12.indexOf(Math.max(...spark12));
  const sortedRates   = [...memberRates].sort((a,b)=>a.rate-b.rate);
  const worstAttendee = sortedRates[0];
  const bestAttendee  = sortedRates[sortedRates.length-1];

  // Section avg attendance
  const sectionAttendance = useMemo(() => {
    return ['Soprano','Alto','Tenor','Bass'].map((vp,i) => {
      const vpM = members.filter(m=>m.voicePart===vp&&m.status==='active');
      const avg = vpM.length ? Math.round(vpM.reduce((s,m)=>s+(m.attendance||0),0)/vpM.length) : 0;
      return { label:vp, value:avg, color:[NEON.pink,NEON.purple,NEON.blue,NEON.green][i],
        icon:['🎵','🎶','🎤','🎸'][i] };
    });
  }, [members]);

  return (
    <div style={{ animation:'fadeUp 0.4s ease both' }}>

      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive insights across finances, attendance, and membership"
        icon="📊"
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ═══════════════════ FINANCIAL TAB ═══════════════════ */}
      {tab === 'financial' && (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Glass KPI row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14 }}>
            <GlassStatCard icon="💰" label="All-Time Total"
              value={spark12.reduce((a,b)=>a+b,0)>=1000000?`${(spark12.reduce((a,b)=>a+b,0)/1000000).toFixed(1)}M`:spark12.reduce((a,b)=>a+b,0)>=1000?`${(spark12.reduce((a,b)=>a+b,0)/1000).toFixed(0)}K`:'0'}
              color={NEON.gold} sparkData={spark12} animate />
            <GlassStatCard icon="📅" label="This Month"
              value={spark12[spark12.length-1]>=1000?`${(spark12[spark12.length-1]/1000).toFixed(0)}K`:String(Math.round(spark12[spark12.length-1]||0))}
              color={NEON.green} trend={stats.contribGrowth} sparkData={spark12.slice(-6)} animate />
            <GlassStatCard icon="🏆" label="Top Contributor" value={topContribs[0]?.name?.split(' ')[0]||'—'} color={NEON.purple} />
            <GlassStatCard icon="📊" label="Total Records" value={String(contributions.length)} color={NEON.cyan} animate />
          </div>

          {/* Main holographic area chart */}
          <GlassPanel title="12-Month Revenue Trend" icon="📈" color="var(--gold)" accentRight="#06B6D4">
            <HoloAreaChart data={trend12} height={230}
              lines={[
                {key:'tithe',label:'Tithe',color:'#C9A84C',color2:'#E8C96A',color3:'#A07820'},
                {key:'offering',label:'Offering',color:'#3B82F6',color2:'#06B6D4',color3:'#1D4ED8'},
                {key:'special_gift',label:'Special Gift',color:'#8B5CF6',color2:'#EC4899',color3:'#6D28D9'},
                {key:'welfare_fund',label:'Welfare',color:'#22C55E',color2:'#10B981',color3:'#15803D'},
              ]}
            />
            <div style={{ display:'flex',flexWrap:'wrap',gap:16,marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {[{l:'Tithe',c:'#C9A84C'},{l:'Offering',c:'#3B82F6'},{l:'Special Gift',c:'#8B5CF6'},{l:'Welfare',c:'#22C55E'}].map(({l,c})=>(
                <div key={l} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:20,height:2,background:c,borderRadius:2,boxShadow:`0 0 6px ${c}` }}/>
                  <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>{l}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* ★ NEW: Forecast chart */}
          <GlassPanel title="3-Month Revenue Forecast" icon="🔮" color={NEON.purple} accentRight={NEON.blue}>
            <ForecastChart historical={trend12.map(r=>({...r,total:r.rowTotal||(r.tithe||0)+(r.offering||0)+(r.special_gift||0)+(r.welfare_fund||0)+(r.other||0)}))} height={190} />
          </GlassPanel>

          {/* ★ NEW: Activity heatmap */}
          <GlassPanel title="Contribution Activity Heatmap" icon="📅" color={NEON.gold} accentRight={NEON.cyan}>
            <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',marginBottom:12 }}>
              Daily contribution activity over the last 6 months — darker cells = higher amount
            </div>
            <ContributionHeatmap contributions={contributions} />
          </GlassPanel>

          {/* YoY + Type breakdown */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="Year-over-Year" icon="📆" color={NEON.blue} accentRight={NEON.gold}>
              <div style={{ display:'flex',gap:16,marginBottom:12 }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:16,height:3,background:'#3B82F6',borderRadius:2 }}/>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>{new Date().getFullYear()-1}</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:16,height:3,background:'var(--gold)',borderRadius:2 }}/>
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>{new Date().getFullYear()}</span>
                </div>
              </div>
              <YoYBars data={yoyData} height={160} />
            </GlassPanel>

            <GlassPanel title="By Contribution Type" icon="💎" color={NEON.purple}>
              {contribType.map(({name,value,color}) => {
                const max = contribType[0]?.value || 1;
                return (
                  <div key={name} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                      <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>{name}</span>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color,fontWeight:700 }}>
                        {value>=1000?`${(value/1000).toFixed(0)}K`:Math.round(value)} RWF
                      </span>
                    </div>
                    <div style={{ height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${(value/max)*100}%`,
                        background:`linear-gradient(90deg,${color}80,${color})`,borderRadius:3,
                        boxShadow:`0 0 8px ${color}50`,transition:'width 1s ease' }}/>
                    </div>
                  </div>
                );
              })}
            </GlassPanel>
          </div>

          {/* Top givers + ★ NEW: Payment method breakdown */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="Top Contributors" icon="🏆" color={NEON.gold} accentRight={NEON.purple}>
              <NeonLeaderboard data={topContribs.map(t=>({name:t.name,amount:t.total||t.amount||0}))} />
            </GlassPanel>
            <GlassPanel title="Payment Method Breakdown" icon="💳" color={NEON.cyan} accentRight={NEON.green}>
              <PaymentBreakdown contributions={contributions} />
            </GlassPanel>
          </div>

          {/* ★ NEW: Streak leaderboard + Monthly table */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="🔥 Contribution Streaks" icon="" color={NEON.amber} accentRight={NEON.rose}>
              <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',marginBottom:12 }}>
                Consecutive months with at least one contribution
              </div>
              <StreakLeaderboard contributions={contributions} members={members} />
            </GlassPanel>

            <GlassPanel title="Monthly Breakdown" icon="📋" color={NEON.cyan}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:360 }}>
                  <thead>
                    <tr>{['Month','Tithe','Offering','Special','Welfare','Total'].map(h=>(
                      <th key={h} style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',
                        letterSpacing:'0.1em',textTransform:'uppercase',textAlign:h==='Month'?'left':'right',
                        padding:'5px 7px',borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {monthlyTable.map((row,i)=>(
                      <tr key={row.month}
                        style={{ background:i%2===0?'transparent':'rgba(255,255,255,0.01)',transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,0.07)'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':'rgba(255,255,255,0.01)'}
                      >
                        {[
                          {v:row.month,c:'var(--text-primary)',bold:true,left:true},
                          {v:row.tithe,c:'#C9A84C'},
                          {v:row.offering,c:'#3B82F6'},
                          {v:row.special_gift,c:'#8B5CF6'},
                          {v:row.welfare_fund,c:'#EC4899'},
                          {v:row.rowTotal,c:'#22C55E',bold:true},
                        ].map((cell,ci)=>(
                          <td key={ci} style={{ fontFamily:ci===0?'var(--font-heading)':'var(--font-mono)',
                            fontSize:ci===0?11:10,color:cell.c,textAlign:cell.left?'left':'right',
                            padding:'7px 7px',borderBottom:'1px solid rgba(255,255,255,0.04)',
                            fontWeight:cell.bold?700:400 }}>
                            {ci===0?cell.v:cell.v?Math.round(cell.v).toLocaleString():'—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* ═══════════════════ ATTENDANCE TAB ═══════════════════ */}
      {tab === 'attendance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14 }}>
            <GlassStatCard icon="✅" label="Overall Average" value={`${stats.avgAttendance}%`} color={NEON.purple} sparkData={attendSpark} animate />
            <GlassStatCard icon="⚠️" label="At-Risk Members" value={String(stats.atRiskCount)} color={NEON.pink} />
            <GlassStatCard icon="🎯" label="Target Rate" value="80%" color={NEON.gold} />
            <GlassStatCard icon="📋" label="Total Records" value={String(stats.totalAttendanceRecords||0)} color={NEON.cyan} animate />
          </div>

          {/* ★ NEW: Section gauge rings */}
          <GlassPanel title="Section Attendance Gauges" icon="🎤" color={NEON.purple} accentRight={NEON.pink}>
            <div style={{ display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:20,padding:'10px 0' }}>
              {sectionAttendance.map(s => (
                <GaugeRing key={s.label} label={s.label} value={s.value} color={s.color} icon={s.icon} size={100} />
              ))}
            </div>
          </GlassPanel>

          {/* Neon line chart */}
          <GlassPanel title="12-Month Attendance Trend" icon="📈" color={NEON.purple} accentRight={NEON.pink}>
            <NeonLineChart data={attend12} height={220}
              lines={[
                {key:'overall',label:'Overall',color:'#8B5CF6'},
                {key:'Soprano',label:'Soprano',color:'#EC4899'},
                {key:'Alto',   label:'Alto',   color:'#06B6D4'},
                {key:'Tenor',  label:'Tenor',  color:'#C9A84C'},
                {key:'Bass',   label:'Bass',   color:'#22C55E'},
              ]}
            />
            <div style={{ display:'flex',flexWrap:'wrap',gap:14,marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {[{l:'Overall',c:'#8B5CF6'},{l:'Soprano',c:'#EC4899'},{l:'Alto',c:'#06B6D4'},{l:'Tenor',c:'#C9A84C'},{l:'Bass',c:'#22C55E'}].map(({l,c})=>(
                <div key={l} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:16,height:2,background:c,borderRadius:2,boxShadow:`0 0 6px ${c}` }}/>
                  <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-secondary)' }}>{l}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Member cards */}
          <GlassPanel title="Member Attendance Detail" icon="👤" color={NEON.cyan}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12 }}>
              {memberRates.map(m => <AttendanceMemberCard key={m.name} m={m} />)}
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ═══════════════════ MEMBERS TAB ═══════════════════ */}
      {tab === 'members' && (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14 }}>
            <GlassStatCard icon="👥" label="Total Members"    value={String(stats.totalMembers)}   color={NEON.gold} animate />
            <GlassStatCard icon="✅" label="Active"           value={String(stats.activeMembers)}  color={NEON.green} animate />
            <GlassStatCard icon="⏳" label="Pending Approval" value={String(stats.pendingMembers)} color={NEON.amber} />
            <GlassStatCard icon="🎤" label="Voice Sections"   value={String(voiceDist.length)}     color={NEON.cyan} />
          </div>

          {/* Growth + Voice pie */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="Member Growth" icon="📈" color={NEON.gold} accentRight={NEON.cyan}>
              <HoloAreaChart
                data={growth12.map(d=>({month:d.month||d.label,total:d.members||d.total||d.count||0}))}
                lines={[{key:'total',label:'Members',color:'#C9A84C',color2:'#06B6D4',color3:'#8B5CF6'}]}
                height={190}
              />
            </GlassPanel>
            <GlassPanel title="Voice Distribution" icon="🎤" color={NEON.pink} accentRight={NEON.purple}>
              <div style={{ display:'flex',alignItems:'center',gap:20,flexWrap:'wrap',justifyContent:'center' }}>
                <RadialVoiceChart data={voiceDist.map(v=>({name:v.name,value:v.value,color:v.color,ratio:v.percent/100}))} size={170} />
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {voiceDist.map(v=>(
                    <div key={v.name} style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:10,height:10,borderRadius:'50%',background:v.color,
                        boxShadow:`0 0 8px ${v.color}80`,flexShrink:0 }}/>
                      <div>
                        <div style={{ fontFamily:'var(--font-heading)',fontSize:12,color:'var(--text-primary)',fontWeight:700 }}>{v.name}</div>
                        <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>{v.value} · {v.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* ★ NEW: Retention funnel + Radar */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="Member Retention Funnel" icon="🔽" color={NEON.cyan} accentRight={NEON.green}>
              <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',marginBottom:14 }}>
                How many members progress through each engagement stage
              </div>
              <RetentionFunnel data={funnelData} />
            </GlassPanel>

            <GlassPanel title="Section Radar Analysis" icon="🕸️" color={NEON.purple} accentRight={NEON.pink}>
              <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',marginBottom:14 }}>
                Comparative view of each section's attendance, contributions, and members
              </div>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:16 }}>
                <RadarChart data={radarData} size={190} />
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {radarData.map(d=>(
                    <div key={d.label} style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:10,height:10,background:d.color,borderRadius:2,
                        boxShadow:`0 0 6px ${d.color}80` }}/>
                      <span style={{ fontFamily:'var(--font-body)',fontSize:12,color:'var(--text-secondary)' }}>{d.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:d.color,fontWeight:700 }}>
                        {Math.round(d.attendance)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* ═══════════════════ INSIGHTS TAB ═══════════════════ */}
      {tab === 'insights' && (
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* ★ NEW: Smart Alerts */}
          <GlassPanel title="Smart Alerts" icon="🔔" color={NEON.amber} accentRight={NEON.rose}>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {alerts.map((a,i) => <SmartAlert key={i} {...a} />)}
            </div>
          </GlassPanel>

          {/* Insight metric cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14 }}>
            {[
              { icon:'📈',title:'Avg Monthly Income',color:NEON.gold,badge:'FINANCIAL',
                value: avgMonthly>=1000?`${(avgMonthly/1000).toFixed(0)}K RWF`:`${Math.round(avgMonthly)} RWF`,
                detail:'Average collected per month over the last 12 months.' },
              { icon:'🏆',title:'Best Month',color:NEON.green,badge:'RECORD',
                value: trend12[bestMonthIdx]?.month||'—',
                detail:`Peak collection${spark12[bestMonthIdx]?` of ${Math.round(spark12[bestMonthIdx]/1000)}K RWF`:''}. Analyse what drove this.` },
              { icon:'⚠️',title:'Needs Follow-up',color:NEON.pink,badge:'ACTION',
                value: worstAttendee?.name?.split(' ')[0]||'—',
                detail:`${worstAttendee?.name||'—'} has ${worstAttendee?.rate||0}% attendance — consider a check-in.` },
              { icon:'🌟',title:'Most Faithful',color:NEON.purple,badge:'STAR',
                value: bestAttendee?.name?.split(' ')[0]||'—',
                detail:`${bestAttendee?.name||'—'} leads at ${bestAttendee?.rate||0}% attendance.` },
              { icon:'📊',title:'Unverified',color:NEON.cyan,badge:'ADMIN',
                value:`${contributions.filter(c=>!c.verified).length} pending`,
                detail:'Contributions awaiting verification for financial accuracy.' },
              { icon:'🔥',title:'Top Streak',color:NEON.amber,badge:'LOYALTY',
                value: (() => {
                  const s = [...members].filter(m=>m.status==='active').map(m=>{
                    const now=new Date();let streak=0;let d=new Date(now.getFullYear(),now.getMonth(),1);
                    while(true){const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                      if(!contributions.some(c=>c.memberId===m.id&&c.date?.startsWith(key)))break;
                      streak++;d.setMonth(d.getMonth()-1);}
                    return{name:m.fullName?.split(' ')[0],streak};
                  }).sort((a,b)=>b.streak-a.streak)[0];
                  return s?.streak>0?`${s.name}: ${s.streak}mo`:'—';
                })(),
                detail:'Longest consecutive months with at least one contribution.' },
            ].map((card,i) => (
              <div key={i} style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))',
                border:`1px solid ${card.color}30`,borderLeft:`3px solid ${card.color}`,borderRadius:16,
                padding:'16px 18px',transition:'all 0.2s ease' }}
                onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))';}}
                onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))';}}
              >
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                  <span style={{ fontSize:16 }}>{card.icon}</span>
                  <span style={{ fontFamily:'var(--font-body)',fontSize:11,fontWeight:600,color:'var(--text-secondary)',flex:1 }}>{card.title}</span>
                  <Badge color={card.color} size="xs">{card.badge}</Badge>
                </div>
                <div style={{ fontFamily:'var(--font-heading)',fontSize:18,fontWeight:900,color:card.color,lineHeight:1,marginBottom:5,
                  textShadow:`0 0 16px ${card.color}40` }}>{card.value}</div>
                <div style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--text-muted)',lineHeight:1.5 }}>{card.detail}</div>
              </div>
            ))}
          </div>

          {/* Combined overview + Streak board */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18 }}>
            <GlassPanel title="Combined Financial Overview" icon="🔍" color={NEON.gold} accentRight={NEON.blue}>
              <HoloAreaChart data={trend12} height={200}
                lines={[
                  {key:'tithe',label:'Tithe',color:'#C9A84C',color2:'#F59E0B'},
                  {key:'offering',label:'Offering',color:'#3B82F6',color2:'#06B6D4'},
                  {key:'welfare_fund',label:'Welfare',color:'#EC4899',color2:'#8B5CF6'},
                ]}
              />
            </GlassPanel>

            <GlassPanel title="🔥 Contribution Streaks" icon="" color={NEON.amber} accentRight={NEON.rose}>
              <StreakLeaderboard contributions={contributions} members={members} />
            </GlassPanel>
          </div>

          {/* Summary metrics */}
          <GlassPanel title="Key Metrics at a Glance" icon="🎯" color={NEON.cyan}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14 }}>
              {[
                {label:'Members Active',  val:stats.activeMembers,  total:stats.totalMembers,          color:NEON.green},
                {label:'Avg Attendance',  val:`${stats.avgAttendance}%`, total:null,                    color:NEON.purple},
                {label:'At-Risk Members', val:stats.atRiskCount,   total:stats.totalMembers,            color:NEON.pink},
                {label:'Verified Contribs',val:contributions.filter(c=>c.verified).length,total:contributions.length,color:NEON.gold},
              ].map(item=>(
                <div key={item.label} style={{ background:'rgba(255,255,255,0.03)',borderRadius:14,
                  padding:'14px 16px',border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:8,color:'var(--text-muted)',
                    letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8 }}>{item.label}</div>
                  <div style={{ fontFamily:'var(--font-heading)',fontSize:22,fontWeight:900,color:item.color,marginBottom:5 }}>{item.val}</div>
                  {item.total!==null&&(
                    <>
                      <div style={{ height:4,borderRadius:3,background:'rgba(255,255,255,0.06)',marginBottom:4,overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${((parseFloat(item.val)||0)/item.total)*100}%`,
                          background:`linear-gradient(90deg,${item.color}80,${item.color})`,borderRadius:3,transition:'width 1s ease' }}/>
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text-muted)' }}>of {item.total} total</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
