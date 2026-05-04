/**
 * INHERITANCE CHOIR — Broadcast Scheduler & Message Templates
 * Schedule messages to be sent at a specific time + save/reuse templates.
 */
import React, { useState } from 'react';
import { usePermissions } from '../../context/PermissionsContext';
import { Gate } from '../../context/PermissionsContext';

const VOICE_PARTS   = ['All Members','Soprano','Alto','Tenor','Bass'];
const CHANNELS      = [
  { id: 'inapp',    label: 'In-App',   icon: '🔔' },
  { id: 'email',    label: 'Email',    icon: '✉️'  },
  { id: 'sms',      label: 'SMS',      icon: '📱'  },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬'  },
];

const TEMPLATES = [
  { id: 1, name: 'Rehearsal Reminder',   subject: 'Rehearsal Tomorrow 🎵', body: 'Dear [Name], this is a reminder that we have rehearsal tomorrow at [Time] in [Location]. Please be on time!' },
  { id: 2, name: 'Tithe Reminder',       subject: 'Monthly Tithe Reminder 💰', body: 'Dear [Name], this is a gentle reminder to submit your tithe for this month. Every contribution matters!' },
  { id: 3, name: 'Event Announcement',   subject: 'Upcoming Event — [Event]', body: 'Dear Choir Family, we are excited to announce [Event] on [Date] at [Location]. Please confirm your attendance.' },
  { id: 4, name: 'Birthday Greeting',    subject: 'Happy Birthday! 🎂', body: 'Dear [Name], the entire Inheritance Choir family wishes you a wonderful birthday. May God bless you abundantly!' },
  { id: 5, name: 'Performance Notice',   subject: '🌟 Performance This Sunday', body: 'Dear [Name], we have a special performance this Sunday. Please ensure you arrive 30 minutes early in full choir uniform.' },
];

export function BroadcastScheduler({ onSend }) {
  const [form, setForm] = useState({
    subject:     '',
    body:        '',
    target:      'All Members',
    channels:    ['inapp'],
    scheduledAt: '',   // empty = send now
    priority:    'normal',
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [scheduled, setScheduled]         = useState([]);
  const [step, setStep]                   = useState('compose'); // compose | preview | sent

  const applyTemplate = (tpl) => {
    setForm(f => ({ ...f, subject: tpl.subject, body: tpl.body }));
    setShowTemplates(false);
  };

  const toggleChannel = (id) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(id)
        ? f.channels.filter(c => c !== id)
        : [...f.channels, id],
    }));
  };

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;

  const handleSend = () => {
    if (!form.subject || !form.body || form.channels.length === 0) return;

    if (form.scheduledAt) {
      setScheduled(s => [...s, {
        ...form,
        id: Date.now(),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      }]);
    }
    setStep('sent');
    onSend?.(form);
  };

  const resetForm = () => {
    setForm({ subject: '', body: '', target: 'All Members', channels: ['inapp'], scheduledAt: '', priority: 'normal' });
    setStep('compose');
  };

  if (step === 'sent') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {form.scheduledAt ? '📅' : '🚀'}
        </div>
        <h3 style={{ color: '#22C55E', fontFamily: 'Cinzel, serif', margin: '0 0 8px' }}>
          {form.scheduledAt ? 'Message Scheduled!' : 'Message Sent!'}
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 14 }}>
          {form.scheduledAt
            ? `Will be sent on ${new Date(form.scheduledAt).toLocaleString()}`
            : `Sent to ${form.target} via ${form.channels.join(', ')}`
          }
        </p>
        <button onClick={resetForm} style={{
          marginTop: 20, padding: '10px 24px',
          background: '#1E2D4A', border: 'none', borderRadius: 10,
          color: '#94A3B8', cursor: 'pointer', fontSize: 13,
        }}>
          Compose Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Crimson Pro, serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Compose area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Template picker */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Message Templates
              </label>
              <button
                onClick={() => setShowTemplates(s => !s)}
                style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 12, cursor: 'pointer' }}
              >
                {showTemplates ? 'Hide' : 'Browse'} →
              </button>
            </div>
            {showTemplates && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    style={{
                      background: '#141E33', border: '1px solid #1E2D4A',
                      borderRadius: 10, padding: '10px 14px',
                      textAlign: 'left', cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>{t.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Subject *
            </label>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Message subject…"
              style={{
                width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 10, padding: '12px 16px', color: '#F0F4FF',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Body */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Message *
              </label>
              <span style={{ fontSize: 11, color: '#374151', fontFamily: 'DM Mono, monospace' }}>
                {wordCount} words
              </span>
            </div>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={8}
              placeholder="Use [Name], [Date], [Time], [Location] as placeholders…"
              style={{
                width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 10, padding: '12px 16px', color: '#F0F4FF',
                fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: 'Crimson Pro, serif', lineHeight: 1.6,
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#374151' }}>
              💡 Tip: Use [Name] to personalize each message automatically
            </p>
          </div>
        </div>

        {/* Settings sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Audience */}
          <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              Audience
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {VOICE_PARTS.map(vp => (
                <label key={vp} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: form.target === vp ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: `1px solid ${form.target === vp ? '#C9A84C44' : 'transparent'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}>
                  <input
                    type="radio" name="target" value={vp}
                    checked={form.target === vp}
                    onChange={() => setForm(f => ({ ...f, target: vp }))}
                    style={{ accentColor: '#C9A84C' }}
                  />
                  <span style={{ fontSize: 13, color: form.target === vp ? '#C9A84C' : '#94A3B8' }}>
                    {vp}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              Delivery Channels
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHANNELS.map(ch => (
                <label key={ch.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', padding: '6px 0',
                }}>
                  <input
                    type="checkbox"
                    checked={form.channels.includes(ch.id)}
                    onChange={() => toggleChannel(ch.id)}
                    style={{ accentColor: '#C9A84C', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 16 }}>{ch.icon}</span>
                  <span style={{ fontSize: 13, color: form.channels.includes(ch.id) ? '#F0F4FF' : '#94A3B8' }}>
                    {ch.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              Schedule (optional)
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748B' }}>
              Leave empty to send immediately
            </p>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              style={{
                width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 8, padding: '10px 14px', color: '#F0F4FF',
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Priority */}
          <div style={{ background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 16, padding: '18px 20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif' }}>
              Priority
            </h4>
            <div style={{ display: 'flex', gap: 8 }}>
              {['normal','high','urgent'].map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  style={{
                    flex: 1, padding: '7px 0',
                    background: form.priority === p ? {
                      normal: 'rgba(59,130,246,0.15)', high: 'rgba(245,158,11,0.15)', urgent: 'rgba(239,68,68,0.15)',
                    }[p] : '#141E33',
                    border: `1px solid ${form.priority === p ? {
                      normal: '#3B82F644', high: '#F59E0B44', urgent: '#EF444444',
                    }[p] : '#1E2D4A'}`,
                    borderRadius: 8, cursor: 'pointer',
                    color: form.priority === p ? {
                      normal: '#3B82F6', high: '#F59E0B', urgent: '#EF4444',
                    }[p] : '#64748B',
                    fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!form.subject || !form.body || form.channels.length === 0}
            style={{
              width: '100%', padding: '14px',
              background: (!form.subject || !form.body || form.channels.length === 0)
                ? '#1E2D4A'
                : 'linear-gradient(135deg, #A07820, #C9A84C)',
              border: 'none', borderRadius: 12,
              color: '#080C14', fontSize: 14, fontWeight: 700,
              cursor: (!form.subject || !form.body || form.channels.length === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {form.scheduledAt ? '📅 Schedule Broadcast' : '🚀 Send Now'}
          </button>
        </div>
      </div>

      {/* Scheduled queue */}
      {scheduled.length > 0 && (
        <div style={{ marginTop: 28, background: '#0F172A', border: '1px solid #1E2D4A', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2D4A' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
              📅 Scheduled Queue ({scheduled.length})
            </h4>
          </div>
          {scheduled.map((s, i) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px', borderBottom: i < scheduled.length - 1 ? '1px solid #0A1628' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#F0F4FF', fontWeight: 500 }}>{s.subject}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>
                  To: {s.target} · {new Date(s.scheduledAt).toLocaleString()}
                </p>
              </div>
              <span style={{
                fontSize: 10, color: '#F59E0B', background: '#F59E0B11',
                border: '1px solid #F59E0B33', borderRadius: 6, padding: '2px 8px',
              }}>
                SCHEDULED
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
