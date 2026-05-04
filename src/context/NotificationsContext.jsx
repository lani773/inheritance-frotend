/**
 * INHERITANCE CHOIR — Notifications Context
 * Enterprise notification center: in-app, push, and real-time.
 */
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { useRealtime, WS_EVENTS, useRealtimeEvent } from './RealtimeContext';

const NotificationsContext = createContext(null);

// Notification types
export const NOTIF_TYPES = {
  INFO:     'info',
  SUCCESS:  'success',
  WARNING:  'warning',
  ERROR:    'error',
  SYSTEM:   'system',
};

// Sound effects (base64 short tones)
const SOUNDS = {
  chime: () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* audio blocked */ }
  },
};

export function NotificationsProvider({ children }) {
  const { session } = useAuth();
  const { setUnreadCount } = useRealtime();

  // Persisted notifications (from DB / localStorage)
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('choir_notifications') || '[]');
    } catch { return []; }
  });

  // Toast queue (ephemeral, top-right)
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Push notification permission
  const [pushEnabled, setPushEnabled] = useState(
    () => Notification?.permission === 'granted'
  );

  // ── Notification preferences ───────────────────────────────
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('choir_notif_prefs') || JSON.stringify({
        sound: true,
        push: true,
        email: true,
        types: {
          attendance: true,
          contributions: true,
          messages: true,
          events: true,
          welfare: true,
          system: true,
        },
      }));
    } catch {
      return { sound: true, push: true, types: {} };
    }
  });

  const updatePrefs = useCallback((updates) => {
    setPrefs(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('choir_notif_prefs', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Add notification ───────────────────────────────────────
  const addNotification = useCallback((notif) => {
    const n = {
      id: notif.id || `n_${Date.now()}_${Math.random()}`,
      type: notif.type || NOTIF_TYPES.INFO,
      title: notif.title || '',
      message: notif.message || '',
      actionUrl: notif.actionUrl || null,
      isRead: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      metadata: notif.metadata || {},
    };

    setNotifications(prev => {
      const next = [n, ...prev].slice(0, 100); // keep last 100
      localStorage.setItem('choir_notifications', JSON.stringify(next));
      return next;
    });

    setUnreadCount(c => c + 1);

    // Sound
    if (prefs.sound) SOUNDS.chime();

    // Push notification
    if (prefs.push && pushEnabled && document.hidden) {
      try {
        new Notification(`🎵 ${n.title}`, {
          body: n.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: n.id,
        });
      } catch { /* permission denied */ }
    }

    return n.id;
  }, [prefs, pushEnabled, setUnreadCount]);

  // ── Toast (ephemeral overlay) ──────────────────────────────
  const toast = useCallback((message, options = {}) => {
    const id = ++toastIdRef.current;
    const t = {
      id,
      message,
      type:     options.type     || NOTIF_TYPES.INFO,
      duration: options.duration || 4000,
      action:   options.action   || null,
    };
    setToasts(prev => [...prev, t]);
    setTimeout(() => dismissToast(id), t.duration + 300);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Mark read / clear ─────────────────────────────────────
  const markRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('choir_notifications', JSON.stringify(next));
      return next;
    });
    setUnreadCount(c => Math.max(0, c - 1));
  }, [setUnreadCount]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('choir_notifications', JSON.stringify(next));
      return next;
    });
    setUnreadCount(0);
  }, [setUnreadCount]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('choir_notifications');
    setUnreadCount(0);
  }, [setUnreadCount]);

  // ── Listen for real-time notifications ────────────────────
  useRealtimeEvent(WS_EVENTS.NOTIFICATION, (data) => {
    addNotification(data);
  }, [addNotification]);

  // ── Request push permission ────────────────────────────────
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    const granted = result === 'granted';
    setPushEnabled(granted);
    return granted;
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications],
  );

  const value = {
    notifications,
    unreadCount,
    toasts,
    prefs,
    pushEnabled,
    addNotification,
    toast,
    dismissToast,
    markRead,
    markAllRead,
    clearAll,
    updatePrefs,
    requestPushPermission,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

// ── Toast Container (rendered inside provider) ─────────────────
function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 380, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <Toast key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
}

const TOAST_COLORS = {
  info:    { border: '#3B82F6', icon: 'ℹ', bg: 'rgba(59,130,246,0.12)' },
  success: { border: '#22C55E', icon: '✓', bg: 'rgba(34,197,94,0.12)'  },
  warning: { border: '#F59E0B', icon: '⚠', bg: 'rgba(245,158,11,0.12)' },
  error:   { border: '#EF4444', icon: '✕', bg: 'rgba(239,68,68,0.12)'  },
  system:  { border: '#C9A84C', icon: '🎵', bg: 'rgba(201,168,76,0.12)' },
};

function Toast({ toast, dismiss }) {
  const [visible, setVisible] = useState(false);
  const col = TOAST_COLORS[toast.type] || TOAST_COLORS.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration]);

  return (
    <div
      onClick={() => dismiss(toast.id)}
      style={{
        pointerEvents: 'all', cursor: 'pointer',
        background: `linear-gradient(135deg, #141E33, #1A2540)`,
        border: `1px solid ${col.border}44`,
        borderLeft: `3px solid ${col.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${col.border}11`,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: col.bg, border: `1px solid ${col.border}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, color: col.border, flexShrink: 0,
      }}>
        {col.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, color: '#F0F4FF',
          lineHeight: 1.4, fontWeight: 500,
        }}>
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={(e) => { e.stopPropagation(); toast.action.onClick(); dismiss(toast.id); }}
            style={{
              marginTop: 6, background: 'none', border: 'none',
              color: col.border, fontSize: 12, cursor: 'pointer',
              padding: 0, fontWeight: 600, textDecoration: 'underline',
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
