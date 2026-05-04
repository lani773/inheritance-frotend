/**
 * INHERITANCE CHOIR — Predictive Analytics Engine
 * ML-inspired forecasting: contribution trends, attendance risk,
 * growth projections, anomaly detection, choir health score.
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot,
} from 'recharts';

// ── Simple linear regression ───────────────────────────────────
function linearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope:0, intercept:data[0]?.y||0 };
  const sumX  = data.reduce((s,d) => s + d.x, 0);
  const sumY  = data.reduce((s,d) => s + d.y, 0);
  const sumXY = data.reduce((s,d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s,d) => s + d.x * d.x, 0);
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predict(regression, x) {
  return regression.slope * x + regression.intercept;
}

// ── Mock data generators ───────────────────────────────────────
function generateMonthlyData(months = 12) {
  const data = [];
  let base = 450000;
  for (let i = 0; i < months; i++) {
    base += (Math.random() - 0.3) * 40000;
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    data.push({
      month: d.toLocaleDateString('en-US', { month:'short', year:'2-digit' }),
      actual: Math.round(base),
      x: i,
    });
  }
  return data;
}

function generateAttendanceData(months = 12) {
  const data = [];
  let base = 78;
  for (let i = 0; i < months; i++) {
    base += (Math.random() - 0.45) * 5;
    base = Math.max(55, Math.min(98, base));
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i));
    data.push({
      month: d.toLocaleDateString('en-US', { month:'short', year:'2-digit' }),
      rate: Math.round(base * 10) / 10,
      x: i,
    });
  }
  return data;
}

// ── Forecast generator ─────────────────────────────────────────
function buildForecast(historicalData, valueKey, forecastMonths = 3) {
  const regData = historicalData.map((d, i) => ({ x: i, y: d[valueKey] }));
  const reg = linearRegression(regData);

  const n = historicalData.length;
  const forecast = [];
  for (let i = 1; i <= forecastMonths; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const predicted = predict(reg, n - 1 + i);
    // Add confidence band (±10% widening)
    const band = predicted * (0.06 + i * 0.02);
    forecast.push({
      month: d.toLocaleDateString('en-US', { month:'short', year:'2-digit' }),
      predicted: Math.round(predicted),
      upper: Math.round(predicted + band),
      lower: Math.round(Math.max(0, predicted - band)),
      isForecast: true,
      x: n - 1 + i,
    });
  }
  return { reg, forecast };
}

// ── Anomaly detector ───────────────────────────────────────────
function detectAnomalies(data, valueKey) {
  const values = data.map(d => d[valueKey]);
  const mean   = values.reduce((s,v) => s+v, 0) / values.length;
  const std    = Math.sqrt(values.reduce((s,v) => s + Math.pow(v-mean,2), 0) / values.length);
  return data
    .map((d, i) => ({ ...d, zscore: (d[valueKey] - mean) / std, index: i }))
    .filter(d => Math.abs(d.zscore) > 1.8);
}

// ── Choir Health Score ─────────────────────────────────────────
function choirHealthScore(contribData, attendData) {
  const lastContrib  = contribData.at(-1)?.actual || 0;
  const prevContrib  = contribData.at(-2)?.actual || lastContrib;
  const contribGrowth = ((lastContrib - prevContrib) / prevContrib) * 100;
  const avgAttend    = attendData.slice(-3).reduce((s,d) => s+d.rate, 0) / 3;

  const contribScore = Math.min(100, 50 + contribGrowth * 2);
  const attendScore  = avgAttend;
  const overall      = Math.round(contribScore * 0.45 + attendScore * 0.55);

  return {
    overall,
    contribScore: Math.round(contribScore),
    attendScore: Math.round(attendScore),
    grade: overall >= 85 ? 'A' : overall >= 75 ? 'B' : overall >= 65 ? 'C' : 'D',
    trend: contribGrowth > 0 ? 'improving' : 'declining',
  };
}

// ── Custom tooltip ─────────────────────────────────────────────
function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#0F172A', border:'1px solid #1E2D4A',
      borderRadius:10, padding:'12px 16px',
      boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin:'0 0 8px', fontSize:12, color:'#94A3B8', fontWeight:700 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:p.color }} />
          <span style={{ fontSize:12, color:'#F0F4FF' }}>
            {p.name}: <strong style={{ color:p.color, fontFamily:'DM Mono, monospace' }}>
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
              {p.name?.includes('Rate') || p.name?.includes('%') ? '%' : ''}
            </strong>
          </span>
        </div>
      ))}
      {payload[0]?.payload?.isForecast && (
        <p style={{ margin:'6px 0 0', fontSize:10, color:'#64748B', fontStyle:'italic' }}>
          ⚡ AI Forecast
        </p>
      )}
    </div>
  );
}

// ── Main Predictive Analytics Component ───────────────────────
export default function PredictiveAnalytics() {
  const [contribHistory] = useState(() => generateMonthlyData(12));
  const [attendHistory]  = useState(() => generateAttendanceData(12));
  const [forecastMonths, setForecastMonths] = useState(3);
  const [activeTab, setActiveTab] = useState('overview');

  const { forecast: contribForecast, reg: contribReg } = useMemo(
    () => buildForecast(contribHistory, 'actual', forecastMonths),
    [contribHistory, forecastMonths]
  );

  const { forecast: attendForecast } = useMemo(
    () => buildForecast(attendHistory, 'rate', forecastMonths),
    [attendHistory, forecastMonths]
  );

  const contribAnomalies = useMemo(() => detectAnomalies(contribHistory, 'actual'), [contribHistory]);
  const health           = useMemo(() => choirHealthScore(contribHistory, attendHistory), [contribHistory, attendHistory]);

  // Combined chart data
  const contribChartData = useMemo(() => [
    ...contribHistory.map(d => ({ ...d, type:'actual' })),
    ...contribForecast.map(d => ({ ...d, type:'forecast' })),
  ], [contribHistory, contribForecast]);

  const attendChartData = useMemo(() => [
    ...attendHistory.map(d => ({ ...d, type:'actual' })),
    ...attendForecast.map(d => ({ ...d, type:'forecast' })),
  ], [attendHistory, attendForecast]);

  const TABS = [
    { id:'overview',      label:'Overview',       icon:'🏥' },
    { id:'contributions', label:'Contribution AI', icon:'💰' },
    { id:'attendance',    label:'Attendance AI',   icon:'✅' },
    { id:'risk',          label:'Risk Analysis',   icon:'⚠' },
  ];

  const GRADE_COLORS = { A:'#22C55E', B:'#3B82F6', C:'#F59E0B', D:'#EF4444' };
  const gradeColor   = GRADE_COLORS[health.grade] || '#94A3B8';

  return (
    <div style={{ fontFamily:'Crimson Pro, serif', color:'#F0F4FF' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontFamily:'Cinzel, serif', color:'#C9A84C' }}>
            ⚡ Predictive Analytics
          </h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B' }}>
            AI-powered forecasting and trend analysis
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <label style={{ fontSize:12, color:'#64748B' }}>Forecast horizon:</label>
          <div style={{ display:'flex', gap:6 }}>
            {[1,3,6].map(m => (
              <button key={m} onClick={() => setForecastMonths(m)} style={{
                padding:'5px 12px', borderRadius:8, border:'none',
                background: forecastMonths===m ? 'rgba(201,168,76,0.2)' : '#141E33',
                color: forecastMonths===m ? '#C9A84C' : '#64748B',
                fontSize:12, cursor:'pointer', fontWeight: forecastMonths===m ? 700 : 400,
                boxShadow: forecastMonths===m ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
              }}>
                {m}M
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1E2D4A', marginBottom:28 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background:'none', border:'none',
            borderBottom:`2px solid ${activeTab===t.id ? '#C9A84C' : 'transparent'}`,
            padding:'10px 20px', cursor:'pointer',
            color: activeTab===t.id ? '#C9A84C' : '#64748B',
            fontSize:13, fontWeight: activeTab===t.id ? 700 : 400,
            display:'flex', alignItems:'center', gap:7, transition:'all 0.2s',
            whiteSpace:'nowrap',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Health gauge */}
          <div style={{
            display:'grid', gridTemplateColumns:'300px 1fr', gap:20,
            marginBottom:24, alignItems:'stretch',
          }}>
            <div style={{
              background:'linear-gradient(135deg, #0F172A, #141E33)',
              border:`1px solid ${gradeColor}33`,
              borderRadius:20, padding:'28px',
              display:'flex', flexDirection:'column', alignItems:'center',
              textAlign:'center',
            }}>
              <div style={{ position:'relative', marginBottom:16 }}>
                <svg width="140" height="80" viewBox="0 0 140 80">
                  {/* Background arc */}
                  <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#1E2D4A" strokeWidth="10" strokeLinecap="round"/>
                  {/* Score arc */}
                  <path
                    d={`M 10 75 A 60 60 0 0 1 ${10 + 120 * (health.overall/100)} ${75 - 120 * (health.overall/100) * 0.7}`}
                    fill="none" stroke={gradeColor} strokeWidth="10" strokeLinecap="round"
                    style={{ filter:`drop-shadow(0 0 8px ${gradeColor}80)` }}
                  />
                  <text x="70" y="78" textAnchor="middle" style={{ fontSize:28, fontWeight:800, fill:gradeColor, fontFamily:'DM Mono, monospace' }}>
                    {health.overall}
                  </text>
                </svg>
              </div>
              <div style={{
                fontSize:36, fontWeight:900, color:gradeColor,
                fontFamily:'Cinzel, serif', lineHeight:1, marginBottom:6,
              }}>
                Grade {health.grade}
              </div>
              <p style={{ margin:'0 0 16px', fontSize:13, color:'#94A3B8' }}>Choir Health Score</p>
              <div style={{
                display:'flex', gap:8, width:'100%',
              }}>
                {[
                  { label:'Finance', score:health.contribScore, color:'#C9A84C' },
                  { label:'Attendance', score:health.attendScore, color:'#3B82F6' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex:1, background:'rgba(255,255,255,0.03)',
                    border:'1px solid #1E2D4A', borderRadius:10, padding:'10px 12px',
                  }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:'DM Mono, monospace' }}>{s.score}</div>
                    <div style={{ fontSize:10, color:'#64748B', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop:14, padding:'6px 14px',
                background: health.trend==='improving' ? '#22C55E11' : '#EF444411',
                border:`1px solid ${health.trend==='improving' ? '#22C55E33' : '#EF444433'}`,
                borderRadius:20, fontSize:12,
                color: health.trend==='improving' ? '#22C55E' : '#EF4444',
              }}>
                {health.trend==='improving' ? '↑ Improving' : '↓ Needs attention'}
              </div>
            </div>

            {/* Quick metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { label:'Projected Next Month',  value:`RWF ${contribForecast[0]?.predicted?.toLocaleString() || '—'}`, icon:'💰', color:'#C9A84C', sub:`±${Math.round((contribForecast[0]?.upper-contribForecast[0]?.predicted)/1000)}K confidence` },
                { label:'Attendance Forecast',   value:`${attendForecast[0]?.predicted?.toFixed(1) || '—'}%`, icon:'✅', color:'#22C55E', sub:'Next month projection' },
                { label:'Anomalies Detected',    value:contribAnomalies.length, icon:'⚠', color: contribAnomalies.length>0 ? '#F59E0B' : '#22C55E', sub:`${contribAnomalies.length} unusual data point${contribAnomalies.length!==1?'s':''}` },
                { label:'Trend Direction',       value: contribReg.slope > 0 ? '📈 Growing' : '📉 Shrinking', icon:'📊', color:'#3B82F6', sub:`${Math.abs(contribReg.slope).toFixed(0)} RWF/mo avg change` },
              ].map(m => (
                <div key={m.label} style={{
                  background:'#0F172A', border:'1px solid #1E2D4A',
                  borderRadius:16, padding:'20px 22px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:22 }}>{m.icon}</span>
                    <span style={{ fontSize:10, color:'#374151', textTransform:'uppercase', letterSpacing:'0.1em' }}>Predicted</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:m.color, fontFamily:'DM Mono, monospace', marginBottom:4 }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{m.label}</div>
                  <div style={{ fontSize:10, color:'#374151', marginTop:4, fontStyle:'italic' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Contribution AI ── */}
      {activeTab === 'contributions' && (
        <div>
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:'24px 28px', marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:16, fontFamily:'Cinzel, serif' }}>
                Contribution Forecast
              </h3>
              <div style={{ display:'flex', gap:12 }}>
                {[{ color:'#C9A84C', label:'Actual' }, { color:'#3B82F6', label:'Forecast' }, { color:'rgba(59,130,246,0.2)', label:'Confidence Band' }].map(l => (
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748B' }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />{l.label}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={contribChartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="month" stroke="#374151" tick={{ fill:'#64748B', fontSize:11 }} />
                <YAxis stroke="#374151" tick={{ fill:'#64748B', fontSize:11 }} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ForecastTooltip />} />
                {/* Actual band */}
                <Area type="monotone" dataKey="actual" stroke="#C9A84C" fill="url(#g1)" strokeWidth={2.5} dot={{ fill:'#C9A84C', r:3 }} name="Actual (RWF)" connectNulls />
                {/* Forecast band */}
                <Area type="monotone" dataKey="upper"     stroke="none"   fill="rgba(59,130,246,0.1)" strokeWidth={0} connectNulls />
                <Area type="monotone" dataKey="lower"     stroke="none"   fill="#0F172A"               strokeWidth={0} connectNulls />
                <Area type="monotone" dataKey="predicted" stroke="#3B82F6" fill="url(#g2)" strokeWidth={2} strokeDasharray="5 4" dot={{ fill:'#3B82F6', r:3 }} name="Forecast (RWF)" connectNulls />
                {/* Anomaly markers */}
                {contribAnomalies.map(a => (
                  <ReferenceDot key={a.index} x={a.month} y={a.actual} r={7} fill="#F59E0B" stroke="#F59E0B44" label={{ value:'!', fill:'#080C14', fontSize:10, fontWeight:900 }} />
                ))}
                {/* Forecast boundary line */}
                <ReferenceLine x={contribHistory.at(-1)?.month} stroke="#374151" strokeDasharray="4 4" label={{ value:'Today', fill:'#64748B', fontSize:10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast table */}
          <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:16, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #1E2D4A' }}>
              <h4 style={{ margin:0, fontSize:14, fontFamily:'Cinzel, serif' }}>Monthly Forecast Table</h4>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#141E33' }}>
                  {['Month','Predicted','Lower Bound','Upper Bound','Confidence'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contribForecast.map((f, i) => {
                  const range  = f.upper - f.lower;
                  const conf   = Math.max(60, Math.round(100 - (range / f.predicted) * 100));
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #0A1628' }}>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#F0F4FF', fontWeight:600 }}>{f.month}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#3B82F6', fontFamily:'DM Mono, monospace', fontWeight:700 }}>
                        RWF {f.predicted?.toLocaleString()}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#64748B', fontFamily:'DM Mono, monospace' }}>
                        {f.lower?.toLocaleString()}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:12, color:'#64748B', fontFamily:'DM Mono, monospace' }}>
                        {f.upper?.toLocaleString()}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:4, background:'#1E2D4A', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${conf}%`, background:'linear-gradient(90deg, #A07820, #C9A84C)', borderRadius:2 }} />
                          </div>
                          <span style={{ fontSize:11, color:'#C9A84C', fontFamily:'DM Mono, monospace', width:35, textAlign:'right' }}>
                            {conf}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Attendance AI ── */}
      {activeTab === 'attendance' && (
        <div style={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:20, padding:'24px 28px' }}>
          <h3 style={{ margin:'0 0 20px', fontSize:16, fontFamily:'Cinzel, serif' }}>
            Attendance Rate Forecast
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="month" stroke="#374151" tick={{ fill:'#64748B', fontSize:11 }} />
              <YAxis domain={[50,100]} stroke="#374151" tick={{ fill:'#64748B', fontSize:11 }} tickFormatter={v=>`${v}%`} />
              <Tooltip content={<ForecastTooltip />} />
              <ReferenceLine y={70} stroke="#EF444466" strokeDasharray="4 4" label={{ value:'Risk threshold 70%', fill:'#EF4444', fontSize:10 }} />
              <ReferenceLine y={85} stroke="#22C55E44" strokeDasharray="4 4" label={{ value:'Target 85%', fill:'#22C55E', fontSize:10 }} />
              <Line type="monotone" dataKey="rate"      stroke="#22C55E" strokeWidth={2.5} dot={{ fill:'#22C55E', r:3 }} name="Actual Rate (%)" connectNulls />
              <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 4" dot={{ fill:'#3B82F6', r:3 }} name="Forecast Rate (%)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Risk Analysis ── */}
      {activeTab === 'risk' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <RiskFactors contribHistory={contribHistory} attendHistory={attendHistory} />
          <AnomalyReport anomalies={contribAnomalies} history={contribHistory} />
        </div>
      )}
    </div>
  );
}

// ── Risk factors ───────────────────────────────────────────────
function RiskFactors({ contribHistory, attendHistory }) {
  const lastAttend   = attendHistory.at(-1)?.rate || 0;
  const last3Contrib = contribHistory.slice(-3).map(d => d.actual);
  const contribTrend = last3Contrib.length > 1 ? last3Contrib.at(-1) - last3Contrib[0] : 0;

  const risks = [
    {
      label: 'Low Attendance',
      severity: lastAttend < 70 ? 'high' : lastAttend < 80 ? 'medium' : 'low',
      desc: `Current attendance ${lastAttend.toFixed(1)}%`,
      recommendation: lastAttend < 70 ? 'Send attendance reminders & follow up with at-risk members' : 'Attendance is healthy',
    },
    {
      label: 'Declining Contributions',
      severity: contribTrend < -20000 ? 'high' : contribTrend < 0 ? 'medium' : 'low',
      desc: `3-month trend: RWF ${contribTrend >= 0 ? '+' : ''}${contribTrend.toLocaleString()}`,
      recommendation: contribTrend < 0 ? 'Consider a targeted tithe reminder campaign' : 'Contributions are growing',
    },
    {
      label: 'Upcoming Events Preparation',
      severity: 'low',
      desc: 'All mandatory rehearsals scheduled',
      recommendation: 'Keep momentum with regular event updates',
    },
    {
      label: 'New Member Integration',
      severity: 'medium',
      desc: '2 pending registrations awaiting approval',
      recommendation: 'Approve and onboard new members promptly',
    },
  ];

  const SEVERITY = {
    high:   { color:'#EF4444', bg:'rgba(239,68,68,0.08)', icon:'🔴', label:'High Risk' },
    medium: { color:'#F59E0B', bg:'rgba(245,158,11,0.08)', icon:'🟡', label:'Medium Risk' },
    low:    { color:'#22C55E', bg:'rgba(34,197,94,0.08)',  icon:'🟢', label:'Low Risk'  },
  };

  return (
    <div>
      <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
        Risk Assessment
      </h3>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {risks.map((r, i) => {
          const s = SEVERITY[r.severity];
          return (
            <div key={i} style={{
              background: s.bg, border:`1px solid ${s.color}22`,
              borderRadius:14, padding:'16px 18px',
              borderLeft:`3px solid ${s.color}`,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#F0F4FF' }}>{r.label}</span>
                <span style={{
                  marginLeft:'auto', fontSize:10, color:s.color,
                  background:`${s.color}22`, border:`1px solid ${s.color}33`,
                  borderRadius:4, padding:'1px 6px',
                }}>
                  {s.label}
                </span>
              </div>
              <p style={{ margin:'0 0 6px', fontSize:12, color:'#94A3B8' }}>{r.desc}</p>
              <p style={{ margin:0, fontSize:11, color:'#64748B', fontStyle:'italic' }}>
                💡 {r.recommendation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnomalyReport({ anomalies, history }) {
  return (
    <div>
      <h3 style={{ margin:'0 0 16px', fontSize:15, fontFamily:'Cinzel, serif', color:'#F0F4FF' }}>
        Anomalies Detected
      </h3>
      {anomalies.length === 0 ? (
        <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:14, padding:24, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
          <p style={{ color:'#22C55E', fontSize:14, margin:0 }}>No anomalies detected</p>
          <p style={{ color:'#64748B', fontSize:12, margin:'4px 0 0' }}>All data points are within expected range</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {anomalies.map((a, i) => (
            <div key={i} style={{
              background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
              borderRadius:12, padding:'14px 16px',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, color:'#F0F4FF', fontWeight:600 }}>{a.month}</span>
                <span style={{ fontSize:11, color:'#F59E0B', fontFamily:'DM Mono, monospace' }}>
                  z={a.zscore.toFixed(2)}
                </span>
              </div>
              <p style={{ margin:0, fontSize:12, color:'#F59E0B' }}>
                RWF {a.actual?.toLocaleString()} — {Math.abs(a.zscore) > 2.5 ? 'Significant' : 'Minor'} deviation
              </p>
              <p style={{ margin:'4px 0 0', fontSize:11, color:'#64748B' }}>
                {a.zscore > 0 ? '↑ Unusually high' : '↓ Unusually low'} contribution month
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
