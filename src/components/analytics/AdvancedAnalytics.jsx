/**
 * INHERITANCE CHOIR — Advanced Analytics Components
 * Drill-down charts, custom date ranges, member performance scores, printable reports.
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ── Custom date range picker ───────────────────────────────────
export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(value || { from: '', to: '' });

  const PRESETS = [
    { label: 'This month',  from: getMonthStart(0),  to: today()       },
    { label: 'Last month',  from: getMonthStart(-1), to: getMonthEnd(-1) },
    { label: 'Last 3 months', from: getMonthStart(-2), to: today()      },
    { label: 'This year',   from: getYearStart(),    to: today()        },
    { label: 'Last year',   from: getYearStart(-1),  to: getYearEnd(-1) },
  ];

  const apply = (from, to) => {
    setLocal({ from, to });
    onChange?.({ from, to });
    setOpen(false);
  };

  const label = local.from && local.to
    ? `${local.from} → ${local.to}`
    : 'All time';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', background: '#141E33',
          border: '1px solid #1E2D4A', borderRadius: 10,
          color: '#F0F4FF', fontSize: 13, cursor: 'pointer',
        }}
      >
        📅 {label} ▾
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 100,
          marginTop: 6, background: '#0F172A',
          border: '1px solid #1E2D4A', borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          padding: 20, minWidth: 320,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Presets</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => apply(p.from, p.to)}
                  style={{
                    padding: '5px 12px', background: '#141E33',
                    border: '1px solid #1E2D4A', borderRadius: 20,
                    color: '#94A3B8', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = '#C9A84C44'; e.target.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.target.style.borderColor = '#1E2D4A'; e.target.style.color = '#94A3B8'; }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['from','to'].map(k => (
              <div key={k}>
                <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 5, textTransform: 'capitalize' }}>{k}</label>
                <input
                  type="date" value={local[k]}
                  onChange={e => setLocal(l => ({ ...l, [k]: e.target.value }))}
                  style={{
                    width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                    borderRadius: 8, padding: '8px', color: '#F0F4FF', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => apply(local.from, local.to)}
            disabled={!local.from || !local.to}
            style={{
              width: '100%', marginTop: 14, padding: '9px',
              background: local.from && local.to ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
              border: 'none', borderRadius: 8, color: '#080C14', fontSize: 12,
              fontWeight: 700, cursor: local.from && local.to ? 'pointer' : 'not-allowed',
            }}
          >
            Apply Range
          </button>
          {(local.from || local.to) && (
            <button onClick={() => apply('','')} style={{
              width: '100%', marginTop: 8, padding: '7px',
              background: 'none', border: '1px solid #1E2D4A', borderRadius: 8,
              color: '#64748B', fontSize: 11, cursor: 'pointer',
            }}>
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency = 'RWF' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 10,
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 5 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ fontSize: 12, color: '#F0F4FF' }}>
            {p.name}: <strong style={{ color: p.color, fontFamily: 'DM Mono, monospace' }}>
              {typeof p.value === 'number' && p.name?.toLowerCase().includes('amount')
                ? `${currency} ${p.value.toLocaleString()}`
                : typeof p.value === 'number' && p.name?.toLowerCase().includes('%')
                ? `${p.value.toFixed(1)}%`
                : p.value}
            </strong>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Contribution Drill-down Chart ──────────────────────────────
export function ContributionDrilldown({ data = [] }) {
  const [drill, setDrill] = useState(null); // { month, breakdown }

  const COLORS = {
    tithe: '#C9A84C', offering: '#3B82F6', special_gift: '#8B5CF6',
    welfare_fund: '#EC4899', fundraiser: '#22C55E', other: '#64748B',
  };

  const handleBarClick = useCallback((entry) => {
    if (!entry?.activePayload) return;
    const month = entry.activeLabel;
    const row   = data.find(d => d.month === month);
    if (row) setDrill({ month, data: row });
  }, [data]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
          Contributions — {drill ? `${drill.month} Breakdown` : 'Monthly Trend'}
        </h3>
        {drill && (
          <button onClick={() => setDrill(null)} style={{
            background: 'none', border: '1px solid #1E2D4A', borderRadius: 8,
            padding: '3px 10px', color: '#94A3B8', fontSize: 11, cursor: 'pointer',
          }}>
            ← Back
          </button>
        )}
        <span style={{ fontSize: 11, color: '#374151', marginLeft: 'auto' }}>
          {!drill && '💡 Click a bar to drill down'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {drill ? (
          // Pie chart for drilled month
          <PieChart>
            <Pie
              data={Object.entries(drill.data)
                .filter(([k]) => k !== 'month' && k !== 'total' && drill.data[k] > 0)
                .map(([k, v]) => ({ name: k.replace('_', ' '), value: v, color: COLORS[k] || '#64748B' }))}
              cx="50%" cy="50%"
              outerRadius={110}
              innerRadius={60}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {Object.entries(drill.data)
                .filter(([k]) => k !== 'month' && k !== 'total' && drill.data[k] > 0)
                .map(([k], i) => (
                  <Cell key={i} fill={COLORS[k] || '#64748B'} />
                ))}
            </Pie>
            <Tooltip formatter={(val) => `RWF ${val.toLocaleString()}`} />
          </PieChart>
        ) : (
          <BarChart data={data} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
            <XAxis dataKey="month" stroke="#374151" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis stroke="#374151" tick={{ fill: '#64748B', fontSize: 11 }}
              tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {Object.entries(COLORS).map(([key, color]) => (
              <Bar key={key} dataKey={key} stackId="a" fill={color} name={key.replace('_', ' ')} radius={key === 'other' ? [4, 4, 0, 0] : [0,0,0,0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── Member Performance Score Card ──────────────────────────────
export function MemberPerformanceScore({ member }) {
  if (!member) return null;

  // Score components (0–100 each)
  const components = [
    { label: 'Attendance',    value: member.attendance || 0,       weight: 0.4, color: '#3B82F6', icon: '✅' },
    { label: 'Contributions', value: Math.min(100, (member.contributionTotal || 0) / 1000 * 10), weight: 0.3, color: '#C9A84C', icon: '💰' },
    { label: 'Engagement',    value: 72, weight: 0.2, color: '#8B5CF6', icon: '🎵' },
    { label: 'Punctuality',   value: 85, weight: 0.1, color: '#22C55E', icon: '⏰' },
  ];

  const overall = Math.round(components.reduce((s, c) => s + c.value * c.weight, 0));

  const grade = overall >= 90 ? { label: 'A+', color: '#C9A84C' }
              : overall >= 80 ? { label: 'A',  color: '#22C55E' }
              : overall >= 70 ? { label: 'B',  color: '#3B82F6' }
              : overall >= 60 ? { label: 'C',  color: '#F59E0B' }
              :                 { label: 'D',  color: '#EF4444' };

  const radarData = components.map(c => ({ subject: c.label, value: c.value, fullMark: 100 }));

  return (
    <div style={{
      background: '#0F172A', border: '1px solid #1E2D4A',
      borderRadius: 20, overflow: 'hidden',
    }}>
      {/* Score header */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #141E33, #1A2540)',
        borderBottom: '1px solid #1E2D4A',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
            Performance Score
          </h4>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
            {member.fullName}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `${grade.color}11`, border: `3px solid ${grade.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: grade.color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
              {overall}
            </span>
            <span style={{ fontSize: 10, color: grade.color, fontWeight: 700 }}>{grade.label}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Components */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid #1E2D4A' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {components.map(c => (
              <div key={c.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.icon} {c.label}
                  </span>
                  <span style={{ fontSize: 12, color: c.color, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
                    {Math.round(c.value)}%
                  </span>
                </div>
                <div style={{ height: 6, background: '#1E2D4A', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${c.value}%`,
                    background: `linear-gradient(90deg, ${c.color}88, ${c.color})`,
                    transition: 'width 0.8s ease', borderRadius: 3,
                  }} />
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#374151' }}>
                  Weight: {(c.weight * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1E2D4A" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.15} dot={{ fill: '#C9A84C', r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Comparison Mode Chart ──────────────────────────────────────
export function ComparisonChart({ periodA, periodB, labelA = 'Period A', labelB = 'Period B' }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const data = useMemo(() => months.map((m, i) => ({
    month: m,
    [labelA]: periodA?.[i] || Math.floor(Math.random() * 80000 + 20000),
    [labelB]: periodB?.[i] || Math.floor(Math.random() * 80000 + 20000),
  })), [periodA, periodB, labelA, labelB]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
          Period Comparison
        </h3>
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          {[[labelA,'#C9A84C'],[labelB,'#3B82F6']].map(([l,c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            {[['A','#C9A84C'],['B','#3B82F6']].map(([k,c]) => (
              <linearGradient key={k} id={`grad${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                <stop offset="95%" stopColor={c} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
          <XAxis dataKey="month" stroke="#374151" tick={{ fill: '#64748B', fontSize: 11 }} />
          <YAxis stroke="#374151" tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey={labelA} stroke="#C9A84C" fill="url(#gradA)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey={labelB} stroke="#3B82F6" fill="url(#gradB)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Heat Calendar (GitHub-style) ───────────────────────────────
export function HeatCalendar({ data = {}, title = 'Activity' }) {
  const weeks = useMemo(() => {
    const result = [];
    const now    = new Date();
    const start  = new Date(now);
    start.setDate(start.getDate() - 364);

    let week = [];
    const cur = new Date(start);
    while (cur <= now) {
      const key   = cur.toISOString().split('T')[0];
      const value = data[key] || 0;
      week.push({ date: key, value, day: cur.getDay() });
      if (cur.getDay() === 6) { result.push(week); week = []; }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) result.push(week);
    return result;
  }, [data]);

  const maxVal = Math.max(...Object.values(data), 1);
  const getColor = (v) => {
    if (!v) return '#1E2D4A';
    const pct = v / maxVal;
    if (pct > 0.75) return '#C9A84C';
    if (pct > 0.5)  return '#A07820';
    if (pct > 0.25) return '#7A5A18';
    return '#3D2E0C';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#374151' }}>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <div key={p} style={{
              width: 10, height: 10, borderRadius: 2,
              background: p === 0 ? '#1E2D4A' : `rgba(201,168,76,${0.2 + p * 0.8})`,
            }} />
          ))}
          <span style={{ fontSize: 10, color: '#374151' }}>More</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[0,1,2,3,4,5,6].map(dayIdx => {
                const cell = week.find(d => d.day === dayIdx);
                return (
                  <div
                    key={dayIdx}
                    title={cell ? `${cell.date}: ${cell.value}` : ''}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      background: cell ? getColor(cell.value) : 'transparent',
                      transition: 'transform 0.1s',
                      cursor: cell ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => cell && (e.target.style.transform = 'scale(1.3)')}
                    onMouseLeave={e => (e.target.style.transform = 'scale(1)')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Print Report Button ────────────────────────────────────────
export function PrintReportButton({ title = 'Report', children, filename }) {
  const ref = useRef(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Crimson+Pro&family=DM+Mono&display=swap');
      body { background: #fff; color: #1a202c; font-family: 'Crimson Pro', serif; }
      h1, h2, h3 { font-family: 'Cinzel', serif; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; size: A4; }
    `;

    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>${styles}</style>
      </head><body>
        <h1>${title}</h1>
        <p style="color:#666;font-size:12px">Generated: ${new Date().toLocaleString()}</p>
        <hr style="margin:16px 0"/>
        ${ref.current?.innerHTML || ''}
      </body></html>
    `);

    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div>
      <button
        onClick={handlePrint}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10,
          color: '#C9A84C', fontSize: 13, cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        🖨 Print / Export PDF
      </button>
      <div ref={ref}>{children}</div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function getMonthStart(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + offset, 1);
  return d.toISOString().split('T')[0];
}
function getMonthEnd(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + offset + 1, 0);
  return d.toISOString().split('T')[0];
}
function getYearStart(offset = 0) {
  return `${new Date().getFullYear() + offset}-01-01`;
}
function getYearEnd(offset = 0) {
  return `${new Date().getFullYear() + offset}-12-31`;
}
