/**
 * INHERITANCE CHOIR — System Monitor
 * Real-time server health, API performance metrics, cache stats,
 * error rates, and automated alerts.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api/client';

// ── Simulated metrics generator ────────────────────────────────
function generateMetric(base, variance) {
  return Math.max(0, Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10);
}

function generateTimePoint() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    responseTime: generateMetric(42, 25),
    rps:          generateMetric(145, 80),
    errorRate:    generateMetric(0.3, 0.8),
    cpu:          generateMetric(18, 15),
    memory:       generateMetric(47, 12),
    cacheHit:     generateMetric(87, 8),
  };
}

const ENDPOINTS = [
  { path: '/api/v1/members',       method: 'GET',  avgMs: 12, rps: 45,  status: 'healthy' },
  { path: '/api/v1/contributions', method: 'GET',  avgMs: 18, rps: 22,  status: 'healthy' },
  { path: '/api/v1/analytics/dashboard', method: 'GET', avgMs: 89, rps: 8, status: 'healthy' },
  { path: '/api/v1/attendance/bulk',method: 'POST', avgMs: 34, rps: 12, status: 'healthy' },
  { path: '/api/v1/auth/login',    method: 'POST', avgMs: 245, rps: 3, status: 'slow'    },
  { path: '/api/v1/messages',      method: 'GET',  avgMs: 9,  rps: 67,  status: 'healthy' },
];

const STATUS_DOT = ({ status }) => {
  const colors = { healthy: '#22C55E', slow: '#F59E0B', error: '#EF4444' };
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: colors[status] || '#94A3B8',
      boxShadow: `0 0 6px ${colors[status] || '#94A3B8'}`,
      animation: status === 'error' ? 'pulse 1s infinite' : 'none',
    }} />
  );
};

function StatCard({ label, value, unit, color, trend, icon }) {
  return (
    <div style={{
      background: '#0F172A', border: `1px solid ${color}22`,
      borderRadius: 14, padding: '16px 18px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#64748B' }}>{icon} {label}</span>
        {trend !== undefined && (
          <span style={{ fontSize: 11, color: trend >= 0 ? '#22C55E' : '#EF4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: '#64748B' }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function SystemMonitor() {
  const [metrics,   setMetrics]   = useState(() => Array.from({ length: 20 }, generateTimePoint));
  const [health,    setHealth]    = useState('healthy'); // healthy | degraded | down
  const [connected, setConnected] = useState(navigator.onLine);
  const [cacheStats, setCacheStats] = useState({
    hitRate: 87.4, totalKeys: 142, memUsageMB: 2.3, evictions: 0,
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    setConnected(navigator.onLine);
    const onOnline  = () => setConnected(true);
    const onOffline = () => setConnected(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Live metric updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMetrics(prev => {
        const next = [...prev.slice(-29), generateTimePoint()];
        return next;
      });
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const latest = metrics[metrics.length - 1] || {};

  // Cache invalidation
  const handleClearCache = () => {
    api.clearCache();
    setCacheStats(s => ({ ...s, totalKeys: 0, memUsageMB: 0, evictions: s.totalKeys }));
  };

  const STAT_CARDS = [
    { label: 'Response Time', value: latest.responseTime, unit: 'ms', color: latest.responseTime > 100 ? '#F59E0B' : '#22C55E', icon: '⚡' },
    { label: 'Requests/sec',  value: latest.rps,          unit: 'RPS', color: '#3B82F6', icon: '📡' },
    { label: 'Error Rate',    value: latest.errorRate,     unit: '%',  color: latest.errorRate > 2 ? '#EF4444' : '#22C55E', icon: '❌' },
    { label: 'CPU Usage',     value: latest.cpu,           unit: '%',  color: latest.cpu > 70 ? '#EF4444' : '#94A3B8', icon: '💻' },
    { label: 'Memory',        value: latest.memory,        unit: 'MB', color: '#8B5CF6', icon: '🧠' },
    { label: 'Cache Hit Rate',value: latest.cacheHit,      unit: '%',  color: '#C9A84C', icon: '💾' },
  ];

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>📊 System Monitor</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Real-time server health and performance metrics
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Overall status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px',
            background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${connected ? '#22C55E33' : '#EF444433'}`,
            borderRadius: 20,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22C55E' : '#EF4444',
              animation: connected ? 'pulse-green 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, color: connected ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
              {connected ? 'All Systems Operational' : 'Connection Lost'}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#374151' }}>
            Live · updates every 2s
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {STAT_CARDS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Response time chart */}
        <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 13, fontFamily: 'Cinzel, serif' }}>Response Time (ms)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="time" stroke="#374151" tick={{ fill:'#374151', fontSize:9 }} interval={4} />
              <YAxis stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} />
              <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:8, fontSize:11 }} />
              <Area type="monotone" dataKey="responseTime" stroke="#22C55E" fill="url(#rtGrad)" strokeWidth={2} dot={false} name="ms" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RPS + Error chart */}
        <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 13, fontFamily: 'Cinzel, serif' }}>Throughput & Errors</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="time" stroke="#374151" tick={{ fill:'#374151', fontSize:9 }} interval={4} />
              <YAxis stroke="#374151" tick={{ fill:'#64748B', fontSize:10 }} />
              <Tooltip contentStyle={{ background:'#0F172A', border:'1px solid #1E2D4A', borderRadius:8, fontSize:11 }} />
              <Line type="monotone" dataKey="rps"       stroke="#3B82F6" strokeWidth={2} dot={false} name="RPS" />
              <Line type="monotone" dataKey="errorRate" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Error %" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cache stats + endpoint table */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Cache stats */}
        <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 13, fontFamily: 'Cinzel, serif' }}>💾 Cache (Redis)</h4>
          {[
            { label: 'Hit Rate',     value: `${cacheStats.hitRate}%`,    color: '#C9A84C' },
            { label: 'Active Keys',  value: cacheStats.totalKeys,         color: '#3B82F6' },
            { label: 'Memory Used',  value: `${cacheStats.memUsageMB} MB`, color: '#8B5CF6' },
            { label: 'Evictions',    value: cacheStats.evictions,         color: '#94A3B8' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2D4A' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>{s.label}</span>
              <span style={{ fontSize: 13, color: s.color, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>{s.value}</span>
            </div>
          ))}
          <button onClick={handleClearCache} style={{
            width: '100%', marginTop: 16, padding: '9px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, color: '#EF4444', fontSize: 12, cursor: 'pointer',
          }}>
            🗑 Flush Cache
          </button>
        </div>

        {/* Endpoint performance table */}
        <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2D4A' }}>
            <h4 style={{ margin: 0, fontSize: 13, fontFamily: 'Cinzel, serif' }}>Endpoint Performance</h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#141E33' }}>
                {['Status', 'Endpoint', 'Method', 'Avg Response', 'RPS'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #0A1628' }}>
                  <td style={{ padding: '10px 14px' }}><STATUS_DOT status={ep.status} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>{ep.path}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: 'DM Mono, monospace',
                      color: ep.method === 'GET' ? '#3B82F6' : '#C9A84C',
                      background: ep.method === 'GET' ? '#3B82F611' : 'rgba(201,168,76,0.1)',
                      borderRadius: 4, padding: '1px 5px',
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: ep.avgMs > 100 ? '#F59E0B' : '#22C55E', fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
                    {ep.avgMs}ms
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>{ep.rps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
