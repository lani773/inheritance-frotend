/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Toast / Notification Context
   
   Usage:
     const { showToast } = useToast();
     showToast('Member saved!', 'success');
     showToast('Something went wrong', 'error');
     showToast('Processing...', 'info');
     showToast('Are you sure?', 'warning');
   ═══════════════════════════════════════════════════════════════════ */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

// ── Context ────────────────────────────────────────────────────
const ToastContext = createContext(null);

/**
 * ToastProvider — wraps the app. Renders the toast container.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerMap = useRef({});

  // ── Show Toast ─────────────────────────────────────────────
  /**
   * Display a toast notification.
   * @param {string} message - Toast text
   * @param {'success'|'error'|'warning'|'info'} type - Visual type
   * @param {number} duration - Auto-dismiss in ms (default 4000)
   * @returns {string} Toast ID (use to manually dismiss)
   */
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    // Auto-dismiss
    timerMap.current[id] = setTimeout(() => {
      dismissToast(id);
    }, duration);

    return id;
  }, []); // eslint-disable-line

  // ── Dismiss Toast ──────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    // Mark as exiting (triggers CSS exit animation)
    setToasts(prev =>
      prev.map(t => t.id === id ? { ...t, exiting: true } : t)
    );
    // Clear auto-dismiss timer
    clearTimeout(timerMap.current[id]);
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 350);
  }, []);

  // ── Convenience Helpers ────────────────────────────────────
  const success = useCallback((msg, dur) => showToast(msg, 'success', dur), [showToast]);
  const error   = useCallback((msg, dur) => showToast(msg, 'error',   dur), [showToast]);
  const warning = useCallback((msg, dur) => showToast(msg, 'warning', dur), [showToast]);
  const info    = useCallback((msg, dur) => showToast(msg, 'info',    dur), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/**
 * useToast — hook to trigger toasts from any component.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

/* ── Toast Container ──────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 'var(--z-toast, 500)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

/* ── Toast Item ───────────────────────────────────────────────── */
const TOAST_CONFIG = {
  success: {
    icon: '✅',
    borderColor: 'var(--color-success)',
    iconColor: 'var(--color-success)',
  },
  error: {
    icon: '❌',
    borderColor: 'var(--color-error)',
    iconColor: 'var(--color-error)',
  },
  warning: {
    icon: '⚠️',
    borderColor: 'var(--color-warning)',
    iconColor: 'var(--color-warning)',
  },
  info: {
    icon: 'ℹ️',
    borderColor: 'var(--color-info)',
    iconColor: 'var(--color-info)',
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div
      role="alert"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${cfg.borderColor}40`,
        borderLeft: `4px solid ${cfg.borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        pointerEvents: 'all',
        animation: toast.exiting
          ? 'toastOut 0.3s ease forwards'
          : 'toastIn 0.3s ease both',
        maxWidth: '100%',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
        {cfg.icon}
      </span>

      {/* Message */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {toast.message}
      </span>

      {/* Close Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 0 0 4px',
          flexShrink: 0,
          lineHeight: 1,
          transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
      >
        ×
      </button>
    </div>
  );
}

export default ToastContext;
