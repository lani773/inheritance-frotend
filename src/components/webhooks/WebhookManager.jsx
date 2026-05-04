/**
 * INHERITANCE CHOIR — Webhook Manager
 * Configure outgoing webhooks for external integrations.
 * Subscribe to events: new_member, attendance_marked, contribution_recorded, etc.
 */
import React, { useState, useCallback } from 'react';
import { useNotifications } from '../../context/NotificationsContext';

// ── Available webhook events ───────────────────────────────────
const WEBHOOK_EVENTS = [
  { id: 'member.registered',   label: 'New Registration',     icon: '👤', category: 'Members' },
  { id: 'member.approved',     label: 'Member Approved',      icon: '✅', category: 'Members' },
  { id: 'member.updated',      label: 'Member Updated',       icon: '✎',  category: 'Members' },
  { id: 'attendance.marked',   label: 'Attendance Marked',    icon: '📋', category: 'Attendance' },
  { id: 'attendance.alert',    label: 'At-Risk Alert',        icon: '⚠',  category: 'Attendance' },
  { id: 'contribution.created',label: 'New Contribution',     icon: '💰', category: 'Finance' },
  { id: 'contribution.verified',label: 'Contribution Verified',icon: '✓', category: 'Finance' },
  { id: 'event.created',       label: 'Event Created',        icon: '📅', category: 'Events' },
  { id: 'event.reminder',      label: 'Event Reminder Sent',  icon: '🔔', category: 'Events' },
  { id: 'welfare.case_opened', label: 'Welfare Case Opened',  icon: '❤️', category: 'Welfare' },
  { id: 'message.broadcast',   label: 'Broadcast Sent',       icon: '📢', category: 'Comms' },
];

const SAMPLE_WEBHOOKS = [
  {
    id: 'wh_1', name: 'Church Website Sync', url: 'https://church-website.rw/api/choir/webhook',
    events: ['member.registered', 'member.approved', 'event.created'],
    status: 'active', secret: 'whsec_abc123', totalDeliveries: 147, failedDeliveries: 2,
    lastDelivery: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'wh_2', name: 'WhatsApp Notification Bot', url: 'https://bot.choir.rw/webhooks/receive',
    events: ['attendance.alert', 'event.reminder', 'message.broadcast'],
    status: 'active', secret: 'whsec_def456', totalDeliveries: 892, failedDeliveries: 14,
    lastDelivery: new Date(Date.now() - 300000).toISOString(),
  },
];

// Sample delivery logs
const DELIVERY_LOGS = [
  { id: 'd1', event: 'member.registered', status: 200, duration: 245, ts: new Date(Date.now()-3600000).toISOString(), webhookId: 'wh_1' },
  { id: 'd2', event: 'event.created', status: 200, duration: 189, ts: new Date(Date.now()-7200000).toISOString(), webhookId: 'wh_1' },
  { id: 'd3', event: 'attendance.alert', status: 200, duration: 312, ts: new Date(Date.now()-1800000).toISOString(), webhookId: 'wh_2' },
  { id: 'd4', event: 'member.approved', status: 502, duration: 30000, ts: new Date(Date.now()-86400000).toISOString(), webhookId: 'wh_1' },
  { id: 'd5', event: 'message.broadcast', status: 200, duration: 156, ts: new Date(Date.now()-300000).toISOString(), webhookId: 'wh_2' },
];

function fmtRelTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── Webhook card ──────────────────────────────────────────────
function WebhookCard({ webhook, onTest, onToggle, onDelete, deliveryLogs }) {
  const [expanded, setExpanded] = useState(false);
  const [testing,  setTesting]  = useState(false);
  const isActive   = webhook.status === 'active';
  const successRate = Math.round(((webhook.totalDeliveries - webhook.failedDeliveries) / webhook.totalDeliveries) * 100);
  const myLogs = deliveryLogs.filter(l => l.webhookId === webhook.id);

  const handleTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(false);
    onTest(webhook.id, true);
  };

  return (
    <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isActive ? 'rgba(34,197,94,0.1)' : '#141E33',
          border: `1px solid ${isActive ? '#22C55E33' : '#1E2D4A'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          🔗
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F4FF' }}>{webhook.name}</span>
            <span style={{
              fontSize: 10, color: isActive ? '#22C55E' : '#64748B',
              background: isActive ? '#22C55E11' : '#141E33',
              border: `1px solid ${isActive ? '#22C55E33' : '#1E2D4A'}`,
              borderRadius: 4, padding: '1px 6px', fontWeight: 700,
            }}>
              {isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontFamily: 'DM Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {webhook.url}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: successRate >= 95 ? '#22C55E' : successRate >= 80 ? '#F59E0B' : '#EF4444', fontFamily: 'DM Mono, monospace' }}>
              {successRate}%
            </div>
            <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase' }}>Success</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>
              {webhook.totalDeliveries}
            </div>
            <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase' }}>Sent</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); handleTest(); }} disabled={testing} style={{
              background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '4px 10px',
              color: '#3B82F6', cursor: testing ? 'wait' : 'pointer', fontSize: 11,
            }}>
              {testing ? '⏳' : '⚡'} Test
            </button>
            <button onClick={e => { e.stopPropagation(); onToggle(webhook.id); }} style={{
              background: 'none', border: `1px solid ${isActive ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
              borderRadius: 6, padding: '4px 10px',
              color: isActive ? '#F59E0B' : '#22C55E', cursor: 'pointer', fontSize: 11,
            }}>
              {isActive ? 'Pause' : 'Resume'}
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(webhook.id); }} style={{
              background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px',
              color: '#EF4444', cursor: 'pointer', fontSize: 11,
            }}>
              Delete
            </button>
          </div>
          <span style={{ color: '#374151' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1E2D4A' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subscribed Events</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {webhook.events.map(ev => {
                  const evObj = WEBHOOK_EVENTS.find(e => e.id === ev);
                  return (
                    <span key={ev} style={{ fontSize: 11, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {evObj?.icon} {evObj?.label || ev}
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Signing Secret</p>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#374151', background: '#141E33', borderRadius: 8, padding: '8px 12px' }}>
                {webhook.secret.slice(0, 12)}••••••••
              </div>
            </div>
          </div>

          {/* Delivery log */}
          <p style={{ margin: '16px 0 8px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recent Deliveries
          </p>
          <div style={{ background: '#141E33', borderRadius: 10, overflow: 'hidden' }}>
            {myLogs.slice(0, 5).map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderBottom: i < myLogs.length - 1 ? '1px solid #0F172A' : 'none',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: log.status === 200 ? '#22C55E' : '#EF4444',
                  boxShadow: log.status === 200 ? '0 0 6px #22C55E' : '0 0 6px #EF4444',
                }} />
                <span style={{ flex: 1, fontSize: 12, color: '#94A3B8', fontFamily: 'DM Mono, monospace' }}>{log.event}</span>
                <span style={{ fontSize: 11, color: log.status === 200 ? '#22C55E' : '#EF4444' }}>{log.status}</span>
                <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'DM Mono, monospace' }}>{log.duration}ms</span>
                <span style={{ fontSize: 11, color: '#374151' }}>{fmtRelTime(log.ts)}</span>
              </div>
            ))}
            {myLogs.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: '#374151', fontSize: 12 }}>No deliveries yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function WebhookManager() {
  const [webhooks, setWebhooks]   = useState(SAMPLE_WEBHOOKS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState({ name: '', url: '', events: [], secret: '' });
  const { toast }                 = useNotifications();

  const handleTest = useCallback((id, success) => {
    toast(success ? 'Test delivery successful! (200 OK)' : 'Test delivery failed', { type: success ? 'success' : 'error' });
  }, [toast]);

  const handleToggle = useCallback((id) => {
    setWebhooks(ws => ws.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
  }, []);

  const handleDelete = useCallback((id) => {
    setWebhooks(ws => ws.filter(w => w.id !== id));
    toast('Webhook deleted', { type: 'warning' });
  }, [toast]);

  const handleCreate = () => {
    if (!form.name || !form.url || form.events.length === 0) return;
    const secret = `whsec_${Math.random().toString(36).slice(2, 18)}`;
    setWebhooks(ws => [{
      id: `wh_${Date.now()}`, ...form, secret, status: 'active',
      totalDeliveries: 0, failedDeliveries: 0, lastDelivery: null,
    }, ...ws]);
    setForm({ name: '', url: '', events: [], secret: '' });
    setShowCreate(false);
    toast('Webhook created and active', { type: 'success' });
  };

  const toggleFormEvent = (ev) => setForm(f => ({
    ...f, events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
  }));

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif', color: '#F0F4FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>🔗 Webhooks</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            {webhooks.filter(w => w.status === 'active').length} active endpoints · Real-time event notifications
          </p>
        </div>
        <button onClick={() => setShowCreate(s => !s)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #A07820, #C9A84C)', border: 'none', borderRadius: 10, color: '#080C14', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Add Webhook
        </button>
      </div>

      {showCreate && (
        <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 16px', fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>New Webhook</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Endpoint name"
              style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '9px 12px', color: '#F0F4FF', fontSize: 13, outline: 'none' }} />
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-server.com/webhooks/receive"
              style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, padding: '9px 12px', color: '#F0F4FF', fontSize: 13, outline: 'none' }} />
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Events to subscribe</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {WEBHOOK_EVENTS.map(ev => {
              const sel = form.events.includes(ev.id);
              return (
                <button key={ev.id} onClick={() => toggleFormEvent(ev.id)} style={{
                  padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: sel ? 'rgba(201,168,76,0.15)' : '#141E33',
                  color: sel ? '#C9A84C' : '#64748B', fontSize: 11, cursor: 'pointer',
                  boxShadow: sel ? '0 0 0 1px rgba(201,168,76,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {ev.icon} {ev.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '9px 18px', background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 8, color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            <button onClick={handleCreate} disabled={!form.name || !form.url || form.events.length === 0}
              style={{ padding: '9px 18px', background: form.name && form.url && form.events.length ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A', border: 'none', borderRadius: 8, color: '#080C14', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              Create Webhook
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {webhooks.map(w => (
          <WebhookCard key={w.id} webhook={w} deliveryLogs={DELIVERY_LOGS}
            onTest={handleTest} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
