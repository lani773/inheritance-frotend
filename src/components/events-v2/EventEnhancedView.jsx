/**
 * INHERITANCE CHOIR — Enhanced Event View
 * Combines: Setlist builder, Volunteer signup, Livestream link, Attendance countdown.
 */
import React, { useState, useEffect } from 'react';
import { SetlistBuilder }   from './SetlistBuilder';
import { VolunteerSignup }  from './VolunteerSignup';

const TYPE_CONFIG = {
  rehearsal:   { color: '#8B5CF6', icon: '🎵', label: 'Rehearsal'   },
  performance: { color: '#C9A84C', icon: '🌟', label: 'Performance' },
  service:     { color: '#EC4899', icon: '⛪', label: 'Service'     },
  meeting:     { color: '#22C55E', icon: '👥', label: 'Meeting'     },
  workshop:    { color: '#06B6D4', icon: '📚', label: 'Workshop'    },
  special:     { color: '#F59E0B', icon: '✨', label: 'Special'     },
};

// ── Countdown Ring ─────────────────────────────────────────────
function CountdownRing({ eventDate, eventTime }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const tick = () => {
      const target = new Date(`${eventDate}T${eventTime || '00:00'}:00`);
      const diff   = target - new Date();
      if (diff <= 0) { setTimeLeft({ past: true }); return; }
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [eventDate, eventTime]);

  if (timeLeft.past) return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <span style={{ fontSize: 28 }}>⏰</span>
      <p style={{ color: '#64748B', fontSize: 13, margin: '8px 0 0' }}>Event has passed</p>
    </div>
  );

  const units = [
    { label: 'Days',    value: timeLeft.days    || 0 },
    { label: 'Hours',   value: timeLeft.hours   || 0 },
    { label: 'Minutes', value: timeLeft.minutes || 0 },
    { label: 'Seconds', value: timeLeft.seconds || 0 },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {units.map(u => (
        <div key={u.label} style={{
          background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 12,
          padding: '14px 18px', textAlign: 'center', minWidth: 72,
        }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#C9A84C',
            fontFamily: 'DM Mono, monospace', lineHeight: 1,
            animation: u.label === 'Seconds' ? 'pulse 1s ease-in-out infinite' : 'none',
          }}>
            {String(u.value).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Livestream Panel ───────────────────────────────────────────
function LivestreamPanel({ link, onLinkChange, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(link || '');

  const isYoutube   = val.includes('youtube.com') || val.includes('youtu.be');
  const isZoom      = val.includes('zoom.us');
  const isMeet      = val.includes('meet.google.com');

  const platformLabel = isYoutube ? '▶ YouTube Live'
                      : isZoom    ? '📹 Zoom Meeting'
                      : isMeet    ? '🎦 Google Meet'
                      : link      ? '🔗 Live Link'
                      : null;

  return (
    <div style={{
      background: '#0F172A', border: '1px solid #1E2D4A',
      borderRadius: 16, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
          📡 Livestream
        </h4>
        {isAdmin && (
          <button
            onClick={() => setEditing(e => !e)}
            style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 12, cursor: 'pointer' }}
          >
            {editing ? 'Cancel' : '✎ Edit'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="Paste YouTube, Zoom, or Google Meet link…"
            style={{
              width: '100%', background: '#141E33', border: '1px solid #1E2D4A',
              borderRadius: 8, padding: '10px 14px', color: '#F0F4FF', fontSize: 13,
              outline: 'none', boxSizing: 'border-box', marginBottom: 10,
            }}
          />
          <button
            onClick={() => { onLinkChange?.(val); setEditing(false); }}
            style={{
              padding: '8px 18px', background: 'linear-gradient(135deg, #A07820, #C9A84C)',
              border: 'none', borderRadius: 8, color: '#080C14',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Save Link
          </button>
        </div>
      ) : link ? (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#141E33', borderRadius: 10, padding: '12px 16px', marginBottom: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#1E2D4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {isYoutube ? '▶' : isZoom ? '📹' : '🔗'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#C9A84C', fontWeight: 700 }}>{platformLabel}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {link}
              </p>
            </div>
          </div>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10,
              color: '#EF4444', fontSize: 13, fontWeight: 700,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
            Join Live Stream
          </a>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#374151', fontSize: 13 }}>
          {isAdmin ? 'Add a livestream link' : 'No livestream link added yet'}
        </div>
      )}
    </div>
  );
}

// ── Main Enhanced Event View ───────────────────────────────────
export function EventEnhancedView({ event, isAdmin = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [livestreamLink, setLivestreamLink] = useState(event?.livestreamUrl || '');

  if (!event) return null;

  const typeConfig = TYPE_CONFIG[event.type] || TYPE_CONFIG.rehearsal;
  const isToday    = event.date === new Date().toISOString().split('T')[0];
  const isPast     = event.date < new Date().toISOString().split('T')[0];

  const tabs = [
    { id: 'overview',   label: 'Overview',    icon: '📋' },
    { id: 'setlist',    label: 'Setlist',     icon: '🎵', show: ['performance','rehearsal','service'].includes(event.type) },
    { id: 'volunteers', label: 'Volunteers',  icon: '🙋' },
    { id: 'livestream', label: 'Livestream',  icon: '📡' },
  ].filter(t => t.show !== false);

  return (
    <div style={{
      background: '#0A1628', borderRadius: 20, overflow: 'hidden',
      border: '1px solid #1E2D4A', fontFamily: 'Crimson Pro, serif',
    }}>
      {/* Event hero header */}
      <div style={{
        padding: '28px 32px',
        background: `linear-gradient(135deg, ${typeConfig.color}11, #0F172A)`,
        borderBottom: `1px solid ${typeConfig.color}22`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${typeConfig.color}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: typeConfig.color,
                background: `${typeConfig.color}11`, border: `1px solid ${typeConfig.color}33`,
                borderRadius: 6, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {typeConfig.icon} {typeConfig.label}
              </span>
              {isToday && (
                <span style={{
                  fontSize: 11, color: '#22C55E', background: '#22C55E11',
                  border: '1px solid #22C55E33', borderRadius: 20,
                  padding: '3px 12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 1s infinite' }} />
                  TODAY
                </span>
              )}
              {event.mandatory && (
                <span style={{ fontSize: 11, color: '#EF4444', background: '#EF444411', border: '1px solid #EF444433', borderRadius: 6, padding: '3px 10px' }}>
                  ⚠ MANDATORY
                </span>
              )}
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 24, fontFamily: 'Cinzel, serif', color: '#F0F4FF' }}>
              {event.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                { icon: '📅', text: event.date },
                { icon: '⏰', text: `${event.time}${event.endTime ? ` – ${event.endTime}` : ''}` },
                { icon: '📍', text: event.location },
              ].map(info => (
                <span key={info.text} style={{ fontSize: 13, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {info.icon} {info.text}
                </span>
              ))}
              {event.targetVoices?.length > 0 && (
                <span style={{ fontSize: 13, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎵 {event.targetVoices.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Mini countdown — show if future event */}
          {!isPast && (
            <div style={{ flexShrink: 0 }}>
              <CountdownRing eventDate={event.date} eventTime={event.time} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1E2D4A', background: '#0F172A' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? '#C9A84C' : 'transparent'}`,
              padding: '13px 22px', cursor: 'pointer',
              color: activeTab === t.id ? '#C9A84C' : '#64748B',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 'overview' && (
          <div>
            {event.description && (
              <div style={{
                background: '#141E33', border: '1px solid #1E2D4A',
                borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Description
                </h4>
                <p style={{ margin: 0, fontSize: 14, color: '#CBD5E1', lineHeight: 1.7 }}>
                  {event.description}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Quick stats */}
              <div style={{ background: '#141E33', border: '1px solid #1E2D4A', borderRadius: 12, padding: '16px 20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Event Details
                </h4>
                {[
                  { label: 'Type',        value: typeConfig.label },
                  { label: 'Recurrence',  value: event.recurrence || 'None' },
                  { label: 'Target',      value: event.targetVoices?.length ? event.targetVoices.join(', ') : 'All voices' },
                  { label: 'Mandatory',   value: event.mandatory ? '⚠ Yes' : 'No' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1E2D4A' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{r.label}</span>
                    <span style={{ fontSize: 12, color: '#F0F4FF' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <LivestreamPanel
                link={livestreamLink}
                onLinkChange={setLivestreamLink}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        )}

        {activeTab === 'setlist' && (
          <SetlistBuilder
            eventTitle={event.title}
            onSave={(data) => console.log('Setlist saved:', data)}
          />
        )}

        {activeTab === 'volunteers' && (
          <VolunteerSignup
            eventId={event.id}
            eventTitle={event.title}
          />
        )}

        {activeTab === 'livestream' && (
          <div>
            <LivestreamPanel
              link={livestreamLink}
              onLinkChange={setLivestreamLink}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>
    </div>
  );
}
