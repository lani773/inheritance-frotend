/* ═══════════════════════════════════════════════════════════════════
   INHERITANCE CHOIR — Authentication Context + Real-time WebSocket

   Features:
   - Session restore / login / logout
   - Auto-reconnecting WebSocket with exponential backoff
   - Bi-directional WS: send & receive typed events
   - Channel subscriptions (general, admin, voice-part)
   - Presence tracking (online member IDs)
   - WS event emitter for components to subscribe
   ═══════════════════════════════════════════════════════════════════ */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import Storage, { KEYS } from '../storage/engine';
import { SESSION } from '../config/constants';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';

// ── Create Context ─────────────────────────────────────────────
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * Provides session, WebSocket connection, and presence state.
 */
export function AuthProvider({ children }) {
  const [session, setSession]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [isExpired, setIsExpired]     = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket internals
  const wsRef        = useRef(null);  // current WebSocket instance
  const retryRef     = useRef(0);     // reconnect attempt counter
  const retryTimer   = useRef(null);  // reconnect timer
  const listeners    = useRef({});    // eventType → Set<callback>
  const sessionRef   = useRef(null);  // mirror of session for WS callbacks

  // Keep sessionRef in sync
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── WS Event Emitter ───────────────────────────────────────
  const emit = useCallback((type, data) => {
    const cbs = listeners.current[type];
    if (cbs) cbs.forEach(fn => fn(data));
    // Also dispatch to wildcard '*' listeners
    const wildcard = listeners.current['*'];
    if (wildcard) wildcard.forEach(fn => fn({ type, data }));
  }, []);

  /** Subscribe to a WS event type. Returns an unsubscribe function. */
  const onWsEvent = useCallback((type, callback) => {
    if (!listeners.current[type]) listeners.current[type] = new Set();
    listeners.current[type].add(callback);
    return () => listeners.current[type]?.delete(callback);
  }, []);

  // ── WebSocket Connect / Auto-Reconnect ─────────────────────
  const connectWS = useCallback(() => {
    const s = sessionRef.current;
    if (!s?.token) return;

    // Close any existing connection
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.onclose = null; // prevent auto-reconnect from closing
      wsRef.current.close();
    }

    const url = `${WS_URL}?token=${encodeURIComponent(s.token)}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      setWsConnected(true);
      clearTimeout(retryTimer.current);
      emit('ws:connected', {});
      console.info('[WS] Connected');

      // Subscribe to personal channel & admin if applicable
      ws.send(JSON.stringify({ type: 'subscribe', data: { channel: 'general' } }));
      if (s.voicePart) {
        ws.send(JSON.stringify({ type: 'subscribe', data: { channel: s.voicePart.toLowerCase() } }));
      }
      if (s.isAdmin) {
        ws.send(JSON.stringify({ type: 'subscribe', data: { channel: 'admin' } }));
        ws.send(JSON.stringify({ type: 'subscribe', data: { channel: 'finance' } }));
      }

      // Start heartbeat ping every 25s
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);
      ws._pingInterval = pingInterval;
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const { type, data } = msg;

        // Handle presence events internally
        if (type === 'member:online' || type === 'connected') {
          if (data?.onlineMembers) setOnlineMembers(data.onlineMembers);
          else if (data?.memberId) {
            setOnlineMembers(prev => [...new Set([...prev, data.memberId])]);
          }
        }
        if (type === 'member:offline' && data?.memberId) {
          setOnlineMembers(prev => prev.filter(id => id !== data.memberId));
        }

        emit(type, data);
        emit('*', msg);  // wildcard
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS] Error', err);
      emit('ws:error', err);
    };

    ws.onclose = () => {
      clearInterval(ws._pingInterval);
      setWsConnected(false);
      emit('ws:disconnected', {});

      // Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30_000);
      retryRef.current += 1;
      console.info(`[WS] Disconnected — reconnecting in ${delay / 1000}s (attempt ${retryRef.current})`);
      retryTimer.current = setTimeout(() => {
        if (sessionRef.current?.token) connectWS();
      }, delay);
    };
  }, [emit]);

  /** Send a typed message to the server via WebSocket. */
  const wsSend = useCallback((type, data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
      return true;
    }
    return false;
  }, []);

  // ── Restore Session on Mount ───────────────────────────────
  useEffect(() => {
    const storedSession = Storage.get(KEYS.SESSION);

    if (storedSession) {
      const loginTime   = new Date(storedSession.loginTime).getTime();
      const hoursPassed = (Date.now() - loginTime) / (1000 * 60 * 60);
      const rememberMe  = Storage.get(KEYS.REMEMBER);
      const maxHours    = rememberMe ? SESSION.REMEMBER_DAYS * 24 : SESSION.DEFAULT_HOURS;

      if (hoursPassed > maxHours) {
        Storage.remove(KEYS.SESSION);
        Storage.remove(KEYS.REMEMBER);
        setIsExpired(true);
      } else {
        setSession(storedSession);
      }
    }
    setLoading(false);
  }, []);

  // ── Connect WS when session becomes available ──────────────
  useEffect(() => {
    if (session?.token) {
      connectWS();
    } else {
      // Session gone — close WS
      clearTimeout(retryTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
      setOnlineMembers([]);
    }

    return () => {
      clearTimeout(retryTimer.current);
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval);
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [session?.token, connectWS]);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback((userData, rememberMe = false) => {
    const newSession = {
      userId:      userData.id,
      id:          userData.id,
      email:       userData.email,
      name:        userData.fullName,
      fullName:    userData.fullName,
      role:        userData.role,
      voicePart:   userData.voicePart,
      avatarUrl:   userData.avatarUrl,
      isAdmin:     userData.isAdmin || false,
      permissions: userData.permissions || [],
      token:       userData.token || userData.accessToken,
      refreshToken: userData.refreshToken,
      loginTime:   new Date().toISOString(),
    };

    Storage.set(KEYS.SESSION, newSession);
    if (rememberMe) Storage.set(KEYS.REMEMBER, true);
    setSession(newSession);
    setIsExpired(false);
    _appendAuditLog(newSession.email, 'auth.login', 'session', newSession.userId);
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const logout = useCallback((keepRemember = false) => {
    if (session) {
      _appendAuditLog(session.email, 'auth.logout', 'session', session.userId);
    }
    Storage.remove(KEYS.SESSION);
    if (!keepRemember) Storage.remove(KEYS.REMEMBER);
    setSession(null);
  }, [session]);

  // ── Update Session ─────────────────────────────────────────
  const updateSession = useCallback((updates) => {
    if (!session) return;
    const updated = { ...session, ...updates };
    Storage.set(KEYS.SESSION, updated);
    setSession(updated);
  }, [session]);

  // ── Permission Check ───────────────────────────────────────
  const hasPermission = useCallback((permission) => {
    if (!session) return false;
    if (session.isAdmin) return true;
    const perms = session.permissions || [];
    return perms.includes('all') || perms.includes(permission);
  }, [session]);

  const value = {
    session,
    loading,
    isExpired,
    isAuthenticated: !!session,
    isAdmin:         session?.isAdmin || false,
    // WS
    wsConnected,
    onlineMembers,
    onWsEvent,
    wsSend,
    connectWS,
    // Auth
    login,
    logout,
    updateSession,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// ── Internal Helpers ───────────────────────────────────────────
function _appendAuditLog(userEmail, action, resource, resourceId) {
  try {
    const log = Storage.getList(KEYS.AUDIT_LOG);
    const trimmed = [{ id: Date.now(), userEmail, action, resource, resourceId, timestamp: new Date().toISOString() }, ...log].slice(0, 200);
    Storage.set(KEYS.AUDIT_LOG, trimmed);
  } catch (e) {
    console.warn('[Auth] Audit log write failed:', e.message);
  }
}

export default AuthContext;
