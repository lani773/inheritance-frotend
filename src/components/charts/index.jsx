/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Chart Components  (Task 3)
   Recharts wrappers with luxury dark-gold theme.
   All charts are responsive (ResponsiveContainer) and animated.

   Usage:
     import { ContributionBarChart, AttendanceLineChart,
              VoicePieChart, MemberBarChart, MiniSparkline } from '../components/charts';
   ═══════════════════════════════════════════════════════════════════ */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  Sparklines, SparklinesCurve,
} from 'recharts';

/* ── Shared theme tokens ─────────────────────────────────────── */
const THEME = {
  grid:        '#1E2D4A',
  axis:        '#5A6B85',
  tooltip_bg:  '#141E33',
  tooltip_border: '#243356',
  legend_text: '#94A3B8',
  text:        '#F0F4FF',
  gold:        '#C9A84C',
  goldAlpha:   'rgba(201,168,76,0.15)',
};

/* ── Shared tooltip style ────────────────────────────────────── */
const tooltipStyle = {
  contentStyle: {
    background: THEME.tooltip_bg,
    border: `1px solid ${THEME.tooltip_border}`,
    borderRadius: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: THEME.text,
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    padding: '10px 14px',
  },
  labelStyle: {
    color: THEME.gold,
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.05em',
    marginBottom: 4,
  },
  itemStyle: { color: THEME.text },
};

/* ── Chart section wrapper ───────────────────────────────────── */
export function ChartCard({ title, subtitle, children, action, accentColor = 'var(--gold)', height = 280, style = {} }) {
  return (
    <div style={{
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      overflow:     'hidden',
      ...style,
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${accentColor},transparent)` }} />
      <div style={{ padding: '18px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: 11,
              color: accentColor, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 700,
            }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                {subtitle}
              </div>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
        <div style={{ height }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   1. CONTRIBUTION STACKED BAR CHART (12 months)
   ════════════════════════════════════════════════════════════════ */
export function ContributionBarChart({ data, height = 260 }) {
  const BARS = [
    { key: 'tithe',        color: '#C9A84C', label: 'Tithe'        },
    { key: 'offering',     color: '#3B82F6', label: 'Offering'     },
    { key: 'special_gift', color: '#8B5CF6', label: 'Special Gift' },
    { key: 'welfare_fund', color: '#EC4899', label: 'Welfare Fund' },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [`RWF ${value.toLocaleString()}`, name]}
          cursor={{ fill: THEME.goldAlpha }}
        />
        <Legend
          wrapperStyle={{ fontFamily: "'DM Mono', monospace", fontSize: 9, paddingTop: 10 }}
          iconType="circle" iconSize={6}
        />
        {BARS.map(b => (
          <Bar key={b.key} dataKey={b.key} name={b.label} stackId="a" fill={b.color} radius={b.key === 'welfare_fund' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. ATTENDANCE TREND LINE CHART (multi-line, 12 months)
   ════════════════════════════════════════════════════════════════ */
export function AttendanceLineChart({ data, height = 260, showVoiceParts = true }) {
  const LINES = [
    { key: 'overall',  color: '#C9A84C', label: 'Overall',  width: 3, dashed: false },
    ...(showVoiceParts ? [
      { key: 'Soprano', color: '#EC4899', label: 'Soprano', width: 1.5, dashed: true },
      { key: 'Alto',    color: '#8B5CF6', label: 'Alto',    width: 1.5, dashed: true },
      { key: 'Tenor',   color: '#3B82F6', label: 'Tenor',   width: 1.5, dashed: true },
      { key: 'Bass',    color: '#10B981', label: 'Bass',     width: 1.5, dashed: true },
    ] : []),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [`${value}%`, name]}
        />
        <Legend
          wrapperStyle={{ fontFamily: "'DM Mono', monospace", fontSize: 9, paddingTop: 10 }}
          iconType="circle" iconSize={6}
        />
        {/* Goal reference line at 80% */}
        <Line
          dataKey={() => 80}
          stroke="#F59E0B" strokeWidth={1} strokeDasharray="6 4"
          dot={false} name="Target (80%)" legendType="none"
        />
        {LINES.map(l => (
          <Line
            key={l.key}
            dataKey={l.key}
            name={l.label}
            stroke={l.color}
            strokeWidth={l.width}
            strokeDasharray={l.dashed ? '5 3' : '0'}
            dot={!l.dashed ? { r: 3, fill: l.color } : false}
            activeDot={{ r: 5, fill: l.color, stroke: THEME.tooltip_bg }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. VOICE DISTRIBUTION PIE / DONUT CHART
   ════════════════════════════════════════════════════════════════ */
export function VoicePieChart({ data, height = 260 }) {
  const [active, setActive] = useState(null);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.08) return null;
    return (
      <text x={x} y={y} fill={THEME.axis} textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: 9, fontFamily: "'DM Mono', monospace" }}>
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          innerRadius="45%" outerRadius="70%"
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
          onMouseEnter={(_, i) => setActive(i)}
          onMouseLeave={() => setActive(null)}
          animationBegin={200}
          animationDuration={800}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color}
              opacity={active === null || active === i ? 1 : 0.5}
              stroke={active === i ? '#fff' : 'transparent'}
              strokeWidth={active === i ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [value, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. TOP CONTRIBUTORS HORIZONTAL BAR CHART
   ════════════════════════════════════════════════════════════════ */
export function TopContributorsChart({ data, height = 260 }) {
  // Recharts horizontal bar: layout="vertical"
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
        />
        <YAxis
          type="category" dataKey="name" width={90}
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v.length > 12 ? v.split(' ')[0] : v}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [`RWF ${value.toLocaleString()}`, 'Total']}
          cursor={{ fill: THEME.goldAlpha }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. YEAR-OVER-YEAR GROUPED BAR CHART
   ════════════════════════════════════════════════════════════════ */
export function YoYBarChart({ data, height = 240 }) {
  const now = new Date();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="30%" barGap={2}>
        <CartesianGrid vertical={false} stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [`RWF ${value.toLocaleString()}`, '']}
          cursor={{ fill: THEME.goldAlpha }}
        />
        <Legend wrapperStyle={{ fontFamily: "'DM Mono', monospace", fontSize: 9, paddingTop: 10 }} iconType="circle" iconSize={6} />
        <Bar dataKey="lastYear" name={String(now.getFullYear() - 1)} fill="#243356" radius={[2, 2, 0, 0]} />
        <Bar dataKey="thisYear" name={String(now.getFullYear())}     fill="#C9A84C" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   6. MEMBER GROWTH AREA CHART
   ════════════════════════════════════════════════════════════════ */
export function MemberGrowthChart({ data, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }}
          axisLine={false} tickLine={false}
        />
        <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Members']} />
        <Area
          type="monotone" dataKey="members"
          stroke="#C9A84C" strokeWidth={2}
          fill="url(#memberGradient)"
          dot={{ r: 3, fill: '#C9A84C', stroke: THEME.tooltip_bg }}
          activeDot={{ r: 5, fill: '#C9A84C' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════════════════════════════════════════════════
   7. MINI SPARKLINE (for KPI cards — inline tiny chart)
   ════════════════════════════════════════════════════════════════ */
export function MiniSparkline({ data, color = '#C9A84C', height = 36, width = 80 }) {
  if (!data || data.length < 2) return null;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {(() => {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const pts = data.map((v, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - ((v - min) / range) * (height - 4) - 2;
          return `${x},${y}`;
        });
        const fill = [...pts, `${width},${height}`, `0,${height}`].join(' ');
        return (
          <>
            <polygon points={fill} fill={`url(#spark-${color.replace('#','')})`} />
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            {/* Last data point dot */}
            {(() => {
              const [lx, ly] = pts[pts.length - 1].split(',').map(Number);
              return <circle cx={lx} cy={ly} r={2.5} fill={color} />;
            })()}
          </>
        );
      })()}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   8. ATTENDANCE VOICE PART COMPARISON (grouped bar)
   ════════════════════════════════════════════════════════════════ */
export function VoiceAttendanceChart({ data, height = 220 }) {
  const VOICE_COLORS = { Soprano:'#EC4899', Alto:'#8B5CF6', Tenor:'#3B82F6', Bass:'#10B981' };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barCategoryGap="30%" barGap={2}>
        <CartesianGrid vertical={false} stroke={THEME.grid} strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0,100]} tick={{ fill: THEME.axis, fontSize: 9, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}%`, n]} cursor={{ fill: THEME.goldAlpha }} />
        <Legend wrapperStyle={{ fontFamily: "'DM Mono', monospace", fontSize: 9, paddingTop: 10 }} iconType="circle" iconSize={6} />
        {Object.entries(VOICE_COLORS).map(([vp, color]) => (
          <Bar key={vp} dataKey={vp} name={vp} fill={color} radius={[2,2,0,0]} maxBarSize={14} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
