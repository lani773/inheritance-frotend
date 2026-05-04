/**
 * INHERITANCE CHOIR — Notification Center
 * Full notification panel with filtering, preferences, and push.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, NOTIF_TYPES } from '../../context/NotificationsContext';

const TYPE_CONFIG = {
  info:    { icon: 'ℹ', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  success: { icon: '✓', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  warning: { icon: '⚠', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  error:   { icon: '✕', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  system:  { icon: '🎵', color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
};

// ── Bell Icon with badge ───────────────────────────────────────
export function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications();
  const [shake, setShake] = useState(false);
  const prevCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', background: 'none', border: 'none',
        cursor: 'pointer', padding: 8, borderRadius: 10,
        color: '#94A3B8', fontSize: 18,
        transition: 'all 0.2s',
        animation: shake ? 'bellShake 0.5s ease' : 'none',
      }}
      title="Notifications"
    >
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          minWidth: 16, height: 16,
          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
          borderRadius: 8, padding: '0 4px',
          fontSize: 9, fontWeight: 800,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #0A1628',
          fontFamily: 'DM Mono, monospace',
          boxShadow: '0 0 8px rgba(239,68,68,0.5)',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ── Full Notification Panel ────────────────────────────────────
export function NotificationPanel({ onClose }) {
  const {
    notifications, unreadCount, prefs,
    markRead, markAllRead, clearAll,
    updatePrefs, requestPushPermission, pushEnabled,
  } = useNotifications();

  const [view, setView]     = useState('all');   // all | unread | settings
  const [filter, setFilter] = useState('all');   // all | info | success | warning | error
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const displayed = notifications
    .filter(n => view === 'unread' ? !n.isRead : true)
    .filter(n => filter === 'all' ? true : n.type === filter);

  return (
    <div ref={panelRef} style={{
      width: 400,
      background: 'linear-gradient(180deg, #0F172A, #0A1628)',
      border: '1px solid #1E2D4A',
      borderRadius: 20,
      boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
      overflow: 'hidden',
      maxHeight: '85vh',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        borderBottom: '1px solid #1E2D4A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Cinzel, serif' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: '1px solid #1E2D4A',
                borderRadius: 8, padding: '4px 10px',
                fontSize: 11, color: '#94A3B8', cursor: 'pointer',
              }}>
                Mark all read
              </button>
            )}
            <button onClick={clearAll} style={{
              background: 'none', border: '1px solid #1E2D4A',
              borderRadius: 8, padding: '4px 10px',
              fontSize: 11, color: '#64748B', cursor: 'pointer',
            }}>
              Clear all
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { id: 'all',      label: 'All',      count: notifications.length },
            { id: 'unread',   label: 'Unread',   count: unreadCount },
            { id: 'settings', label: '⚙ Prefs',  count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                background: 'none', border: 'none', borderBottom: `2px solid ${view === tab.id ? '#C9A84C' : 'transparent'}`,
                padding: '8px 16px 10px',
                fontSize: 12, cursor: 'pointer', color: view === tab.id ? '#C9A84C' : '#64748B',
                fontWeight: view === tab.id ? 700 : 400,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span style={{
                  background: view === tab.id ? '#C9A84C22' : '#1E2D4A',
                  color: view === tab.id ? '#C9A84C' : '#64748B',
                  borderRadius: 10, padding: '0 5px',
                  fontSize: 10, fontWeight: 700,
                  fontFamily: 'DM Mono, monospace',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'settings' ? (
          <PreferencesPanel prefs={prefs} updatePrefs={updatePrefs}
            pushEnabled={pushEnabled} requestPush={requestPushPermission} />
        ) : (
          <>
            {/* Type filter chips */}
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' }}>
              {['all', 'info', 'success', 'warning', 'error', 'system'].map(f => {
                const cfg = TYPE_CONFIG[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f
                        ? (cfg?.bg || 'rgba(201,168,76,0.15)')
                        : '#141E33',
                      border: `1px solid ${filter === f ? (cfg?.color || '#C9A84C') + '55' : '#1E2D4A'}`,
                      borderRadius: 20, padding: '4px 12px',
                      fontSize: 11, cursor: 'pointer',
                      color: filter === f ? (cfg?.color || '#C9A84C') : '#64748B',
                      fontWeight: filter === f ? 700 : 400,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cfg?.icon} {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Notification list */}
            {displayed.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                <p style={{ color: '#475569', fontSize: 14 }}>
                  {view === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              displayed.map(n => (
                <NotificationRow key={n.id} notification={n} onRead={markRead} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ notification: n, onRead }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
  const time = formatTime(n.createdAt);

  return (
    <div
      onClick={() => !n.isRead && onRead(n.id)}
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid #0F172A',
        background: n.isRead ? 'transparent' : `${cfg.color}05`,
        borderLeft: n.isRead ? '2px solid transparent' : `2px solid ${cfg.color}`,
        cursor: n.isRead ? 'default' : 'pointer',
        display: 'flex', gap: 12,
        transition: 'background 0.2s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: cfg.color,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: n.isRead ? 400 : 600,
            color: n.isRead ? '#94A3B8' : '#F0F4FF',
            lineHeight: 1.4,
          }}>
            {n.title}
          </p>
          <span style={{ fontSize: 10, color: '#374151', flexShrink: 0 }}>{time}</span>
        </div>
        {n.message && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
            {n.message}
          </p>
        )}
        {n.actionUrl && (
          <a href={n.actionUrl} style={{
            display: 'inline-block', marginTop: 6,
            fontSize: 11, color: cfg.color, textDecoration: 'none',
            fontWeight: 600,
          }}>
            View →
          </a>
        )}
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: cfg.color, flexShrink: 0, marginTop: 5,
          boxShadow: `0 0 6px ${cfg.color}`,
        }} />
      )}
    </div>
  );
}

function PreferencesPanel({ prefs, updatePrefs, pushEnabled, requestPush }) {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
          Delivery Channels
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PrefToggle
            label="Sound alerts" icon="🔊"
            value={prefs.sound}
            onChange={v => updatePrefs({ sound: v })}
          />
          <PrefToggle
            label="Push notifications" icon="📱"
            value={pushEnabled}
            onChange={async () => { if (!pushEnabled) await requestPush(); }}
            badge={!pushEnabled ? 'Enable' : 'Active'}
          />
          <PrefToggle
            label="Email notifications" icon="✉️"
            value={prefs.email}
            onChange={v => updatePrefs({ email: v })}
          />
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 14px', fontSize: 13, color: '#C9A84C', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
          Notification Types
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(prefs.types || {}).map(([key, val]) => (
            <PrefToggle
              key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} icon="🎵"
              value={val}
              onChange={v => updatePrefs({ types: { ...prefs.types, [key]: v } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrefToggle({ label, icon, value, onChange, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#CBD5E1' }}>{label}</span>
        {badge && (
          <span style={{
            fontSize: 9, background: '#22C55E22', border: '1px solid #22C55E44',
            color: '#22C55E', borderRadius: 4, padding: '1px 5px',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? 'linear-gradient(135deg, #A07820, #C9A84C)' : '#1E2D4A',
          position: 'relative', cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: value ? '0 0 12px rgba(201,168,76,0.3)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: value ? '#fff' : '#475569',
          transition: 'left 0.3s ease',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}

function formatTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)    return 'now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return new Date(ts).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}
